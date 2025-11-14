<script setup lang="ts">
import { useProjectsQuery } from '~/composables/useProjects';
import type { ProjectRow } from '~/lib/supabase/projects';

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
    <UPage>
      <UPageHeader
        title="Dashboard"
        description="Manage your projects and start focused work sessions"
      />

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
        <!-- Projects Section -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <h2 class="text-lg font-semibold leading-snug text-neutral-900 dark:text-neutral-50">
                  Your Projects
                </h2>
              </div>
              <div class="flex items-center gap-2">
                <UButton
                  icon="i-lucide-archive"
                  color="neutral"
                  class="motion-safe:transition-all motion-safe:duration-200"
                  @click="openArchivedProjectsModal"
                >
                  View Archived
                </UButton>
                <UButton
                  icon="i-lucide-plus"
                  class="motion-safe:transition-all motion-safe:duration-200"
                  @click="openCreateModal"
                >
                  Create Project
                </UButton>
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
    </UPage>

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
