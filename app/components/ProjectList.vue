<script setup lang="ts">
import { useSortable } from '@vueuse/integrations/useSortable'
import type { ProjectRow } from '~/lib/supabase/projects'
import { useReorderProjects, useToggleProjectActive } from '~/composables/useProjects'
import { useActiveStintQuery, useStartStint } from '~/composables/useStints'
import type { StintRow } from '~/lib/supabase/stints'
import StintTimer from './StintTimer.vue'
import StintControls from './StintControls.vue'

const props = defineProps<{
  projects: ProjectRow[]
}>()

const emit = defineEmits<{
  edit: [project: ProjectRow]
}>()

const toast = useToast()
const { mutate: reorderProjects, isError, error } = useReorderProjects()
const { mutateAsync: toggleActive } = useToggleProjectActive()
const togglingProjectId = ref<string | null>(null)

const activeListRef = ref<HTMLElement | null>(null)
const localProjects = ref<ProjectRow[]>([...props.projects])
const isDragging = ref(false)
const showInactiveProjects = ref(false)

// Stint management
const { data: activeStint } = useActiveStintQuery()
const { mutateAsync: startStint, isPending: isStarting } = useStartStint()

// Separate active and inactive projects
const activeProjects = computed(() => localProjects.value.filter(p => p.is_active))
const inactiveProjects = computed(() => localProjects.value.filter(p => !p.is_active))

// Update local projects when props change (but not during drag)
watch(() => props.projects, (newProjects) => {
  if (!isDragging.value) {
    localProjects.value = [...newProjects]
  }
}, { deep: true })

// Show error toast when reorder fails
watch(isError, (hasError) => {
  if (hasError && error.value) {
    toast.add({
      title: 'Failed to reorder projects',
      description: error.value.message || 'An unexpected error occurred',
      color: 'error',
    })
  }
})

// Setup drag-and-drop for active projects only
useSortable(activeListRef, activeProjects, {
  animation: 150,
  handle: '.drag-handle',
  onStart: () => {
    isDragging.value = true
  },
  onEnd: (evt: { oldIndex?: number, newIndex?: number }) => {
    // Manually update the array based on the drag event
    if (evt.oldIndex !== undefined && evt.newIndex !== undefined && evt.oldIndex !== evt.newIndex) {
      const newOrder = [...activeProjects.value]
      const [movedItem] = newOrder.splice(evt.oldIndex, 1)

      if (movedItem) {
        newOrder.splice(evt.newIndex, 0, movedItem)

        // Combine with inactive projects to maintain complete list
        const completeOrder = [...newOrder, ...inactiveProjects.value]
        localProjects.value = completeOrder

        isDragging.value = false
        // Reorder projects based on new order (debounced mutation)
        reorderProjects(completeOrder)
      }
      else {
        isDragging.value = false
      }
    }
    else {
      isDragging.value = false
    }
  },
})

function handleEdit(project: ProjectRow) {
  emit('edit', project)
}

async function handleToggleActive(project: ProjectRow) {
  togglingProjectId.value = project.id
  try {
    await toggleActive(project.id)
    toast.add({
      title: project.is_active ? 'Project deactivated' : 'Project activated',
      description: `${project.name} is now ${project.is_active ? 'inactive' : 'active'}`,
      color: 'success',
    })
  }
  catch (error) {
    toast.add({
      title: 'Failed to toggle project status',
      description: error instanceof Error ? error.message : 'An unexpected error occurred',
      color: 'error',
    })
  }
  finally {
    togglingProjectId.value = null
  }
}

function formatDuration(minutes: number | null) {
  const duration = minutes ?? 45 // Default to 45 minutes if null
  if (duration < 60) return `${duration}m`
  const hours = Math.floor(duration / 60)
  const mins = duration % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

// Get border color class for project color tag
function getColorBorderClass(colorTag: string | null) {
  if (!colorTag) return ''

  const colorMap: Record<string, string> = {
    red: 'border-l-red-500',
    orange: 'border-l-orange-500',
    amber: 'border-l-amber-500',
    green: 'border-l-green-500',
    teal: 'border-l-teal-500',
    blue: 'border-l-blue-500',
    purple: 'border-l-purple-500',
    pink: 'border-l-pink-500',
  }

  return colorMap[colorTag] || ''
}

// Check if a project has an active stint
function isProjectActive(projectId: string): boolean {
  return activeStint.value?.project_id === projectId
}

// Get the active stint for a specific project
function projectActiveStint(projectId: string): StintRow | null {
  if (activeStint.value?.project_id === projectId) {
    return activeStint.value
  }
  return null
}

// Handle starting a stint
async function handleStartStint(project: ProjectRow): Promise<void> {
  try {
    await startStint({
      projectId: project.id,
      plannedDurationMinutes: project.custom_stint_duration ?? undefined,
    })

    toast.add({
      title: 'Stint Started',
      description: `Started working on ${project.name}`,
      color: 'green',
      icon: 'i-lucide-play-circle',
    })
  }
  catch (error) {
    toast.add({
      title: 'Failed to Start Stint',
      description: error instanceof Error ? error.message : 'Could not start stint. Please try again.',
      color: 'red',
      icon: 'i-lucide-alert-circle',
    })
  }
}
</script>

<template>
  <div>
    <!-- Empty state -->
    <div
      v-if="projects.length === 0"
      class="text-center py-12"
    >
      <Icon
        name="i-lucide-folder-open"
        class="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600"
      />
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
        No projects yet
      </h3>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Get started by creating your first project
      </p>
    </div>

    <!-- Active Projects Section -->
    <div v-else>
      <h3
        v-if="inactiveProjects.length > 0"
        class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        Active Projects
      </h3>

      <ul
        ref="activeListRef"
        class="space-y-2"
      >
        <li
          v-for="project in activeProjects"
          :key="project.id"
          :class="[
            'flex flex-col gap-3 p-4 rounded-lg border-2 transition-all border-l-4',
            isProjectActive(project.id)
              ? 'border-green-500 ring-2 ring-green-500/50 pulsing-active bg-green-50/50 dark:bg-green-950/20'
              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700',
            getColorBorderClass(project.color_tag),
          ]"
        >
          <!-- Project Header Row -->
          <div class="flex items-center gap-3 w-full">
            <!-- Drag handle -->
            <UTooltip text="Reorder project">
              <button
                type="button"
                class="drag-handle cursor-move p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-all duration-200"
                aria-label="Reorder project"
              >
                <Icon
                  name="i-lucide-grip-vertical"
                  class="h-5 w-5 text-gray-400"
                />
              </button>
            </UTooltip>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                  {{ project.name }}
                </h3>
              </div>
              <div class="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span class="flex items-center gap-1">
                  <Icon
                    name="i-lucide-target"
                    class="h-4 w-4"
                  />
                  {{ project.expected_daily_stints }} stints/day
                </span>
                <span class="flex items-center gap-1">
                  <Icon
                    name="i-lucide-timer"
                    class="h-4 w-4"
                  />
                  {{ formatDuration(project.custom_stint_duration) }} per stint
                </span>
              </div>
            </div>

            <!-- Toggle and Actions -->
            <div class="flex items-center gap-2">
              <UTooltip :text="project.is_active ? 'Deactivate project' : 'Activate project'">
                <span>
                  <USwitch
                    :model-value="project.is_active ?? true"
                    :loading="togglingProjectId === project.id"
                    :disabled="togglingProjectId === project.id"
                    aria-label="Toggle project active status"
                    @update:model-value="handleToggleActive(project)"
                  />
                </span>
              </UTooltip>
              <div class="flex items-center gap-1">
                <UTooltip text="Edit project">
                  <span>
                    <UButton
                      icon="i-lucide-pencil"
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      aria-label="Edit project"
                      class="transition-all duration-200 hover:scale-105"
                      @click="handleEdit(project)"
                    />
                  </span>
                </UTooltip>
              </div>
            </div>
          </div>

          <!-- Active Stint Section (expanded when project has active stint) -->
          <div
            v-if="isProjectActive(project.id)"
            class="flex flex-col items-center gap-4 pt-4 border-t border-green-200 dark:border-green-800"
          >
            <!-- Timer Display -->
            <StintTimer :stint="projectActiveStint(project.id)" />

            <!-- Controls -->
            <StintControls :stint="projectActiveStint(project.id)!" />
          </div>

          <!-- Start Button Section (when no active stint or different project active) -->
          <div
            v-else
            class="flex items-center justify-center gap-2 pt-2"
          >
            <UButton
              v-if="!activeStint"
              color="green"
              icon="i-lucide-play"
              :loading="isStarting"
              :disabled="isStarting"
              @click="handleStartStint(project)"
            >
              Start Stint
            </UButton>
            <UTooltip
              v-else
              text="Stop current stint to start new one"
            >
              <span>
                <UButton
                  color="gray"
                  variant="soft"
                  icon="i-lucide-play"
                  disabled
                >
                  Start Stint
                </UButton>
              </span>
            </UTooltip>
          </div>
        </li>
      </ul>

      <!-- Inactive Projects Section -->
      <div
        v-if="inactiveProjects.length > 0"
        class="mt-6"
      >
        <button
          type="button"
          class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 hover:text-gray-900 dark:hover:text-gray-100"
          @click="showInactiveProjects = !showInactiveProjects"
        >
          <Icon
            :name="showInactiveProjects ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
            class="h-4 w-4"
          />
          Inactive Projects ({{ inactiveProjects.length }})
        </button>

        <ul
          v-if="showInactiveProjects"
          class="space-y-2"
        >
          <li
            v-for="project in inactiveProjects"
            :key="project.id"
            :class="[
              'flex items-center gap-3 p-4 rounded-lg border-2 transition-colors border-l-4',
              'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 opacity-60',
              getColorBorderClass(project.color_tag),
            ]"
          >
            <!-- Project info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                  {{ project.name }}
                </h3>
                <UBadge
                  color="neutral"
                  variant="subtle"
                  size="sm"
                >
                  Inactive
                </UBadge>
              </div>
              <div class="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span class="flex items-center gap-1">
                  <Icon
                    name="i-lucide-target"
                    class="h-4 w-4"
                  />
                  {{ project.expected_daily_stints }} stints/day
                </span>
                <span class="flex items-center gap-1">
                  <Icon
                    name="i-lucide-timer"
                    class="h-4 w-4"
                  />
                  {{ formatDuration(project.custom_stint_duration) }} per stint
                </span>
              </div>
            </div>

            <!-- Toggle and Actions -->
            <div class="flex items-center gap-2">
              <UTooltip :text="project.is_active ? 'Deactivate project' : 'Activate project'">
                <span>
                  <USwitch
                    :model-value="project.is_active ?? false"
                    :loading="togglingProjectId === project.id"
                    :disabled="togglingProjectId === project.id"
                    aria-label="Toggle project active status"
                    @update:model-value="handleToggleActive(project)"
                  />
                </span>
              </UTooltip>
              <div class="flex items-center gap-1">
                <UTooltip text="Edit project">
                  <span>
                    <UButton
                      icon="i-lucide-pencil"
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      aria-label="Edit project"
                      class="transition-all duration-200 hover:scale-105"
                      @click="handleEdit(project)"
                    />
                  </span>
                </UTooltip>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse-border {
  0%, 100% {
    border-color: rgb(34 197 94);
    box-shadow: 0 0 0 0 rgb(34 197 94 / 0.4);
  }
  50% {
    border-color: rgb(74 222 128);
    box-shadow: 0 0 0 4px rgb(74 222 128 / 0.2);
  }
}

.pulsing-active {
  animation: pulse-border 2s ease-in-out infinite;
}
</style>
