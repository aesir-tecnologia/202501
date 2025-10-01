import { useConnectionState } from './useConnectionState'
import type { AppError } from '~/utils/errors'

export interface QueuedMutation {
  id: string
  timestamp: number
  type: 'stint' | 'project'
  operation: 'create' | 'update' | 'delete' | 'start' | 'stop' | 'pause' | 'resume'
  payload: any
  retryCount: number
}

const QUEUE_STORAGE_KEY = 'lifestint:offline-queue'
const MAX_RETRIES = 3

/**
 * Composable for managing offline mutation queue
 *
 * Queues failed mutations to local storage and retries on reconnection
 *
 * Usage:
 * ```ts
 * const { queueMutation, processPendingMutations, pendingCount } = useOfflineQueue()
 *
 * // Queue a failed mutation
 * await queueMutation('stint', 'start', payload)
 *
 * // Pending mutations are auto-processed on reconnect
 * ```
 */
export function useOfflineQueue() {
  const { isOnline, onReconnect } = useConnectionState()
  const queue = ref<QueuedMutation[]>([])
  const processing = ref(false)
  const pendingCount = computed(() => queue.value.length)

  // Load queue from storage on mount
  if (import.meta.client) {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY)
    if (stored) {
      try {
        queue.value = JSON.parse(stored)
      }
      catch (err) {
        console.error('Failed to parse offline queue:', err)
        localStorage.removeItem(QUEUE_STORAGE_KEY)
      }
    }
  }

  // Save queue to storage whenever it changes
  watch(queue, (newQueue) => {
    if (import.meta.client) {
      if (newQueue.length > 0) {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(newQueue))
      }
      else {
        localStorage.removeItem(QUEUE_STORAGE_KEY)
      }
    }
  }, { deep: true })

  // Auto-process on reconnect
  if (import.meta.client) {
    onReconnect(() => {
      processPendingMutations()
    })
  }

  /**
   * Add a mutation to the offline queue
   */
  async function queueMutation(
    type: QueuedMutation['type'],
    operation: QueuedMutation['operation'],
    payload: any,
  ): Promise<void> {
    const mutation: QueuedMutation = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type,
      operation,
      payload,
      retryCount: 0,
    }

    queue.value.push(mutation)
    console.log(`Queued offline mutation: ${type}.${operation}`, mutation)

    // Try to process immediately if online
    if (isOnline.value) {
      await processPendingMutations()
    }
  }

  /**
   * Process all pending mutations
   */
  async function processPendingMutations(): Promise<void> {
    if (processing.value || queue.value.length === 0) {
      return
    }

    processing.value = true
    const { showError, showSuccess } = useErrorToast()

    try {
      const mutations = [...queue.value]
      const results: Array<{ id: string, success: boolean, error?: AppError }> = []

      for (const mutation of mutations) {
        try {
          await processMutation(mutation)
          results.push({ id: mutation.id, success: true })
        }
        catch (err) {
          const error = err as AppError
          console.error('Failed to process offline mutation:', mutation, error)

          // Retry if retryable and under limit
          if (mutation.retryCount < MAX_RETRIES) {
            mutation.retryCount++
            results.push({ id: mutation.id, success: false, error })
          }
          else {
            // Max retries exceeded - remove from queue and notify
            results.push({ id: mutation.id, success: false, error })
            showError(error, { message: `Failed to sync ${mutation.type} ${mutation.operation} after ${MAX_RETRIES} attempts` })
          }
        }
      }

      // Remove successfully processed mutations
      queue.value = queue.value.filter(m =>
        !results.some(r => r.id === m.id && r.success),
      )

      // Remove max-retry-exceeded mutations
      queue.value = queue.value.filter(m =>
        !results.some(r => r.id === m.id && !r.success && m.retryCount >= MAX_RETRIES),
      )

      // Show success if any mutations synced
      const successCount = results.filter(r => r.success).length
      if (successCount > 0) {
        showSuccess(`Synced ${successCount} offline ${successCount === 1 ? 'change' : 'changes'}`)
      }
    }
    finally {
      processing.value = false
    }
  }

  /**
   * Process a single mutation
   */
  async function processMutation(mutation: QueuedMutation): Promise<void> {
    const client = useSupabaseClient()

    switch (mutation.type) {
      case 'stint':
        await processStintMutation(client, mutation)
        break
      case 'project':
        await processProjectMutation(client, mutation)
        break
      default:
        throw new Error(`Unknown mutation type: ${mutation.type}`)
    }
  }

  async function processStintMutation(client: any, mutation: QueuedMutation): Promise<void> {
    const { startStint, stopStint, pauseStint, resumeStint, createStint, updateStint, deleteStint } = await import('~/lib/supabase/stints')

    switch (mutation.operation) {
      case 'start':
        await startStint(client, mutation.payload.projectId, mutation.payload)
        break
      case 'stop':
        await stopStint(client, mutation.payload.stintId, mutation.payload)
        break
      case 'pause':
        await pauseStint(client, mutation.payload.stintId, mutation.payload)
        break
      case 'resume':
        await resumeStint(client, mutation.payload.pausedStintId, mutation.payload)
        break
      case 'create':
        await createStint(client, mutation.payload)
        break
      case 'update':
        await updateStint(client, mutation.payload.id, mutation.payload.updates)
        break
      case 'delete':
        await deleteStint(client, mutation.payload.id)
        break
    }
  }

  async function processProjectMutation(client: any, mutation: QueuedMutation): Promise<void> {
    const { createProject, updateProject, deleteProject } = await import('~/lib/supabase/projects')

    switch (mutation.operation) {
      case 'create':
        await createProject(client, mutation.payload)
        break
      case 'update':
        await updateProject(client, mutation.payload.id, mutation.payload.updates)
        break
      case 'delete':
        await deleteProject(client, mutation.payload.id)
        break
    }
  }

  /**
   * Clear all pending mutations (for testing or reset)
   */
  function clearQueue(): void {
    queue.value = []
  }

  return {
    queueMutation,
    processPendingMutations,
    clearQueue,
    pendingCount: readonly(pendingCount),
    processing: readonly(processing),
    isOnline: readonly(isOnline),
  }
}
