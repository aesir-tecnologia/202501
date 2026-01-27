<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { useSortable } from '@vueuse/integrations/useSortable';
import { useReorderProjects, useToggleProjectActive } from '~/composables/useProjects';
import {
  stintKeys,
  useActiveStintQuery,
  useCompleteStint,
  usePausedStintsMap,
  usePauseStint,
  useResumeStint,
  useStartStint,
  useStintsQuery,
} from '~/composables/useStints';
import { getRandomPreWorkQuote } from '~/constants/motivational-quotes';
import type { ProjectRow } from '~/lib/supabase/projects';
import type { StintRow } from '~/lib/supabase/stints';
import type { DailyProgress } from '~/types/progress';
import { startOfDay, addDays } from 'date-fns';
import { parseSafeDate } from '~/utils/date-helpers';
import { calculateRemainingSeconds } from '~/utils/stint-time';
import ProjectListCard from './ProjectListCard.vue';
import StintConflictDialog, { type ConflictResolutionAction } from './StintConflictDialog.vue';

const props = defineProps<{
  projects: ProjectRow[]
  isDraggable?: boolean
  tab: 'active' | 'inactive'
  totalProjectCount: number
  hasInactiveProjects: boolean
  hasCompletedStintsToday: boolean
}>();

const emit = defineEmits<{
  edit: [project: ProjectRow]
  createProject: []
  switchTab: [tab: 'active' | 'inactive' | 'archived']
}>();

type EmptyStateType = 'no-projects' | 'all-inactive' | 'no-inactive-projects' | null;

const emptyStateType = computed<EmptyStateType>(() => {
  if (props.projects.length > 0) return null;

  if (props.tab === 'active') {
    if (props.totalProjectCount === 0) return 'no-projects';
    if (props.hasInactiveProjects) return 'all-inactive';
  }

  if (props.tab === 'inactive') return 'no-inactive-projects';

  return null;
});

const motivationalQuote = ref(getRandomPreWorkQuote());

const showNoStintsBanner = computed(() => {
  return props.tab === 'active'
    && props.projects.length > 0
    && !props.hasCompletedStintsToday;
});

const isDraggable = computed(() => props.isDraggable ?? false);

const toast = useToast();
const queryClient = useQueryClient();
const { mutate: reorderProjects, isError, error } = useReorderProjects();
const { mutateAsync: toggleActive } = useToggleProjectActive();
const togglingProjectId = ref<string | null>(null);

const screenReaderAnnouncement = ref<string>('');

const activeListRef = ref<HTMLElement | null>(null);
const localProjects = ref<ProjectRow[]>([...props.projects]);
const isDragging = ref(false);

const { data: activeStint } = useActiveStintQuery();
const { map: pausedStintsMap, error: pausedStintsError } = usePausedStintsMap();
const { mutateAsync: startStint, isPending: isStarting } = useStartStint();
const { mutateAsync: pauseStint, isPending: isPausing } = usePauseStint();
const { mutateAsync: resumeStint, isPending: isResuming } = useResumeStint();
const { mutateAsync: completeStint, isPending: isCompleting } = useCompleteStint();

const showCompletionModal = ref(false);
const stintToComplete = ref<StintRow | null>(null);

const showConflictDialog = ref(false);
const conflictStint = ref<{
  id: string
  projectName: string
  remainingSeconds: number
} | null>(null);
const pendingProject = ref<ProjectRow | null>(null);
const isConflictResolving = ref(false);

const { data: allStints } = useStintsQuery();

function getProjectName(projectId: string): string {
  return props.projects.find(p => p.id === projectId)?.name || 'Unknown Project';
}

function computeAllDailyProgress(
  projects: ProjectRow[],
  stints: StintRow[] | undefined,
): Map<string, DailyProgress> {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  const completedCounts = new Map<string, number>();

  if (stints) {
    for (const stint of stints) {
      if (stint.status !== 'completed' || !stint.ended_at) continue;

      const endedAt = parseSafeDate(stint.ended_at);
      if (endedAt && endedAt >= today && endedAt < tomorrow) {
        const currentCount = completedCounts.get(stint.project_id) || 0;
        completedCounts.set(stint.project_id, currentCount + 1);
      }
    }
  }

  const progressMap = new Map<string, DailyProgress>();

  for (const project of projects) {
    const completed = completedCounts.get(project.id) || 0;
    const expected = Math.max(0, project.expected_daily_stints ?? 0);
    const percentage = expected > 0 ? Math.min((completed / expected) * 100, 100) : 0;

    progressMap.set(project.id, {
      projectId: project.id,
      completed,
      expected,
      percentage,
      isOverAchieving: expected > 0 && completed > expected,
      isMet: expected > 0 && completed >= expected,
    });
  }

  return progressMap;
}

const dailyProgressMap = computed(() => {
  return computeAllDailyProgress(props.projects, allStints.value);
});

// Update local projects when props change (but not during drag)
watch(() => props.projects, (newProjects) => {
  if (!isDragging.value) {
    localProjects.value = [...newProjects];
  }
}, { deep: true });

watch(isError, (hasError) => {
  if (hasError && error.value) {
    toast.add({
      title: 'Failed to reorder projects',
      description: error.value.message || 'An unexpected error occurred',
      color: 'error',
    });
  }
});

watch(pausedStintsError, (err) => {
  if (err) {
    toast.add({
      title: 'Failed to load paused stints',
      description: err.message || 'Could not fetch paused stints. Some project states may be incorrect.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
});

const sortableProjects = computed({
  get: () => localProjects.value,
  set: (val) => { localProjects.value = val; },
});

useSortable(activeListRef, sortableProjects, {
  animation: 150,
  handle: '.drag-handle',
  onStart: () => {
    isDragging.value = true;
  },
  onEnd: (evt: { oldIndex?: number, newIndex?: number }) => {
    if (evt.oldIndex !== undefined && evt.newIndex !== undefined && evt.oldIndex !== evt.newIndex) {
      const newOrder = [...sortableProjects.value];
      const [movedItem] = newOrder.splice(evt.oldIndex, 1);

      if (movedItem) {
        newOrder.splice(evt.newIndex, 0, movedItem);
        localProjects.value = newOrder;

        isDragging.value = false;
        reorderProjects(newOrder);
      }
      else {
        isDragging.value = false;
      }
    }
    else {
      isDragging.value = false;
    }
  },
});

function handleEdit(project: ProjectRow) {
  emit('edit', project);
}

async function handleToggleActive(project: ProjectRow) {
  togglingProjectId.value = project.id;
  try {
    await toggleActive(project.id);
    const newStatus = project.is_active ? 'inactive' : 'active';
    screenReaderAnnouncement.value = `${project.name} is now ${newStatus}`;
    toast.add({
      title: project.is_active ? 'Project deactivated' : 'Project activated',
      description: `${project.name} is now ${newStatus}`,
      color: 'success',
    });
  }
  catch (error) {
    screenReaderAnnouncement.value = `Failed to toggle ${project.name} status`;
    toast.add({
      title: 'Failed to toggle project status',
      description: error instanceof Error ? error.message : 'An unexpected error occurred',
      color: 'error',
    });
  }
  finally {
    togglingProjectId.value = null;
  }
}

async function handleStartStint(project: ProjectRow): Promise<void> {
  if (activeStint.value) {
    conflictStint.value = {
      id: activeStint.value.id,
      projectName: getProjectName(activeStint.value.project_id),
      remainingSeconds: calculateRemainingSeconds(activeStint.value),
    };
    pendingProject.value = project;
    showConflictDialog.value = true;
    return;
  }

  await doStartStint(project);
}

async function doStartStint(project: ProjectRow): Promise<void> {
  try {
    await startStint({
      projectId: project.id,
      plannedDurationMinutes: project.custom_stint_duration ?? undefined,
    });

    screenReaderAnnouncement.value = `Started working on ${project.name}`;
  }
  catch (error) {
    const errorWithConflict = error as Error & { conflict?: StintRow };

    if (errorWithConflict.conflict) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: stintKeys.active() }),
        queryClient.invalidateQueries({ queryKey: stintKeys.paused() }),
      ]);

      const existingStint = errorWithConflict.conflict;
      conflictStint.value = {
        id: existingStint.id,
        projectName: getProjectName(existingStint.project_id),
        remainingSeconds: calculateRemainingSeconds(existingStint),
      };
      pendingProject.value = project;
      showConflictDialog.value = true;
      return;
    }

    screenReaderAnnouncement.value = `Failed to start stint on ${project.name}`;
    toast.add({
      title: 'Failed to Start Stint',
      description: error instanceof Error ? error.message : 'Could not start stint. Please try again.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
}

async function handlePauseStint(stint: StintRow): Promise<void> {
  try {
    await pauseStint(stint.id);
    screenReaderAnnouncement.value = 'Stint paused';
  }
  catch (error) {
    screenReaderAnnouncement.value = 'Failed to pause stint';
    toast.add({
      title: 'Failed to Pause Stint',
      description: error instanceof Error ? error.message : 'Could not pause stint. Please try again.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
}

async function handleResumeStint(stint: StintRow): Promise<void> {
  try {
    await resumeStint(stint.id);
    screenReaderAnnouncement.value = 'Stint resumed';
  }
  catch (error) {
    screenReaderAnnouncement.value = 'Failed to resume stint';
    toast.add({
      title: 'Failed to Resume Stint',
      description: error instanceof Error ? error.message : 'Could not resume stint. Please try again.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
}

function handleCompleteStint(stint: StintRow): void {
  stintToComplete.value = stint;
  showCompletionModal.value = true;
}

function handleCompletionCancel(): void {
  showCompletionModal.value = false;
  stintToComplete.value = null;
}

async function handleCompletionConfirm(notes: string): Promise<void> {
  if (!stintToComplete.value) return;

  try {
    await completeStint({
      stintId: stintToComplete.value.id,
      completionType: 'manual',
      notes: notes || undefined,
    });
    screenReaderAnnouncement.value = 'Stint completed';
  }
  catch (error) {
    screenReaderAnnouncement.value = 'Failed to complete stint';
    toast.add({
      title: 'Failed to Complete Stint',
      description: error instanceof Error ? error.message : 'Could not complete stint. Please try again.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
  finally {
    showCompletionModal.value = false;
    stintToComplete.value = null;
  }
}

async function handleConflictResolution(action: ConflictResolutionAction): Promise<void> {
  if (!conflictStint.value) {
    console.error('[ProjectList] handleConflictResolution called without conflictStint', { action });
    toast.add({
      title: 'Unexpected Error',
      description: 'Conflict state was lost. Please try again.',
      color: 'error',
    });
    showConflictDialog.value = false;
    return;
  }

  if (!pendingProject.value) {
    console.error('[ProjectList] handleConflictResolution called without pendingProject', { action });
    toast.add({
      title: 'Unexpected Error',
      description: 'Target project was lost. Please try again.',
      color: 'error',
    });
    showConflictDialog.value = false;
    conflictStint.value = null;
    return;
  }

  const currentConflictStint = conflictStint.value;
  const currentPendingProject = pendingProject.value;

  isConflictResolving.value = true;

  try {
    switch (action) {
      case 'pause-and-switch':
        try {
          await pauseStint(currentConflictStint.id);
        }
        catch (pauseError) {
          toast.add({
            title: 'Failed to Pause',
            description: pauseError instanceof Error ? pauseError.message : 'Could not pause current stint.',
            color: 'error',
            icon: 'i-lucide-alert-circle',
          });
          break;
        }
        try {
          await doStartStint(currentPendingProject);
        }
        catch (startError) {
          toast.add({
            title: 'Partial Switch',
            description: `Current stint paused, but couldn't start new stint: ${startError instanceof Error ? startError.message : 'Unknown error'}`,
            color: 'warning',
            icon: 'i-lucide-alert-triangle',
          });
        }
        break;

      case 'complete-active-and-start':
        try {
          await completeStint({
            stintId: currentConflictStint.id,
            completionType: 'manual',
          });
        }
        catch (completeError) {
          toast.add({
            title: 'Failed to Complete',
            description: completeError instanceof Error ? completeError.message : 'Could not complete current stint.',
            color: 'error',
            icon: 'i-lucide-alert-circle',
          });
          break;
        }
        try {
          await doStartStint(currentPendingProject);
        }
        catch (startError) {
          toast.add({
            title: 'Partial Completion',
            description: `Previous stint completed, but couldn't start new stint: ${startError instanceof Error ? startError.message : 'Unknown error'}`,
            color: 'warning',
            icon: 'i-lucide-alert-triangle',
          });
        }
        break;

      case 'cancel':
        break;

      default: {
        console.error('[ProjectList] Unhandled conflict resolution action:', action);
      }
    }
  }
  finally {
    isConflictResolving.value = false;
    showConflictDialog.value = false;
    pendingProject.value = null;
    conflictStint.value = null;
  }
}
</script>

<template>
  <div>
    <!-- Screen reader announcements -->
    <div
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
    >
      {{ screenReaderAnnouncement }}
    </div>

    <!-- No Stints Today Banner (above project list, when projects exist) -->
    <div
      v-if="showNoStintsBanner"
      class="mb-4 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 p-4"
    >
      <div class="flex items-start gap-3">
        <Icon
          name="i-lucide-sun"
          class="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5"
        />
        <div>
          <p class="text-sm font-medium text-orange-800 dark:text-orange-200">
            Start your first stint of the day
          </p>
          <p class="mt-1 text-sm text-orange-700 dark:text-orange-300 italic">
            "{{ motivationalQuote }}"
          </p>
        </div>
      </div>
    </div>

    <!-- Empty State: No Projects -->
    <div
      v-if="emptyStateType === 'no-projects'"
      class="text-center py-12"
    >
      <Icon
        name="i-lucide-rocket"
        class="h-12 w-12 mx-auto text-stone-400 dark:text-stone-600"
      />
      <h3 class="mt-4 font-serif text-lg font-medium text-stone-900 dark:text-stone-100">
        Start your first project
      </h3>
      <p class="mt-2 text-sm text-stone-500 dark:text-stone-400">
        Create a project to begin tracking your focused work sessions.
      </p>
      <UButton
        color="primary"
        class="mt-4"
        icon="i-lucide-plus"
        @click="emit('createProject')"
      >
        New Project
      </UButton>
    </div>

    <!-- Empty State: All Projects Inactive -->
    <div
      v-else-if="emptyStateType === 'all-inactive'"
      class="text-center py-12"
    >
      <Icon
        name="i-lucide-pause-circle"
        class="h-12 w-12 mx-auto text-stone-400 dark:text-stone-600"
      />
      <h3 class="mt-4 font-serif text-lg font-medium text-stone-900 dark:text-stone-100">
        No active projects
      </h3>
      <p class="mt-2 text-sm text-stone-500 dark:text-stone-400">
        Activate a project to get started with your focus sessions.
      </p>
      <UButton
        color="primary"
        variant="outline"
        class="mt-4"
        icon="i-lucide-play"
        @click="emit('switchTab', 'inactive')"
      >
        View Inactive Projects
      </UButton>
    </div>

    <!-- Empty State: No Inactive Projects (positive message) -->
    <div
      v-else-if="emptyStateType === 'no-inactive-projects'"
      class="text-center py-12"
    >
      <Icon
        name="i-lucide-check-circle"
        class="h-12 w-12 mx-auto text-green-500 dark:text-green-400"
      />
      <h3 class="mt-4 font-serif text-lg font-medium text-stone-900 dark:text-stone-100">
        All projects are active
      </h3>
      <p class="mt-2 text-sm text-stone-500 dark:text-stone-400">
        You have no inactive projects. Great job keeping things moving!
      </p>
      <UButton
        color="neutral"
        variant="ghost"
        class="mt-4"
        @click="emit('switchTab', 'active')"
      >
        Back to Active Projects
      </UButton>
    </div>

    <!-- Projects List -->
    <ul
      v-else-if="projects.length > 0"
      ref="activeListRef"
      class="space-y-2"
    >
      <ProjectListCard
        v-for="project in sortableProjects"
        :key="project.id"
        :project="project"
        :active-stint="activeStint ?? null"
        :paused-stint="pausedStintsMap.get(project.id) ?? null"
        :daily-progress="dailyProgressMap.get(project.id) ?? {
          projectId: project.id,
          completed: 0,
          expected: project.expected_daily_stints ?? 0,
          percentage: 0,
          isOverAchieving: false,
          isMet: false,
        }"
        :is-toggling="togglingProjectId === project.id"
        :is-starting="isStarting"
        :is-pausing="isPausing || isResuming"
        :is-completing="isCompleting"
        :is-draggable="isDraggable"
        @edit="handleEdit"
        @toggle-active="handleToggleActive"
        @start-stint="handleStartStint"
        @pause-stint="handlePauseStint"
        @resume-stint="handleResumeStint"
        @complete-stint="handleCompleteStint"
      />
    </ul>

    <!-- Stint Completion Modal -->
    <StintCompletionModal
      v-model:open="showCompletionModal"
      :stint-id="stintToComplete?.id ?? ''"
      @cancel="handleCompletionCancel"
      @confirm="handleCompletionConfirm"
    />

    <!-- Stint Conflict Dialog -->
    <StintConflictDialog
      v-if="conflictStint"
      v-model:open="showConflictDialog"
      :existing-stint="conflictStint ?? undefined"
      :new-project-name="pendingProject?.name ?? 'New Project'"
      :is-pending="isConflictResolving"
      @resolve="handleConflictResolution"
    />
  </div>
</template>
