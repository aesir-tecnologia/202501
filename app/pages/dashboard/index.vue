<script setup lang="ts">
import { getProjects } from '~/lib/supabase/projects'
import type { ProjectRow } from '~/lib/supabase/projects'

const { user, userProfile } = useAuth()
const client = useSupabaseClient()

const displayName = computed(() => {
  return userProfile.value?.fullName || userProfile.value?.email || 'there'
})

// Project state
const projects = ref<ProjectRow[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// Modal states
const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)
const selectedProject = ref<ProjectRow | null>(null)

// Load projects
async function loadProjects() {
  loading.value = true
  error.value = null

  try {
    const result = await getProjects(client, { includeInactive: true })
    projects.value = result
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load projects'
    console.error('Error loading projects:', err)
  }
  finally {
    loading.value = false
  }
}

// Handle project actions
function handleProjectClick(project: ProjectRow) {
  navigateTo(`/projects/${project.id}`)
}

function handleProjectEdit(project: ProjectRow) {
  selectedProject.value = project
  isEditModalOpen.value = true
}

async function handleProjectDelete(project: ProjectRow) {
  if (!confirm(`Are you sure you want to delete "${project.name}"?`)) {
    return
  }

  // TODO: Implement delete with useProjectMutations
  console.log('Delete project:', project.id)
  await loadProjects()
}

function handleProjectCreated() {
  loadProjects()
}

function handleProjectUpdated() {
  loadProjects()
}

// Load projects on mount
onMounted(() => {
  loadProjects()
})

// Computed values
const activeProjects = computed(() => projects.value.filter(p => p.is_active))
const hasProjects = computed(() => projects.value.length > 0)

definePageMeta({
  title: 'Dashboard',
  middleware: 'auth',
})

useSeoMeta({
  title: 'Dashboard - LifeStint',
  description: 'Track your focus sessions and boost productivity with LifeStint.',
  ogTitle: 'Dashboard - LifeStint',
  ogDescription: 'Track your focus sessions and boost productivity.',
  twitterCard: 'summary',
})
</script>

<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <UPageHeader
      headline="Dashboard"
      :title="`Welcome back, ${displayName}!`"
      description="Track your focus sessions and manage your projects."
    >
      <template #actions>
        <UButton
          icon="i-lucide-plus"
          size="lg"
          @click="isCreateModalOpen = true"
        >
          New Project
        </UButton>
      </template>
    </UPageHeader>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <UIcon name="i-lucide-folder" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div class="text-2xl font-bold">
              {{ projects.length }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              Total Projects
            </div>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <UIcon name="i-lucide-check-circle" class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <div class="text-2xl font-bold">
              {{ activeProjects.length }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              Active Projects
            </div>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <UIcon name="i-lucide-timer" class="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div class="text-2xl font-bold">
              0
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              Stints Today
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Projects Grid -->
    <div>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold">
          Your Projects
        </h2>
        <UButton
          v-if="hasProjects"
          to="/projects"
          variant="ghost"
          trailing-icon="i-lucide-arrow-right"
        >
          View All
        </UButton>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard v-for="i in 3" :key="i" class="animate-pulse">
          <div class="h-32 bg-gray-200 dark:bg-gray-800 rounded" />
        </UCard>
      </div>

      <!-- Error State -->
      <UAlert
        v-else-if="error"
        color="red"
        variant="subtle"
        title="Error loading projects"
        :description="error"
      />

      <!-- Empty State -->
      <UCard v-else-if="!hasProjects">
        <div class="text-center py-12">
          <UIcon name="i-lucide-folder-plus" class="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 class="text-lg font-semibold mb-2">
            No projects yet
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Create your first project to start tracking your focus sessions.
          </p>
          <UButton
            icon="i-lucide-plus"
            size="lg"
            @click="isCreateModalOpen = true"
          >
            Create Your First Project
          </UButton>
        </div>
      </UCard>

      <!-- Projects Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProjectCard
          v-for="project in projects.slice(0, 6)"
          :key="project.id"
          :project="project"
          @click="handleProjectClick"
          @edit="handleProjectEdit"
          @delete="handleProjectDelete"
        />
      </div>
    </div>

    <!-- Modals -->
    <ModalProjectCreateModal
      v-model:open="isCreateModalOpen"
      @created="handleProjectCreated"
    />

    <ModalProjectEditModal
      v-if="selectedProject"
      v-model:open="isEditModalOpen"
      :project="selectedProject"
      @updated="handleProjectUpdated"
    />
  </div>
</template>
