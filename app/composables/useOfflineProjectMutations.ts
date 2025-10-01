import { useProjectMutations } from './useProjectMutations'
import { useOfflineQueue } from './useOfflineQueue'
import { ErrorCategory } from '~/utils/errors'
import type { OptimisticResult } from './useProjectMutations'
import type { ProjectRow } from '~/lib/supabase/projects'
import type { ProjectCreatePayload, ProjectUpdatePayload } from '~/schemas/projects'

/**
 * Enhanced project mutations composable with offline support
 *
 * Automatically queues failed mutations for retry on reconnection
 *
 * Usage:
 * ```ts
 * const { createProject, updateProject } = useOfflineProjectMutations()
 * const result = await createProject({ name: 'New Project' })
 * // Automatically queued if network fails
 * ```
 */
export function useOfflineProjectMutations(
  clientOverride?: any,
  projectsStateOverride?: any,
) {
  const baseComposable = useProjectMutations(clientOverride, projectsStateOverride)
  const { queueMutation, isOnline } = useOfflineQueue()
  const { showInfo } = useErrorToast()

  async function createProject(payload: ProjectCreatePayload): Promise<OptimisticResult<ProjectRow>> {
    const result = await baseComposable.createProject(payload)

    // Queue if network error
    if (result.error && result.error.category === ErrorCategory.Network) {
      await queueMutation('project', 'create', payload)
      showInfo('Project will be created when connection is restored')
      return result
    }

    return result
  }

  async function updateProject(
    projectId: string,
    updates: ProjectUpdatePayload,
  ): Promise<OptimisticResult<ProjectRow>> {
    const result = await baseComposable.updateProject(projectId, updates)

    // Queue if network error
    if (result.error && result.error.category === ErrorCategory.Network) {
      await queueMutation('project', 'update', { id: projectId, updates })
      showInfo('Project will be updated when connection is restored')
      return result
    }

    return result
  }

  async function toggleActive(projectId: string): Promise<OptimisticResult<ProjectRow>> {
    const result = await baseComposable.toggleActive(projectId)

    // Queue if network error (toggleActive internally calls updateProject)
    if (result.error && result.error.category === ErrorCategory.Network) {
      // Don't need to queue since updateProject already handles it
      return result
    }

    return result
  }

  async function deleteProject(projectId: string): Promise<OptimisticResult<ProjectRow>> {
    const result = await baseComposable.deleteProject(projectId)

    // Queue if network error
    if (result.error && result.error.category === ErrorCategory.Network) {
      await queueMutation('project', 'delete', { id: projectId })
      showInfo('Project will be deleted when connection is restored')
      return result
    }

    return result
  }

  return {
    createProject,
    updateProject,
    toggleActive,
    deleteProject,
    isOnline: readonly(isOnline),
  }
}
