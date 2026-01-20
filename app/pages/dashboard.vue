<script setup lang="ts">
import { useProjectsQuery, useArchivedProjectsQuery, useToggleProjectActive } from '~/composables/useProjects';
import { useActiveStintQuery, usePauseStint, useResumeStint, useStintsQuery, useCompleteStint } from '~/composables/useStints';
import type { ProjectRow } from '~/lib/supabase/projects';
import type { StintRow } from '~/lib/supabase/stints';
import { parseSafeDate } from '~/utils/date-helpers';

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

const activeProject = computed(() => {
  const stint = activeStint.value;
  if (!stint) return null;
  return projects.value.find(p => p.id === stint.project_id) || null;
});

const dailyProgress = computed(() => {
  const todayStart = startOfDay(new Date());
  const tomorrow = addDays(todayStart, 1);

  let completed = 0;
  let expected = 0;

  for (const project of activeProjects.value) {
    expected += project.expected_daily_stints ?? 0;
  }

  if (allStints.value) {
    for (const stint of allStints.value) {
      if (stint.status !== 'completed' || !stint.ended_at) continue;
      const endedAt = parseSafeDate(stint.ended_at);
      if (endedAt && endedAt >= todayStart && endedAt < tomorrow) {
        completed++;
      }
    }
  }

  return { completed, expected };
});

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

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
    toast.add({
      title: 'Stint paused',
      description: 'Take a break, you can resume anytime.',
      color: 'success',
    });
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
    toast.add({
      title: 'Stint resumed',
      description: 'Welcome back! Timer is running.',
      color: 'success',
    });
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

async function handleConfirmComplete(notes: string) {
  if (!stintToComplete.value) return;
  try {
    await completeStint({
      stintId: stintToComplete.value.id,
      completionType: 'manual',
      notes: notes || undefined,
    });
    toast.add({
      title: 'Stint completed',
      description: 'Great work! Your stint has been recorded.',
      color: 'success',
    });
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
        <!-- Main Content: Projects (order-2 on mobile, order-1 on desktop) -->
        <section class="order-2 lg:order-1 w-full space-y-6">
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
                  @edit="openEditModal"
                />
              </div>
            </template>

            <template #inactive>
              <div class="pt-4">
                <ProjectList
                  :projects="inactiveProjects"
                  :is-draggable="false"
                  @edit="openEditModal"
                />
              </div>
            </template>

            <template #archived>
              <div class="pt-4">
                <ArchivedProjectsList :projects="archivedProjects" />
              </div>
            </template>
          </UTabs>
        </section>

        <!-- Sidebar (order-1 on mobile, order-2 on desktop) -->
        <DashboardSidebar
          class="order-1 lg:order-2 w-full"
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
      @confirm="handleConfirmComplete"
    />
  </div>
</template>
