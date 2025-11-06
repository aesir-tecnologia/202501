<script setup lang="ts">
import { computed } from 'vue'
import type { StintRow } from '~/lib/supabase/stints'
import { useCompleteStint } from '~/composables/useStints'
import { projectKeys } from '~/composables/useProjects'
import type { ProjectRow } from '~/lib/supabase/projects'
import { useQueryClient } from '@tanstack/vue-query'

interface Props {
  currentStint: StintRow
  newStint: StintRow
}

const props = defineProps<Props>()

const emit = defineEmits<{
  dismiss: []
  resolved: []
}>()

const queryClient = useQueryClient()
const toast = useToast()
const { mutateAsync: completeStint, isPending } = useCompleteStint()

const isOpen = defineModel<boolean>('open', { default: true })

// Get project names from cache
const currentProject = computed(() => {
  return queryClient.getQueryData<ProjectRow>(projectKeys.detail(props.currentStint.project_id))
})

const newProject = computed(() => {
  return queryClient.getQueryData<ProjectRow>(projectKeys.detail(props.newStint.project_id))
})

// Calculate time remaining for current stint (if active)
const timeRemaining = computed(() => {
  if (!props.currentStint.started_at || !props.currentStint.planned_duration) {
    return 'Unknown time remaining'
  }

  const startTime = new Date(props.currentStint.started_at).getTime()
  const plannedDurationMs = props.currentStint.planned_duration * 60 * 1000
  const elapsedMs = Date.now() - startTime
  const remainingMs = plannedDurationMs - elapsedMs

  if (remainingMs <= 0) {
    return 'Overtime'
  }

  const minutes = Math.floor(remainingMs / 60000)
  const seconds = Math.floor((remainingMs % 60000) / 1000)
  return `${minutes}m ${seconds}s remaining`
})

function handleContinueCurrent() {
  // User wants to keep current stint - just dismiss
  emit('dismiss')
  isOpen.value = false
}

async function handleSwitchToNew() {
  // User wants to switch to new stint - complete current first
  try {
    await completeStint({
      stintId: props.currentStint.id,
      completionType: 'interrupted',
      notes: 'Interrupted due to stint started on another device',
    })

    toast.add({
      title: 'Switched to new stint',
      description: 'Current stint interrupted and new stint is now active',
      color: 'success',
      icon: 'i-lucide-check-circle',
    })

    emit('resolved')
    isOpen.value = false
  }
  catch (error) {
    toast.add({
      title: 'Failed to switch stints',
      description: error instanceof Error ? error.message : 'An unexpected error occurred',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  }
}

function handleCancel() {
  emit('dismiss')
  isOpen.value = false
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :prevent-close="isPending"
  >
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0">
              <UIcon
                name="i-lucide-alert-triangle"
                class="size-6 text-amber-500"
              />
            </div>
            <div>
              <h3 class="text-lg font-semibold">
                Stint Conflict Detected
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                A new stint was started on another device while you have an active stint
              </p>
            </div>
          </div>
        </template>

        <div class="space-y-6">
          <!-- Current Stint Info -->
          <div class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
            <div class="flex items-center gap-2 mb-2">
              <UIcon
                name="i-lucide-laptop"
                class="size-5 text-blue-600 dark:text-blue-400"
              />
              <h4 class="font-semibold text-blue-900 dark:text-blue-100">
                Current Stint (This Device)
              </h4>
            </div>
            <div class="space-y-1 text-sm">
              <p class="text-blue-800 dark:text-blue-200">
                <span class="font-medium">Project:</span>
                {{ currentProject?.name || 'Unknown Project' }}
              </p>
              <p class="text-blue-700 dark:text-blue-300">
                <span class="font-medium">Status:</span>
                {{ currentStint.status === 'active' ? 'Active' : 'Paused' }}
              </p>
              <p class="text-blue-700 dark:text-blue-300">
                <span class="font-medium">Time:</span>
                {{ timeRemaining }}
              </p>
            </div>
          </div>

          <!-- New Stint Info -->
          <div class="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
            <div class="flex items-center gap-2 mb-2">
              <UIcon
                name="i-lucide-smartphone"
                class="size-5 text-green-600 dark:text-green-400"
              />
              <h4 class="font-semibold text-green-900 dark:text-green-100">
                New Stint (Other Device)
              </h4>
            </div>
            <div class="space-y-1 text-sm">
              <p class="text-green-800 dark:text-green-200">
                <span class="font-medium">Project:</span>
                {{ newProject?.name || 'Unknown Project' }}
              </p>
              <p class="text-green-700 dark:text-green-300">
                <span class="font-medium">Status:</span>
                Active
              </p>
            </div>
          </div>

          <!-- Action Message -->
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <p class="text-sm text-gray-700 dark:text-gray-300">
              Please choose how you'd like to resolve this conflict:
            </p>
          </div>
        </div>

        <template #footer>
          <div class="flex flex-col sm:flex-row gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              :disabled="isPending"
              block
              @click="handleCancel"
            >
              Cancel
            </UButton>
            <UButton
              color="primary"
              variant="soft"
              :disabled="isPending"
              block
              @click="handleContinueCurrent"
            >
              <UIcon
                name="i-lucide-laptop"
                class="size-4"
              />
              Continue Current Stint
            </UButton>
            <UButton
              color="success"
              :loading="isPending"
              block
              @click="handleSwitchToNew"
            >
              <UIcon
                name="i-lucide-smartphone"
                class="size-4"
              />
              Switch to New Stint
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
