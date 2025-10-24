<script setup lang="ts">
import { useSortable } from '@vueuse/integrations/useSortable'
import type { ProjectRow } from '~/lib/supabase/projects'
import { useReorderProjects } from '~/composables/useProjects'

const props = defineProps<{
  projects: ProjectRow[]
}>()

const emit = defineEmits<{
  edit: [project: ProjectRow]
  delete: [project: ProjectRow]
}>()

const toast = useToast()
const { mutate: reorderProjects } = useReorderProjects()

const listRef = ref<HTMLElement | null>(null)
const localProjects = ref<ProjectRow[]>([...props.projects])

// Update local projects when props change
watch(() => props.projects, (newProjects) => {
  localProjects.value = [...newProjects]
}, { deep: true })

// Setup drag-and-drop
useSortable(listRef, localProjects, {
  animation: 150,
  handle: '.drag-handle',
  onEnd: () => {
    // Reorder projects based on new order (debounced mutation handles errors internally)
    reorderProjects(localProjects.value)
  },
})

function handleEdit(project: ProjectRow) {
  emit('edit', project)
}

function handleDelete(project: ProjectRow) {
  emit('delete', project)
}

function formatDuration(minutes: number | null) {
  const duration = minutes ?? 45 // Default to 45 minutes if null
  if (duration < 60) return `${duration}m`
  const hours = Math.floor(duration / 60)
  const mins = duration % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}
</script>

<template>
  <div
    v-if="projects.length === 0"
    class="text-center py-12"
  >
    <Icon
      name="lucide:folder-open"
      class="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600"
    />
    <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
      No projects yet
    </h3>
    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
      Get started by creating your first project
    </p>
  </div>

  <ul
    v-else
    ref="listRef"
    class="space-y-2"
  >
    <li
      v-for="project in localProjects"
      :key="project.id"
      class="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
    >
      <!-- Drag handle -->
      <button
        type="button"
        class="drag-handle cursor-move p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        aria-label="Reorder project"
      >
        <Icon
          name="lucide:grip-vertical"
          class="h-5 w-5 text-gray-400"
        />
      </button>

      <!-- Project info -->
      <div class="flex-1 min-w-0">
        <h3 class="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
          {{ project.name }}
        </h3>
        <div class="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span class="flex items-center gap-1">
            <Icon
              name="lucide:target"
              class="h-4 w-4"
            />
            {{ project.expected_daily_stints }} stints/day
          </span>
          <span class="flex items-center gap-1">
            <Icon
              name="lucide:timer"
              class="h-4 w-4"
            />
            {{ formatDuration(project.custom_stint_duration) }} per stint
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1">
        <UButton
          icon="lucide:pencil"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Edit project"
          @click="handleEdit(project)"
        />
        <UButton
          icon="lucide:trash-2"
          color="error"
          variant="ghost"
          size="sm"
          aria-label="Delete project"
          @click="handleDelete(project)"
        />
      </div>
    </li>
  </ul>
</template>
