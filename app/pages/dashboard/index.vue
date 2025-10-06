<script setup lang="ts">
import { computed } from 'vue'
import { listProjects } from '~/lib/supabase/projects'
import type { ProjectRow } from '~/lib/supabase/projects'

definePageMeta({
  title: 'Dashboard',
  middleware: 'auth',
})

useSeoMeta({
  title: 'Dashboard - LifeStint',
  description: 'Review your focus progress and personalized insights.',
})

const user = useSupabaseUser()
const client = useSupabaseClient()

const displayName = computed(() => {
  return user.value?.user_metadata?.full_name || user.value?.email || 'there'
})

// Project management state
const projects = ref<ProjectRow[]>([])
const isLoading = ref(true)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedProject = ref<ProjectRow | null>(null)

// Load projects on mount
onMounted(async () => {
  try {
    const { data, error } = await listProjects(client)
    if (error) {
      console.error('Failed to load projects:', error)
    } else {
      projects.value = data ?? []
    }
  }
  catch (error) {
    console.error('Failed to load projects:', error)
  }
  finally {
    isLoading.value = false
  }
})

// Modal handlers
function openCreateModal() {
  showCreateModal.value = true
}

function openEditModal(project: ProjectRow) {
  selectedProject.value = project
  showEditModal.value = true
}

function openDeleteModal(project: ProjectRow) {
  selectedProject.value = project
  showDeleteModal.value = true
}
</script>

<template>
  <UContainer>
    <UPageHeader
      headline="Dashboard"
      :title="`Welcome back, ${displayName}`"
      description="This is your starting point for tracking focus sessions and productivity insights."
    />

    <div class="space-y-6">
      <!-- Projects Section -->
      <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">
              Your Projects
            </h2>
            <UButton
              icon="lucide:plus"
              @click="openCreateModal"
            >
              Create Project
            </UButton>
          </div>

          <div
            v-if="isLoading"
            class="text-center py-8"
          >
            <Icon
              name="lucide:loader-2"
              class="h-8 w-8 mx-auto animate-spin text-gray-400"
            />
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Loading projects...
            </p>
          </div>

          <ProjectList
            v-else
            :projects="projects"
            @edit="openEditModal"
            @delete="openDeleteModal"
          />
        </div>
      </UCard>

      <!-- Account Overview Section -->
      <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
        <div class="space-y-4">
          <h2 class="text-xl font-semibold">
            Account Overview
          </h2>
          <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li>
              <span class="font-medium text-gray-900 dark:text-gray-100">Email:</span>
              {{ user?.email }}
            </li>
            <li>
              <span class="font-medium text-gray-900 dark:text-gray-100">Full Name:</span>
              {{ user?.user_metadata?.full_name || 'Not provided' }}
            </li>
          </ul>
        </div>
      </UCard>
    </div>

    <!-- Modals -->
    <ProjectCreateModal
      v-model:open="showCreateModal"
    />

    <ProjectEditModal
      v-if="selectedProject"
      v-model:open="showEditModal"
      :project="selectedProject"
    />

    <ProjectDeleteModal
      v-if="selectedProject"
      v-model:open="showDeleteModal"
      :project="selectedProject"
    />
  </UContainer>
</template>
