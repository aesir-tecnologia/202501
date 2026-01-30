<script setup lang="ts">
import { useProjectsQuery, useArchivedProjectsQuery, useToggleProjectActive } from '~/composables/useProjects';
import { useActiveStintQuery, usePauseStint, useResumeStint, useStintsQuery, useCompleteStint } from '~/composables/useStints';
import { usePreferencesQuery, useUpdatePreferences } from '~/composables/usePreferences';
import type { ProjectRow } from '~/lib/supabase/projects';
import type { StintRow } from '~/lib/supabase/stints';
import { startOfDay, addDays, format } from 'date-fns';
import { parseSafeDate } from '~/utils/date-helpers';
import { detectMidnightSpan, formatAttributionDates } from '~/utils/midnight-detection';

definePageMeta({
  title: 'Dashboard',
  middleware: 'auth',
});

useSeoMeta({
  title: 'Dashboard - LifeStint',
  description: 'Review your focus progress and personalized insights.',
});

const { data: projectsData, isLoading: isLoadingProjects } = useProjectsQuery({
  includeInactive: true,
});
const { data: archivedProjectsData, isLoading: isLoadingArchived } = useArchivedProjectsQuery();

const projects = computed(() => projectsData.value ?? []);
const archivedProjects = computed(() => archivedProjectsData.value ?? []);

const selectedTab = ref<'active' | 'inactive' | 'archived'>('active');

const tabItems = [
  { label: 'Active', value: 'active', icon: 'i-lucide-circle-dot', slot: 'active' },
  { label: 'Inactive', value: 'inactive', icon: 'i-lucide-pause-circle', slot: 'inactive' },
  { label: 'Archived', value: 'archived', icon: 'i-lucide-archive', slot: 'archived' },
];

const activeProjects = computed(() => projects.value.filter(p => p.is_active));
const inactiveProjects = computed(() => projects.value.filter(p => !p.is_active));

const totalProjectCount = computed(() => projects.value.length);
const hasInactiveProjects = computed(() => projects.value.some(p => !p.is_active));

const hasCompletedStintsToday = computed(() => {
  if (!allStints.value) return false;
  const todayStart = startOfDay(new Date());
  const tomorrow = addDays(todayStart, 1);
  return allStints.value.some((stint) => {
    if (stint.status !== 'completed' || !stint.ended_at) return false;
    const endedAt = parseSafeDate(stint.ended_at);
    return endedAt && endedAt >= todayStart && endedAt < tomorrow;
  });
});

const isLoading = computed(() => {
  if (selectedTab.value === 'archived') {
    return isLoadingArchived.value;
  }
  return isLoadingProjects.value;
});

const showCreateModal = ref(false);
const showEditModal = ref(false);
const showArchiveModal = ref(false);
const showCompletionModal = ref(false);
const selectedProject = ref<ProjectRow | null>(null);
const stintToComplete = ref<StintRow | null>(null);

const toast = useToast();
const { mutateAsync: toggleActive, isPending: isTogglingActive } = useToggleProjectActive();

const { data: activeStint } = useActiveStintQuery();
const { mutateAsync: pauseStint, isPending: _isPausing } = usePauseStint();
const { mutateAsync: resumeStint, isPending: _isResuming } = useResumeStint();
const { mutateAsync: completeStint, isPending: _isCompleting } = useCompleteStint();
const { data: allStints } = useStintsQuery();
const { data: preferencesData } = usePreferencesQuery();
const { mutateAsync: updatePreferences } = useUpdatePreferences();

const activeProject = computed(() => {
  const stint = activeStint.value;
  if (!stint) return null;
  return projects.value.find(p => p.id === stint.project_id) || null;
});

const dailyProgress = computed(() => {
  const project = activeProject.value;
  if (!project) return { completed: 0, expected: 0 };

  const expected = project.expected_daily_stints ?? 0;
  let completed = 0;

  const todayStart = startOfDay(new Date());
  const tomorrow = addDays(todayStart, 1);
  const todayStr = format(todayStart, 'yyyy-MM-dd');

  if (allStints.value) {
    for (const stint of allStints.value) {
      if (stint.project_id !== project.id) continue;
      if (stint.status !== 'completed' || !stint.ended_at) continue;

      if (stint.attributed_date) {
        if (stint.attributed_date === todayStr) {
          completed++;
        }
      }
      else {
        const endedAt = parseSafeDate(stint.ended_at);
        if (endedAt && endedAt >= todayStart && endedAt < tomorrow) {
          completed++;
        }
      }
    }
  }

  return { completed, expected };
});

const midnightSpanInfo = computed(() => {
  if (!stintToComplete.value) return null;
  return detectMidnightSpan(stintToComplete.value);
});

const midnightSpanLabels = computed(() => {
  if (!midnightSpanInfo.value) return null;
  return formatAttributionDates(midnightSpanInfo.value);
});

const shouldShowDayAttribution = computed(() => {
  if (!midnightSpanInfo.value?.spansMidnight) return false;
  return preferencesData.value?.stintDayAttribution === 'ask';
});

const presetAttributedDate = computed(() => {
  if (!midnightSpanInfo.value?.spansMidnight) return undefined;
  const preference = preferencesData.value?.stintDayAttribution;
  if (preference === 'start_date') return midnightSpanInfo.value.startDate;
  if (preference === 'end_date') return midnightSpanInfo.value.endDate;
  return undefined;
});

function openCreateModal() {
  showCreateModal.value = true;
}

function openEditModal(project: ProjectRow) {
  selectedProject.value = project;
  showEditModal.value = true;
}

function openArchiveModal(project: ProjectRow) {
  selectedProject.value = project;
  showArchiveModal.value = true;
}

async function handleToggleActive(project: ProjectRow) {
  try {
    await toggleActive(project.id);
    const newStatus = project.is_active ? 'inactive' : 'active';
    toast.add({
      title: project.is_active ? 'Project deactivated' : 'Project activated',
      description: `${project.name} is now ${newStatus}`,
      color: 'success',
    });
  }
  catch (error) {
    toast.add({
      title: 'Failed to toggle project status',
      description: error instanceof Error ? error.message : 'An unexpected error occurred',
      color: 'error',
    });
  }
}

async function handlePauseStint(stint: StintRow) {
  try {
    await pauseStint(stint.id);
  }
  catch (error) {
    toast.add({
      title: 'Failed to pause stint',
      description: error instanceof Error ? error.message : 'An unexpected error occurred',
      color: 'error',
    });
  }
}

async function handleResumeStint(stint: StintRow) {
  try {
    await resumeStint(stint.id);
  }
  catch (error) {
    toast.add({
      title: 'Failed to resume stint',
      description: error instanceof Error ? error.message : 'An unexpected error occurred',
      color: 'error',
    });
  }
}

function handleCompleteStint(stint: StintRow) {
  stintToComplete.value = stint;
  showCompletionModal.value = true;
}

async function handleConfirmComplete(payload: { notes: string, attributedDate?: string, rememberChoice?: boolean }) {
  if (!stintToComplete.value) return;
  try {
    const finalAttributedDate = payload.attributedDate || presetAttributedDate.value;

    await completeStint({
      stintId: stintToComplete.value.id,
      completionType: 'manual',
      notes: payload.notes || undefined,
      attributedDate: finalAttributedDate,
    });

    if (payload.rememberChoice && payload.attributedDate && midnightSpanInfo.value) {
      const newPref = payload.attributedDate === midnightSpanInfo.value.startDate
        ? 'start_date' as const
        : 'end_date' as const;
      try {
        await updatePreferences({ stintDayAttribution: newPref });
      }
      catch (prefError) {
        toast.add({
          title: 'Preference not saved',
          description: prefError instanceof Error
            ? prefError.message
            : 'The stint was completed, but we could not save your preference.',
          color: 'warning',
        });
      }
    }
  }
  catch (error) {
    toast.add({
      title: 'Failed to complete stint',
      description: error instanceof Error ? error.message : 'An unexpected error occurred',
      color: 'error',
    });
  }
  finally {
    stintToComplete.value = null;
  }
}
</script>

<template>
  <div>
    <UContainer class="py-6 lg:py-8">
      <!-- 2-column grid layout -->
      <div class="flex flex-col lg:grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
        <!-- Main Content: Projects (order depends on active session on mobile, always first on desktop) -->
        <section
          class="w-full space-y-6 lg:order-1"
          :class="activeStint ? 'order-2' : 'order-1'"
        >
          <!-- Header -->
          <div class="flex items-center justify-between">
            <h2 class="text-xl lg:text-2xl font-semibold font-serif text-stone-900 dark:text-stone-50">
              Your Projects
            </h2>
            <UButton
              icon="i-lucide-plus"
              class="motion-safe:transition-all motion-safe:duration-200"
              @click="openCreateModal"
            >
              New Project
            </UButton>
          </div>

          <!-- Loading State -->
          <div
            v-if="isLoading"
            class="text-center py-12"
          >
            <Icon
              name="i-lucide-loader-2"
              class="h-8 w-8 mx-auto motion-safe:animate-spin text-neutral-400 dark:text-neutral-500"
            />
            <p class="mt-2 text-sm leading-normal text-neutral-500 dark:text-neutral-400">
              Loading projects...
            </p>
          </div>

          <!-- Projects Tabs -->
          <UTabs
            v-if="!isLoading"
            v-model="selectedTab"
            :items="tabItems"
            class="w-full"
          >
            <template #active>
              <div class="pt-4">
                <ProjectList
                  :projects="activeProjects"
                  :is-draggable="true"
                  tab="active"
                  :total-project-count="totalProjectCount"
                  :has-inactive-projects="hasInactiveProjects"
                  :has-completed-stints-today="hasCompletedStintsToday"
                  @edit="openEditModal"
                  @create-project="openCreateModal"
                  @switch-tab="selectedTab = $event"
                />
              </div>
            </template>

            <template #inactive>
              <div class="pt-4">
                <ProjectList
                  :projects="inactiveProjects"
                  :is-draggable="false"
                  tab="inactive"
                  :total-project-count="totalProjectCount"
                  :has-inactive-projects="hasInactiveProjects"
                  :has-completed-stints-today="hasCompletedStintsToday"
                  @edit="openEditModal"
                  @create-project="openCreateModal"
                  @switch-tab="selectedTab = $event"
                />
              </div>
            </template>

            <template #archived>
              <div class="pt-4">
                <ArchivedProjectsList
                  :projects="archivedProjects"
                  @switch-tab="selectedTab = $event"
                />
              </div>
            </template>
          </UTabs>
        </section>

        <!-- Sidebar (order depends on active session on mobile, always second on desktop) -->
        <DashboardSidebar
          class="w-full lg:order-2"
          :class="activeStint ? 'order-1' : 'order-2'"
          :active-stint="activeStint ?? null"
          :active-project="activeProject"
          :daily-progress="dailyProgress"
          @pause-stint="handlePauseStint"
          @resume-stint="handleResumeStint"
          @complete-stint="handleCompleteStint"
        />
      </div>
    </UContainer>

    <!-- Modals -->
    <ProjectCreateModal
      v-model:open="showCreateModal"
    />

    <ProjectEditModal
      v-if="selectedProject"
      v-model:open="showEditModal"
      :project="selectedProject"
      :is-toggling-active="isTogglingActive"
      @archive="openArchiveModal"
      @toggle-active="handleToggleActive"
    />

    <ProjectArchiveModal
      v-if="selectedProject"
      v-model:open="showArchiveModal"
      :project="selectedProject"
    />

    <StintCompletionModal
      v-if="stintToComplete"
      v-model:open="showCompletionModal"
      :stint-id="stintToComplete.id"
      :spans-midnight="shouldShowDayAttribution"
      :start-date="midnightSpanInfo?.startDate"
      :end-date="midnightSpanInfo?.endDate"
      :start-date-label="midnightSpanLabels?.startLabel"
      :end-date-label="midnightSpanLabels?.endLabel"
      @confirm="handleConfirmComplete"
      @cancel="stintToComplete = null"
    />
  </div>
</template>
