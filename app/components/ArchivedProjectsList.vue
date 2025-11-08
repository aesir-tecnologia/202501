<script setup lang="ts">
import type { ProjectRow } from '~/lib/supabase/projects'
import { usePermanentlyDeleteProject, useUnarchiveProject } from '~/composables/useProjects'

defineProps<{
  projects: ProjectRow[]
}>()

const toast = useToast()
const { mutateAsync: permanentlyDeleteProject, isPending: isDeleting } = usePermanentlyDeleteProject()
const { mutateAsync: unarchiveProject, isPending: isUnarchiving } = useUnarchiveProject()

const deletingProjectId = ref<string | null>(null)
const unarchivingProjectId = ref<string | null>(null)
const showDeleteConfirm = ref(false)
const projectToDelete = ref<ProjectRow | null>(null)

function formatDate(dateString: string | null) {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function openDeleteConfirmation(project: ProjectRow) {
  projectToDelete.value = project
  showDeleteConfirm.value = true
}

function closeDeleteConfirmation() {
  showDeleteConfirm.value = false
  projectToDelete.value = null
}

async function handleUnarchive(project: ProjectRow) {
  unarchivingProjectId.value = project.id

  try {
    await unarchiveProject(project.id)

    toast.add({
      title: 'Project unarchived',
      description: `${project.name} has been restored to your dashboard`,
      color: 'success',
    })
  }
  catch (error) {
    toast.add({
      title: 'Failed to unarchive project',
      description: error instanceof Error ? error.message : 'An unexpected error occurred',
      color: 'error',
    })
  }
  finally {
    unarchivingProjectId.value = null
  }
}

async function handlePermanentDelete() {
  if (!projectToDelete.value) return

  deletingProjectId.value = projectToDelete.value.id

  try {
    await permanentlyDeleteProject(projectToDelete.value.id)

    toast.add({
      title: 'Project permanently deleted',
      description: `${projectToDelete.value.name} and all associated stints have been permanently deleted`,
      color: 'success',
    })

    closeDeleteConfirmation()
  }
  catch (error) {
    toast.add({
      title: 'Failed to delete project',
      description: error instanceof Error ? error.message : 'An unexpected error occurred',
      color: 'error',
    })
  }
  finally {
    deletingProjectId.value = null
  }
}
</script>

<template>
  <div>
    <div
      v-if="projects.length === 0"
      class="text-center py-12"
    >
      <Icon
        name="i-lucide-archive"
        class="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600"
      />
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
        No archived projects
      </h3>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Projects you archive will appear here
      </p>
    </div>

    <ul
      v-else
      class="space-y-2"
    >
      <li
        v-for="project in projects"
        :key="project.id"
        class="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50"
      >
        <!-- Project info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h3 class="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
              {{ project.name }}
            </h3>
          </div>
          <div class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Archived {{ formatDate(project.archived_at) }}
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1">
          <UTooltip text="Restore to dashboard">
            <span>
              <UButton
                icon="i-lucide-archive-restore"
                color="primary"
                variant="ghost"
                size="sm"
                aria-label="Unarchive project"
                :loading="unarchivingProjectId === project.id"
                :disabled="isUnarchiving || isDeleting"
                class="transition-all duration-200 hover:scale-105"
                @click="handleUnarchive(project)"
              />
            </span>
          </UTooltip>
          <UTooltip text="Permanently delete">
            <span>
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="sm"
                aria-label="Permanently delete project"
                :loading="deletingProjectId === project.id"
                :disabled="isDeleting || isUnarchiving"
                class="transition-all duration-200 hover:scale-105"
                @click="openDeleteConfirmation(project)"
              />
            </span>
          </UTooltip>
        </div>
      </li>
    </ul>

    <!-- Delete Confirmation Modal -->
    <UModal
      v-model:open="showDeleteConfirm"
      title="Permanently Delete Project"
      description="This action cannot be undone"
    >
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              Permanently Delete Project
            </h3>
          </template>

          <div class="space-y-4">
            <p class="text-gray-700 dark:text-gray-300">
              Are you sure you want to permanently delete <strong>{{ projectToDelete?.name }}</strong>?
            </p>

            <div class="rounded-md bg-red-50 dark:bg-red-950 p-4">
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <Icon
                    name="i-lucide-alert-triangle"
                    class="h-5 w-5 text-red-400"
                  />
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                    Warning
                  </h3>
                  <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>This will permanently delete the project and all associated stint history. This action cannot be undone.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <UButton
              color="neutral"
              variant="ghost"
              @click="closeDeleteConfirmation"
            >
              Cancel
            </UButton>
            <UButton
              color="error"
              :loading="isDeleting"
              @click="handlePermanentDelete"
            >
              Permanently Delete
            </UButton>
          </div>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
