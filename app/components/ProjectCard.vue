<script setup lang="ts">
import type { ProjectRow } from '~/lib/supabase/projects'

export interface ProjectCardProps {
  project: ProjectRow
  showProgress?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<ProjectCardProps>(), {
  showProgress: true,
  size: 'md',
})

const emit = defineEmits<{
  click: [project: ProjectRow]
  edit: [project: ProjectRow]
  delete: [project: ProjectRow]
}>()

// Calculate progress (mock - will be integrated with actual stint data)
const progress = computed(() => {
  const expected = props.project.expected_daily_stints || 2
  const completed = 0 // TODO: integrate with actual stint count
  return Math.min((completed / expected) * 100, 100)
})

const statusColor = computed(() => {
  if (progress.value >= 100)
    return 'green'
  if (progress.value >= 50)
    return 'blue'
  return 'gray'
})

const cardClasses = computed(() => {
  const sizes = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }
  return sizes[props.size]
})
</script>

<template>
  <UCard
    :class="cardClasses"
    class="hover:shadow-lg transition-shadow cursor-pointer"
    @click="emit('click', project)"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1 min-w-0">
        <!-- Project name and status -->
        <div class="flex items-center gap-2 mb-2">
          <h3 class="text-lg font-semibold truncate">
            {{ project.name }}
          </h3>
          <UBadge
            :color="project.is_active ? 'green' : 'gray'"
            variant="subtle"
            size="xs"
          >
            {{ project.is_active ? 'Active' : 'Inactive' }}
          </UBadge>
        </div>

        <!-- Project details -->
        <div class="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <div class="flex items-center gap-1">
            <UIcon
              name="i-lucide-target"
              class="w-4 h-4"
            />
            <span>{{ project.expected_daily_stints || 2 }} stints/day</span>
          </div>
          <div
            v-if="project.custom_stint_duration"
            class="flex items-center gap-1"
          >
            <UIcon
              name="i-lucide-clock"
              class="w-4 h-4"
            />
            <span>{{ project.custom_stint_duration }}min</span>
          </div>
        </div>

        <!-- Progress bar -->
        <div
          v-if="showProgress"
          class="space-y-1"
        >
          <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Today's Progress</span>
            <span>{{ Math.round(progress) }}%</span>
          </div>
          <UProgress
            :value="progress"
            :color="statusColor"
            size="sm"
          />
        </div>
      </div>

      <!-- Actions menu -->
      <UDropdown
        :items="[
          [
            {
              label: 'Edit',
              icon: 'i-lucide-pencil',
              click: () => emit('edit', project),
            },
            {
              label: 'Delete',
              icon: 'i-lucide-trash-2',
              click: () => emit('delete', project),
            },
          ],
        ]"
      >
        <UButton
          icon="i-lucide-more-vertical"
          color="gray"
          variant="ghost"
          size="sm"
          @click.stop
        />
      </UDropdown>
    </div>
  </UCard>
</template>
