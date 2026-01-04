<script setup lang="ts">
import { useProjectsQuery, useArchivedProjectsQuery, useToggleProjectActive } from '~/composables/useProjects';
import type { ProjectRow } from '~/lib/supabase/projects';

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
const selectedProject = ref<ProjectRow | null>(null);

const toast = useToast();
const { mutateAsync: toggleActive, isPending: isTogglingActive } = useToggleProjectActive();

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
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        title="Dashboard"
        description="Manage your projects and start focused work sessions"
      />

      <!-- Streak Banner -->
      <StreakBanner />

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

      <!-- Content -->
      <div
        v-else
        class="space-y-6"
      >
        <!-- Projects Section with Tabs -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold leading-snug text-neutral-900 dark:text-neutral-50">
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
          </template>

          <UTabs
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
        </UCard>
      </div>
    </UPage>

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
  </UContainer>
</template>
