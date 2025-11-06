import { ref, onUnmounted } from 'vue'
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

  let channel: RealtimeChannel | null = null

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
   * Initialize real-time subscription (only for authenticated users)
   */
  function initialize() {
    if (!user.value) {
      console.warn('[useStintRealtime] No authenticated user - skipping subscription')
      return
    }

    // Create channel for user-specific stint changes
    channel = client
      .channel('user-stints')
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
        }
        else if (status === 'CHANNEL_ERROR') {
          console.error('[useStintRealtime] Channel error - subscription failed')
          toast.add({
            title: 'Real-time sync unavailable',
            description: 'Unable to connect to real-time updates',
            color: 'error',
            icon: 'i-lucide-wifi-off',
          })
        }
      })
  }

  /**
   * Cleanup subscription on unmount
   */
  function cleanup() {
    if (channel) {
      console.log('[useStintRealtime] Cleaning up subscription')
      client.removeChannel(channel)
      channel = null
    }
  }

  // Initialize subscription
  initialize()

  // Cleanup on unmount
  onUnmounted(cleanup)

  return {
    showConflictModal,
    conflictData,
    dismissConflict,
  }
}
