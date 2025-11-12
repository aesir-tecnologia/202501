<script setup lang="ts">
import type { ProjectRow } from '~/lib/supabase/projects';
import { useProjectsQuery } from '~/composables/useProjects';

definePageMeta({
  title: 'Dashboard',
  middleware: 'auth',
});

useSeoMeta({
  title: 'Dashboard - LifeStint',
  description: 'Review your focus progress and personalized insights.',
});

const { data: projectsData, isLoading } = useProjectsQuery({
  includeInactive: true,
});

const projects = computed(() => projectsData.value ?? []);

// Modal state
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showArchiveModal = ref(false);
const showArchivedProjectsModal = ref(false);
const selectedProject = ref<ProjectRow | null>(null);

// Modal handlers
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

function openArchivedProjectsModal() {
  showArchivedProjectsModal.value = true;
}
</script>

<template>
  <UContainer>
    <div class="space-y-6">
      <!-- Page Header -->
      <div>
        <h1 class="text-3xl font-bold">
          Dashboard
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Manage your projects and start focused work sessions
        </p>
      </div>

      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="text-center py-12"
      >
        <Icon
          name="i-lucide-loader-2"
          class="h-8 w-8 mx-auto animate-spin text-gray-400"
        />
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Loading projects...
        </p>
      </div>

      <!-- Content -->
      <div
        v-else
        class="space-y-6"
      >
        <!-- Projects Section -->
        <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon
                  name="i-lucide-folder-kanban"
                  class="h-5 w-5"
                />
                <h2 class="text-lg font-semibold">
                  Your Projects
                </h2>
              </div>
              <div class="flex items-center gap-2">
                <UTooltip text="View archived projects">
                  <span>
                    <UButton
                      icon="i-lucide-archive"
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      class="transition-all duration-200"
                      @click="openArchivedProjectsModal"
                    >
                      View Archived
                    </UButton>
                  </span>
                </UTooltip>
                <UTooltip text="Create new project">
                  <span>
                    <UButton
                      icon="i-lucide-plus"
                      size="sm"
                      class="transition-all duration-200"
                      @click="openCreateModal"
                    >
                      Create Project
                    </UButton>
                  </span>
                </UTooltip>
              </div>
            </div>
          </template>

          <ProjectList
            :projects="projects"
            @edit="openEditModal"
            @archive="openArchiveModal"
          />
        </UCard>
      </div>
    </div>

    <!-- Modals -->
    <ProjectCreateModal
      v-model:open="showCreateModal"
    />

    <ProjectEditModal
      v-if="selectedProject"
      v-model:open="showEditModal"
      :project="selectedProject"
      @archive="openArchiveModal"
    />

    <ProjectArchiveModal
      v-if="selectedProject"
      v-model:open="showArchiveModal"
      :project="selectedProject"
    />

    <ArchivedProjectsModal
      v-model:open="showArchivedProjectsModal"
    />
  </UContainer>
</template>
