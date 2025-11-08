import { ref, onUnmounted, watchEffect } from 'vue'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/vue-query'
import type { TypedSupabaseClient } from '~/utils/supabase'
import type { StintRow } from '~/lib/supabase/stints'
import type { ProjectRow } from '~/lib/supabase/projects'
import { stintKeys } from './useStints'
import { projectKeys } from './useProjects'

/**
 * Composable for managing real-time subscriptions to stint changes.
 * Enables cross-device sync by subscribing to stint table changes and updating
 * Vue Query cache in real-time.
 *
 * Features:
 * - Subscribes to INSERT/UPDATE/DELETE events on stints table
 * - Updates cache instantly using setQueryData (no refetch needed)
 * - Detects conflicts when new stint starts while local device has active stint
 * - Shows toast notifications for remote stint events
 * - Provides conflict details for modal display
 * - Automatic reconnection with exponential backoff on errors
 *
 * @example
 * ```ts
 * // In dashboard layout or page component
 * const { conflictData, showConflictModal } = useStintRealtime()
 *
 * // In template
 * <StintConflictModal
 *   v-if="showConflictModal"
 *   :current-stint="conflictData.currentStint"
 *   :new-stint="conflictData.newStint"
 *   @resolve="handleConflictResolution"
 * />
 * ```
 */
export function useStintRealtime() {
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient
  const queryClient = useQueryClient()
  const user = useAuthUser()
  const toast = useToast()

  // Conflict state
  const showConflictModal = ref(false)
  const conflictData = ref<{
    currentStint: StintRow
    newStint: StintRow
  } | null>(null)

  // Subscription state
  let channel: RealtimeChannel | null = null
  let reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = 5
  const baseReconnectDelay = 1000 // 1 second
  let isInitializing = false
  let isCleanedUp = false

  /**
   * Get project name for a given project ID from cache
   */
  function getProjectName(projectId: string): string | null {
    const project = queryClient.getQueryData<ProjectRow>(projectKeys.detail(projectId))
    return project?.name || null
  }

  /**
   * Handle INSERT events - new stint created on another device
   */
  function handleInsert(payload: RealtimePostgresChangesPayload<StintRow>) {
    const newStint = payload.new as StintRow

    // Check for conflict: if local device has active stint and new stint is also active
    const localActiveStint = queryClient.getQueryData<StintRow | null>(stintKeys.active())

    if (localActiveStint && newStint.status === 'active') {
      // Conflict detected! Show modal
      conflictData.value = {
        currentStint: localActiveStint,
        newStint,
      }
      showConflictModal.value = true

      // Don't update cache yet - wait for user resolution
      return
    }

    // No conflict - update cache immediately
    queryClient.setQueryData<StintRow | null>(stintKeys.active(), newStint)

    // Update list cache
    queryClient.setQueryData<StintRow[]>(stintKeys.list(undefined), (old) => {
      if (!old) return [newStint]
      return [newStint, ...old]
    })

    // Show toast notification
    const projectName = getProjectName(newStint.project_id)
    toast.add({
      title: 'Stint started on another device',
      description: projectName ? `Project: ${projectName}` : undefined,
      color: 'info',
      icon: 'i-lucide-play-circle',
    })
  }

  /**
   * Handle UPDATE events - stint status changed (pause/resume/complete)
   */
  function handleUpdate(payload: RealtimePostgresChangesPayload<StintRow>) {
    const updatedStint = payload.new as StintRow
    const oldStint = payload.old as Partial<StintRow>

    // Update active stint cache
    const currentActiveStint = queryClient.getQueryData<StintRow | null>(stintKeys.active())
    if (currentActiveStint && currentActiveStint.id === updatedStint.id) {
      if (updatedStint.status === 'completed' || updatedStint.status === 'interrupted') {
        // Stint completed/interrupted - clear active
        queryClient.setQueryData<StintRow | null>(stintKeys.active(), null)
      }
      else {
        // Stint updated (paused/resumed) - update active
        queryClient.setQueryData<StintRow | null>(stintKeys.active(), updatedStint)
      }
    }

    // Update detail cache
    queryClient.setQueryData<StintRow>(stintKeys.detail(updatedStint.id), updatedStint)

    // Update list cache
    queryClient.setQueryData<StintRow[]>(stintKeys.list(undefined), (old) => {
      if (!old) return [updatedStint]
      return old.map(s => s.id === updatedStint.id ? updatedStint : s)
    })

    // Show appropriate toast notification based on status change
    const projectName = getProjectName(updatedStint.project_id)

    if (oldStint.status !== updatedStint.status) {
      if (updatedStint.status === 'paused') {
        toast.add({
          title: 'Stint paused on another device',
          description: projectName ? `Project: ${projectName}` : undefined,
          color: 'warning',
          icon: 'i-lucide-pause-circle',
        })
      }
      else if (updatedStint.status === 'active' && oldStint.status === 'paused') {
        toast.add({
          title: 'Stint resumed on another device',
          description: projectName ? `Project: ${projectName}` : undefined,
          color: 'success',
          icon: 'i-lucide-play-circle',
        })
      }
      else if (updatedStint.status === 'completed') {
        toast.add({
          title: 'Stint completed on another device',
          description: projectName ? `Project: ${projectName}` : undefined,
          color: 'success',
          icon: 'i-lucide-check-circle',
        })
      }
      else if (updatedStint.status === 'interrupted') {
        toast.add({
          title: 'Stint interrupted on another device',
          description: projectName ? `Project: ${projectName}` : undefined,
          color: 'warning',
          icon: 'i-lucide-x-circle',
        })
      }
    }
  }

  /**
   * Handle DELETE events - stint deleted on another device
   */
  function handleDelete(payload: RealtimePostgresChangesPayload<StintRow>) {
    const deletedStint = payload.old as StintRow

    // Clear active stint if it matches
    const currentActiveStint = queryClient.getQueryData<StintRow | null>(stintKeys.active())
    if (currentActiveStint && currentActiveStint.id === deletedStint.id) {
      queryClient.setQueryData<StintRow | null>(stintKeys.active(), null)
    }

    // Remove from list cache
    queryClient.setQueryData<StintRow[]>(stintKeys.list(undefined), (old) => {
      if (!old) return []
      return old.filter(s => s.id !== deletedStint.id)
    })

    // Show toast notification
    const projectName = getProjectName(deletedStint.project_id)
    toast.add({
      title: 'Stint deleted on another device',
      description: projectName ? `Project: ${projectName}` : undefined,
      color: 'neutral',
      icon: 'i-lucide-trash-2',
    })
  }

  /**
   * Dismiss the conflict modal
   */
  function dismissConflict() {
    showConflictModal.value = false
    conflictData.value = null
  }

  /**
   * Cancel any pending reconnection attempts
   */
  function cancelReconnect() {
    if (reconnectTimeoutId) {
      clearTimeout(reconnectTimeoutId)
      reconnectTimeoutId = null
    }
  }

  /**
   * Cleanup subscription (without marking as permanently cleaned up)
   */
  function cleanupSubscription() {
    cancelReconnect()

    if (channel) {
      console.log('[useStintRealtime] Cleaning up subscription')
      try {
        client.removeChannel(channel)
      }
      catch (error) {
        console.warn('[useStintRealtime] Error removing channel:', error)
      }
      channel = null
    }
  }

  /**
   * Cleanup subscription permanently (on unmount)
   */
  function cleanup() {
    isCleanedUp = true
    cleanupSubscription()
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  function attemptReconnect() {
    if (isCleanedUp || !user.value) {
      return
    }

    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error('[useStintRealtime] Max reconnection attempts reached')
      toast.add({
        title: 'Real-time sync unavailable',
        description: 'Unable to reconnect. Please refresh the page.',
        color: 'error',
        icon: 'i-lucide-wifi-off',
      })
      return
    }

    reconnectAttempts++
    const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts - 1)
    console.log(`[useStintRealtime] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`)

    reconnectTimeoutId = setTimeout(() => {
      reconnectTimeoutId = null
      if (!isCleanedUp && user.value) {
        initialize()
      }
    }, delay)
  }

  /**
   * Initialize real-time subscription (only for authenticated users)
   */
  function initialize() {
    // Prevent duplicate initialization
    if (isInitializing || isCleanedUp) {
      return
    }

    if (!user.value) {
      console.warn('[useStintRealtime] No authenticated user - skipping subscription')
      return
    }

    // Clean up existing channel if any
    if (channel) {
      try {
        client.removeChannel(channel)
      }
      catch (error) {
        console.warn('[useStintRealtime] Error removing existing channel:', error)
      }
      channel = null
    }

    isInitializing = true

    try {
      // Create channel for user-specific stint changes
      channel = client
        .channel(`user-stints-${user.value.id}`)
        .on<StintRow>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'stints',
            filter: `user_id=eq.${user.value.id}`,
          },
          (payload) => {
            console.log('[useStintRealtime] Received event:', payload.eventType, payload)

            try {
              switch (payload.eventType) {
                case 'INSERT':
                  handleInsert(payload)
                  break
                case 'UPDATE':
                  handleUpdate(payload)
                  break
                case 'DELETE':
                  handleDelete(payload)
                  break
              }
            }
            catch (error) {
              console.error('[useStintRealtime] Error handling event:', error)
              toast.add({
                title: 'Real-time sync error',
                description: 'Failed to process real-time update',
                color: 'error',
                icon: 'i-lucide-alert-circle',
              })
            }
          },
        )
        .subscribe((status) => {
          console.log('[useStintRealtime] Subscription status:', status)

          if (status === 'SUBSCRIBED') {
            console.log('[useStintRealtime] Successfully subscribed to stint changes')
            isInitializing = false
            reconnectAttempts = 0 // Reset on successful connection
            cancelReconnect()
          }
          else if (status === 'CHANNEL_ERROR') {
            console.error('[useStintRealtime] Channel error - subscription failed')
            isInitializing = false

            // Only show toast on first error, not on every reconnection attempt
            if (reconnectAttempts === 0) {
              toast.add({
                title: 'Real-time sync unavailable',
                description: 'Attempting to reconnect...',
                color: 'warning',
                icon: 'i-lucide-wifi-off',
              })
            }

            // Attempt reconnection
            attemptReconnect()
          }
          else if (status === 'CLOSED') {
            console.log('[useStintRealtime] Channel closed')
            isInitializing = false

            // Only attempt reconnect if not intentionally closed
            if (!isCleanedUp && user.value) {
              attemptReconnect()
            }
          }
          else if (status === 'TIMED_OUT') {
            console.warn('[useStintRealtime] Channel timed out')
            isInitializing = false

            if (!isCleanedUp && user.value) {
              attemptReconnect()
            }
          }
        })
    }
    catch (error) {
      console.error('[useStintRealtime] Error initializing subscription:', error)
      isInitializing = false

      if (!isCleanedUp && user.value) {
        attemptReconnect()
      }
    }
  }

  // Watch for user changes and initialize/cleanup accordingly
  watchEffect(() => {
    if (isCleanedUp) {
      return
    }

    if (user.value) {
      // User is authenticated - initialize subscription if not already active
      if (!channel) {
        initialize()
      }
    }
    else {
      // User is not authenticated - cleanup subscription (but allow re-initialization)
      cleanupSubscription()
      reconnectAttempts = 0 // Reset attempts when user logs out
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    cleanup()
  })

  return {
    showConflictModal,
    conflictData,
    dismissConflict,
  }
}
