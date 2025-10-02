import type { RealtimeChannel } from '@supabase/supabase-js'
import type { TypedSupabaseClient } from '~/utils/supabase'
import type { ProjectRow } from '~/lib/supabase/projects'
import { listProjects } from '~/lib/supabase/projects'

/**
 * Composable for centralized project state management
 *
 * Provides reactive state for projects list with real-time synchronization.
 * Integrates with useProjectMutations for optimistic updates.
 * Automatically subscribes to Supabase real-time updates on mount.
 *
 * Usage:
 * ```ts
 * const { projects, activeProjects, isLoading, error, fetchProjects, resetState } = useProjects()
 * await fetchProjects()
 * ```
 */
export function useProjects(
  clientOverride?: TypedSupabaseClient,
  projectsStateOverride?: Ref<ProjectRow[]>,
) {
  const client: TypedSupabaseClient = clientOverride ?? (useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient)

  // Global state
  const projects = projectsStateOverride ?? useState<ProjectRow[]>('projects', () => [])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const isSubscribed = ref(false)

  // Store channel reference for cleanup
  let realtimeChannel: RealtimeChannel | null = null

  /**
   * Computed: Filter only active projects
   */
  const activeProjects = computed(() =>
    projects.value.filter(p => p.is_active),
  )

  /**
   * Computed: Filter only inactive projects
   */
  const inactiveProjects = computed(() =>
    projects.value.filter(p => !p.is_active),
  )

  /**
   * Fetch projects from database
   */
  async function fetchProjects(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await listProjects(client)

      if (fetchError) {
        error.value = fetchError
        return
      }

      projects.value = data || []
    }
    catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to fetch projects')
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Get project by ID
   */
  function getProjectById(id: string): ProjectRow | undefined {
    return projects.value.find(p => p.id === id)
  }

  /**
   * Subscribe to real-time project updates
   */
  function subscribeToProjects(): void {
    if (isSubscribed.value || !import.meta.client)
      return

    try {
      realtimeChannel = client
        .channel('projects-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'projects',
          },
          (payload) => {
            handleRealtimeEvent(payload)
          },
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            isSubscribed.value = true
          }
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Realtime subscription error:', status)
            isSubscribed.value = false
          }
        })
    }
    catch (err) {
      console.error('Failed to subscribe to realtime updates:', err)
    }
  }

  /**
   * Handle real-time events from Supabase with conflict resolution
   */
  function handleRealtimeEvent(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload

    // Use conflict resolution for concurrent edits
    const { resolveProjectConflict } = useConflictResolution()

    switch (eventType) {
      case 'INSERT':
        // Add new project if not already present (avoid duplicates from optimistic updates)
        if (!projects.value.some(p => p.id === newRecord.id)) {
          projects.value = [newRecord as ProjectRow, ...projects.value]
        }
        break

      case 'UPDATE':
        // Resolve conflicts with existing client data
        const existingProject = projects.value.find(p => p.id === newRecord.id)
        const resolvedProject = resolveProjectConflict(
          existingProject ?? null,
          newRecord as ProjectRow,
          'merge-timestamps',
        )

        // Update with resolved data
        projects.value = projects.value.map(p =>
          p.id === newRecord.id ? resolvedProject : p,
        )
        break

      case 'DELETE':
        // Remove deleted project
        projects.value = projects.value.filter(p => p.id !== oldRecord.id)
        break
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  function unsubscribe(): void {
    if (realtimeChannel) {
      client.removeChannel(realtimeChannel)
      realtimeChannel = null
      isSubscribed.value = false
    }
  }

  /**
   * Reset state (useful for logout)
   */
  function resetState(): void {
    unsubscribe()
    projects.value = []
    error.value = null
    isLoading.value = false
  }

  // Auto-subscribe on client-side mount
  if (import.meta.client) {
    onMounted(() => {
      subscribeToProjects()
    })

    onUnmounted(() => {
      unsubscribe()
    })
  }

  return {
    // State
    projects: readonly(projects),
    activeProjects: readonly(activeProjects),
    inactiveProjects: readonly(inactiveProjects),
    isLoading: readonly(isLoading),
    error: readonly(error),
    isSubscribed: readonly(isSubscribed),

    // Methods
    fetchProjects,
    getProjectById,
    subscribeToProjects,
    unsubscribe,
    resetState,
  }
}
