<script setup lang="ts">
import { useSortable } from '@vueuse/integrations/useSortable';
import type { ProjectRow } from '~/lib/supabase/projects';
import type { StintRow } from '~/lib/supabase/stints';
import type { DailyProgress } from '~/types/progress';
import { useReorderProjects, useToggleProjectActive } from '~/composables/useProjects';
import { useActiveStintQuery, usePausedStintQuery, useStartStint, usePauseStint, useResumeStint, useCompleteStint, useStintsQuery } from '~/composables/useStints';
import ProjectListCard from './ProjectListCard.vue';
import StintConflictDialog, { type ConflictResolutionAction, type DualConflictInfo } from './StintConflictDialog.vue';
import { parseSafeDate } from '~/utils/date-helpers';

const props = defineProps<{
  projects: ProjectRow[]
  isDraggable?: boolean
}>();

const emit = defineEmits<{
  edit: [project: ProjectRow]
}>();

const isDraggable = computed(() => props.isDraggable ?? false);

const toast = useToast();
const { mutate: reorderProjects, isError, error } = useReorderProjects();
const { mutateAsync: toggleActive } = useToggleProjectActive();
const togglingProjectId = ref<string | null>(null);

const screenReaderAnnouncement = ref<string>('');

const activeListRef = ref<HTMLElement | null>(null);
const localProjects = ref<ProjectRow[]>([...props.projects]);
const isDragging = ref(false);

// Stint management
const { data: activeStint } = useActiveStintQuery();
const { data: pausedStint } = usePausedStintQuery();
const { mutateAsync: startStint, isPending: isStarting } = useStartStint();
const { mutateAsync: pauseStint, isPending: isPausing } = usePauseStint();
const { mutateAsync: resumeStint, isPending: isResuming } = useResumeStint();
const { mutateAsync: completeStint, isPending: isCompleting } = useCompleteStint();

// Completion modal state
const showCompletionModal = ref(false);
const stintToComplete = ref<StintRow | null>(null);

// Conflict dialog state
const showConflictDialog = ref(false);
const conflictStint = ref<{
  id: string
  status: 'active' | 'paused'
  projectName: string
  remainingSeconds: number
} | null>(null);
const dualConflictInfo = ref<DualConflictInfo | null>(null);
const pendingProject = ref<ProjectRow | null>(null);
const isConflictResolving = ref(false);

// Query all stints for daily progress calculation
const { data: allStints } = useStintsQuery();

// Helper function: Get start of day (midnight) for a date
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper function: Calculate remaining seconds for a stint
function calculateRemainingSeconds(stint: StintRow): number {
  if (!stint.started_at || !stint.planned_duration) return 0;

  const now = new Date();
  const startedAt = new Date(stint.started_at);
  const pausedDuration = stint.paused_duration || 0;
  const plannedDurationSeconds = stint.planned_duration * 60;

  if (stint.status === 'active') {
    const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
    return Math.max(0, plannedDurationSeconds - elapsedSeconds + pausedDuration);
  }
  else {
    const pausedAt = stint.paused_at ? new Date(stint.paused_at) : now;
    const elapsedSeconds = Math.floor((pausedAt.getTime() - startedAt.getTime()) / 1000);
    return Math.max(0, plannedDurationSeconds - elapsedSeconds + pausedDuration);
  }
}

// Helper function: Get project name by ID
function getProjectName(projectId: string): string {
  return props.projects.find(p => p.id === projectId)?.name || 'Unknown Project';
}

// Helper function: Add days to a date
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
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

// Computed: Daily progress for all projects (single calculation)
const dailyProgressMap = computed(() => {
  return computeAllDailyProgress(props.projects, allStints.value);
});

// Update local projects when props change (but not during drag)
watch(() => props.projects, (newProjects) => {
  if (!isDragging.value) {
    localProjects.value = [...newProjects];
  }
}, { deep: true });

// Show error toast when reorder fails
watch(isError, (hasError) => {
  if (hasError && error.value) {
    toast.add({
      title: 'Failed to reorder projects',
      description: error.value.message || 'An unexpected error occurred',
      color: 'error',
    });
  }
});

// Writable computed for sortable - allows useSortable to update the array
const sortableProjects = computed({
  get: () => localProjects.value,
  set: (val) => { localProjects.value = val; },
});

// Setup drag-and-drop (only functional when isDraggable is true via handle visibility)
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
  // Check for dual-conflict first - both active AND paused stints exist
  if (activeStint.value && pausedStint.value) {
    dualConflictInfo.value = {
      activeStint: {
        projectName: getProjectName(activeStint.value.project_id),
        remainingSeconds: calculateRemainingSeconds(activeStint.value),
      },
      pausedStint: {
        projectName: getProjectName(pausedStint.value.project_id),
        remainingSeconds: calculateRemainingSeconds(pausedStint.value),
      },
    };
    pendingProject.value = project;
    showConflictDialog.value = true;
    return;
  }

  // Check for active stint - blocks starting, must pause or complete first
  if (activeStint.value) {
    conflictStint.value = {
      id: activeStint.value.id,
      status: 'active',
      projectName: getProjectName(activeStint.value.project_id),
      remainingSeconds: calculateRemainingSeconds(activeStint.value),
    };
    pendingProject.value = project;
    showConflictDialog.value = true;
    return;
  }

  // Check for paused stint - allowed but show dialog for awareness
  if (pausedStint.value) {
    conflictStint.value = {
      id: pausedStint.value.id,
      status: 'paused',
      projectName: getProjectName(pausedStint.value.project_id),
      remainingSeconds: calculateRemainingSeconds(pausedStint.value),
    };
    pendingProject.value = project;
    showConflictDialog.value = true;
    return;
  }

  // No conflicts, start directly
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

async function handleResumePausedStint(stint: StintRow): Promise<void> {
  // Check if there's an active stint - can't resume while another is active
  if (activeStint.value) {
    toast.add({
      title: 'Cannot Resume',
      description: 'Stop or complete the active stint first before resuming the paused one.',
      color: 'warning',
      icon: 'i-lucide-alert-triangle',
    });
    return;
  }

  try {
    await resumeStint(stint.id);
    screenReaderAnnouncement.value = 'Paused stint resumed';
    toast.add({ title: 'Stint resumed', color: 'success' });
  }
  catch (error) {
    screenReaderAnnouncement.value = 'Failed to resume paused stint';
    toast.add({
      title: 'Failed to Resume',
      description: error instanceof Error ? error.message : 'Could not resume stint. Please try again.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
}

async function handleAbandonPausedStint(stint: StintRow): Promise<void> {
  try {
    await completeStint({
      stintId: stint.id,
      completionType: 'interrupted',
    });
    screenReaderAnnouncement.value = 'Paused stint abandoned';
    toast.add({ title: 'Stint abandoned', color: 'neutral' });
  }
  catch (error) {
    screenReaderAnnouncement.value = 'Failed to abandon stint';
    toast.add({
      title: 'Failed to Abandon',
      description: error instanceof Error ? error.message : 'Could not abandon stint. Please try again.',
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
  // For dual-conflict dismissal, just close the dialog
  if (action === 'dismiss-dual-conflict') {
    showConflictDialog.value = false;
    pendingProject.value = null;
    dualConflictInfo.value = null;
    return;
  }

  if (!conflictStint.value || !pendingProject.value) return;

  isConflictResolving.value = true;

  try {
    switch (action) {
      case 'pause-and-switch':
        await pauseStint(conflictStint.value.id);
        await doStartStint(pendingProject.value);
        toast.add({ title: 'Switched projects', color: 'success' });
        break;

      case 'complete-active-and-start':
        await completeStint({
          stintId: conflictStint.value.id,
          completionType: 'manual',
        });
        await doStartStint(pendingProject.value);
        toast.add({ title: 'Completed and started new stint', color: 'success' });
        break;

      case 'start-alongside':
        await doStartStint(pendingProject.value);
        toast.add({ title: 'New stint started', color: 'success' });
        break;

      case 'complete-paused-and-start':
        await completeStint({
          stintId: conflictStint.value.id,
          completionType: 'manual',
        });
        await doStartStint(pendingProject.value);
        toast.add({ title: 'Completed paused and started new stint', color: 'success' });
        break;

      case 'resume-paused':
        await resumeStint(conflictStint.value.id);
        toast.add({ title: 'Resumed paused stint', color: 'success' });
        break;

      case 'cancel':
        break;
    }
  }
  catch (error) {
    toast.add({
      title: 'Action failed',
      description: error instanceof Error ? error.message : 'Unknown error',
      color: 'error',
    });
  }
  finally {
    isConflictResolving.value = false;
    showConflictDialog.value = false;
    pendingProject.value = null;
    conflictStint.value = null;
    dualConflictInfo.value = null;
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

    <!-- Empty state -->
    <div
      v-if="projects.length === 0"
      class="text-center py-12"
    >
      <Icon
        name="i-lucide-folder-open"
        class="h-12 w-12 mx-auto text-neutral-400 dark:text-neutral-600"
      />
      <h3 class="mt-4 text-xl font-semibold leading-snug text-neutral-900 dark:text-neutral-50">
        No projects
      </h3>
      <p class="mt-2 text-sm leading-normal text-neutral-500 dark:text-neutral-400">
        No projects in this category
      </p>
    </div>

    <!-- Projects List -->
    <ul
      v-else
      ref="activeListRef"
      class="space-y-2"
    >
      <ProjectListCard
        v-for="project in sortableProjects"
        :key="project.id"
        :project="project"
        :active-stint="activeStint ?? null"
        :paused-stint="pausedStint ?? null"
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
        @resume-paused-stint="handleResumePausedStint"
        @abandon-paused-stint="handleAbandonPausedStint"
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
      v-if="conflictStint || dualConflictInfo"
      v-model:open="showConflictDialog"
      :existing-stint="conflictStint ?? undefined"
      :dual-conflict="dualConflictInfo ?? undefined"
      :new-project-name="pendingProject?.name ?? 'New Project'"
      :is-pending="isConflictResolving"
      @resolve="handleConflictResolution"
    />
  </div>
</template>
