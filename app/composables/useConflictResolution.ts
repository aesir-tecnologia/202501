import { ref, readonly } from 'vue'
import type { ProjectRow } from '~/lib/supabase/projects'
import type { StintRow } from '~/lib/supabase/stints'

/**
 * Conflict resolution strategy
 */
export type ConflictStrategy = 'server-wins' | 'client-wins' | 'merge-timestamps' | 'notify-user'

/**
 * Detected conflict information
 */
export interface Conflict<T> {
  id: string
  type: 'project' | 'stint'
  clientData: T
  serverData: T
  clientTimestamp: string
  serverTimestamp: string
  resolvedData: T
  strategy: ConflictStrategy
}

/**
 * Composable for handling optimistic update conflicts
 *
 * Detects when real-time server data differs from local optimistic state.
 * Provides configurable resolution strategies for concurrent edits.
 *
 * Usage:
 * ```ts
 * const { resolveConflict, conflicts, clearConflicts } = useConflictResolution()
 * const resolved = resolveConflict(clientProject, serverProject, 'merge-timestamps')
 * ```
 */
export function useConflictResolution() {
  // Store detected conflicts for user review
  const conflicts = ref<Conflict<ProjectRow | StintRow>[]>([])

  /**
   * Detect if server data conflicts with client data
   * Conflicts occur when updated_at timestamps differ significantly (>1s)
   */
  function hasConflict<T extends { updated_at: string }>(
    clientData: T | null,
    serverData: T,
  ): boolean {
    if (!clientData)
      return false

    const clientTime = new Date(clientData.updated_at).getTime()
    const serverTime = new Date(serverData.updated_at).getTime()

    // Consider conflict if timestamps differ by more than 1 second
    return Math.abs(serverTime - clientTime) > 1000
  }

  /**
   * Resolve conflict between client and server data
   *
   * @param clientData - Local optimistic data
   * @param serverData - Real-time server data
   * @param strategy - Resolution strategy (default: server-wins)
   * @returns Resolved data
   */
  function resolveConflict<T extends { id: string, updated_at: string }>(
    clientData: T,
    serverData: T,
    strategy: ConflictStrategy = 'server-wins',
  ): T {
    const clientTime = new Date(clientData.updated_at).getTime()
    const serverTime = new Date(serverData.updated_at).getTime()

    let resolvedData: T

    switch (strategy) {
      case 'client-wins':
        // Keep client data, discard server changes
        resolvedData = clientData
        break

      case 'merge-timestamps':
        // Use newest data based on updated_at timestamp
        resolvedData = serverTime > clientTime ? serverData : clientData
        break

      case 'notify-user':
        // Default to server data but notify user of conflict
        resolvedData = serverData
        logConflict(clientData, serverData, resolvedData, strategy)
        break

      case 'server-wins':
      default:
        // Default: server always wins
        resolvedData = serverData
        break
    }

    return resolvedData
  }

  /**
   * Resolve project conflict with automatic strategy selection
   */
  function resolveProjectConflict(
    clientProject: ProjectRow | null,
    serverProject: ProjectRow,
    strategy: ConflictStrategy = 'merge-timestamps',
  ): ProjectRow {
    if (!clientProject || !hasConflict(clientProject, serverProject)) {
      return serverProject
    }

    return resolveConflict(clientProject, serverProject, strategy)
  }

  /**
   * Resolve stint conflict with automatic strategy selection
   */
  function resolveStintConflict(
    clientStint: StintRow | null,
    serverStint: StintRow,
    strategy: ConflictStrategy = 'merge-timestamps',
  ): StintRow {
    if (!clientStint || !hasConflict(clientStint, serverStint)) {
      return serverStint
    }

    return resolveConflict(clientStint, serverStint, strategy)
  }

  /**
   * Log conflict for user review
   */
  function logConflict<T extends { id: string, updated_at: string }>(
    clientData: T,
    serverData: T,
    resolvedData: T,
    strategy: ConflictStrategy,
  ): void {
    const conflict: Conflict<T> = {
      id: clientData.id,
      type: 'project_id' in clientData ? 'stint' : 'project',
      clientData,
      serverData,
      clientTimestamp: clientData.updated_at,
      serverTimestamp: serverData.updated_at,
      resolvedData,
      strategy,
    }

    conflicts.value = [conflict, ...conflicts.value]

    // Emit custom event for UI notifications
    if (import.meta.client) {
      window.dispatchEvent(new CustomEvent('data-conflict', {
        detail: conflict,
      }))
    }
  }

  /**
   * Clear all logged conflicts
   */
  function clearConflicts(): void {
    conflicts.value = []
  }

  /**
   * Remove specific conflict by ID
   */
  function dismissConflict(id: string): void {
    conflicts.value = conflicts.value.filter(c => c.id !== id)
  }

  return {
    // State
    conflicts: readonly(conflicts),

    // Methods
    hasConflict,
    resolveConflict,
    resolveProjectConflict,
    resolveStintConflict,
    logConflict,
    clearConflicts,
    dismissConflict,
  }
}
