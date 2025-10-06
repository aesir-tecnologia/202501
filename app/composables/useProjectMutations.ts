import type { TypedSupabaseClient } from '~/utils/supabase'
import {
  createProject as createProjectDb,
  updateProject as updateProjectDb,
  deleteProject as deleteProjectDb,
  updateProjectSortOrder as updateProjectSortOrderDb,
  type ProjectRow,
  type CreateProjectPayload as DbCreateProjectPayload,
  type UpdateProjectPayload as DbUpdateProjectPayload,
} from '~/lib/supabase/projects'
import {
  projectCreateSchema,
  projectUpdateSchema,
  type ProjectCreatePayload,
  type ProjectUpdatePayload,
} from '~/schemas/projects'

export interface OptimisticResult<T> {
  data: T | null
  error: Error | null
}

/**
 * Transforms camelCase payload to snake_case for database operations
 */
function toDbPayload(payload: ProjectCreatePayload | ProjectUpdatePayload): DbCreateProjectPayload | DbUpdateProjectPayload {
  const result: Record<string, unknown> = {}

  if ('name' in payload && payload.name !== undefined) {
    result.name = payload.name
  }
  if ('isActive' in payload && payload.isActive !== undefined) {
    result.is_active = payload.isActive
  }
  if ('expectedDailyStints' in payload && payload.expectedDailyStints !== undefined) {
    result.expected_daily_stints = payload.expectedDailyStints
  }
  if ('customStintDuration' in payload && payload.customStintDuration !== undefined) {
    result.custom_stint_duration = payload.customStintDuration
  }

  return result as DbCreateProjectPayload | DbUpdateProjectPayload
}

/**
 * Composable providing optimistic mutation helpers for project CRUD operations.
 *
 * All mutations immediately update local state and roll back on failure.
 * Designed to work with Supabase realtime for multi-tab synchronization.
 *
 * Usage:
 * ```ts
 * const { createProject, updateProject, toggleActive, deleteProject } = useProjectMutations()
 * const result = await createProject({ name: 'New Project' })
 * ```
 */
export function useProjectMutations(
  clientOverride?: TypedSupabaseClient,
  projectsStateOverride?: Ref<ProjectRow[]>,
) {
  const client: TypedSupabaseClient = clientOverride ?? (useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient)
  const projects = projectsStateOverride ?? useState<ProjectRow[]>('projects', () => [])

  /**
   * Creates a new project with optimistic UI update.
   * Validates input, adds to local state immediately, rolls back on error.
   */
  async function createProject(
    payload: ProjectCreatePayload,
  ): Promise<OptimisticResult<ProjectRow>> {
    // Validate input
    const validation = projectCreateSchema.safeParse(payload)
    if (!validation.success) {
      return {
        data: null,
        error: new Error(validation.error.errors[0]?.message || 'Validation failed'),
      }
    }

    // Create optimistic project
    const optimisticProject: ProjectRow = {
      id: crypto.randomUUID(),
      name: validation.data.name,
      user_id: '', // Will be set by server
      is_active: validation.data.isActive ?? true,
      expected_daily_stints: validation.data.expectedDailyStints ?? 2,
      custom_stint_duration: validation.data.customStintDuration ?? null,
      sort_order: 0, // Will be set by server
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Optimistically add to local state
    projects.value = [optimisticProject, ...projects.value]

    // Call database (T025: updated for new database layer signature)
    const dbPayload = toDbPayload(validation.data) as DbCreateProjectPayload
    const { data, error } = await createProjectDb(client, dbPayload)

    if (error || !data) {
      // Roll back optimistic update
      projects.value = projects.value.filter(p => p.id !== optimisticProject.id)
      return { data: null, error: error ?? new Error('Failed to create project') }
    }

    // Replace optimistic project with real data
    projects.value = projects.value.map(p =>
      p.id === optimisticProject.id ? data : p,
    )

    return { data, error: null }
  }

  /**
   * Updates an existing project with optimistic UI update.
   * Validates input, updates local state immediately, rolls back on error.
   */
  async function updateProject(
    projectId: string,
    updates: ProjectUpdatePayload,
  ): Promise<OptimisticResult<ProjectRow>> {
    // Validate input
    const validation = projectUpdateSchema.safeParse(updates)
    if (!validation.success) {
      return {
        data: null,
        error: new Error(validation.error.errors[0]?.message || 'Validation failed'),
      }
    }

    // Find existing project
    const existingProject = projects.value.find(p => p.id === projectId)
    if (!existingProject) {
      return { data: null, error: new Error('Project not found') }
    }

    // Create optimistic update
    const optimisticProject: ProjectRow = {
      ...existingProject,
      ...updates,
      updated_at: new Date().toISOString(),
    }

    // Store original for rollback
    const original = existingProject

    // Optimistically update local state
    projects.value = projects.value.map(p => (p.id === projectId ? optimisticProject : p))

    // Call database (T026: updated for new database layer signature)
    const dbPayload = toDbPayload(validation.data) as DbUpdateProjectPayload
    const { data, error } = await updateProjectDb(client, projectId, dbPayload)

    if (error || !data) {
      // Roll back optimistic update
      projects.value = projects.value.map(p => (p.id === projectId ? original : p))
      return { data: null, error: error ?? new Error('Failed to update project') }
    }

    // Replace optimistic project with real data
    projects.value = projects.value.map(p => (p.id === projectId ? data : p))

    return { data, error: null }
  }

  /**
   * Toggles project active status with optimistic UI update.
   */
  async function toggleActive(projectId: string): Promise<OptimisticResult<ProjectRow>> {
    const project = projects.value.find(p => p.id === projectId)
    if (!project) {
      return { data: null, error: new Error('Project not found') }
    }

    return updateProject(projectId, { isActive: !project.is_active })
  }

  /**
   * T027: Deletes a project with optimistic UI update.
   * Removes from local state immediately, restores on error.
   */
  async function deleteProject(projectId: string): Promise<OptimisticResult<void>> {
    // Find existing project
    const existingProject = projects.value.find(p => p.id === projectId)
    if (!existingProject) {
      return { data: null, error: new Error('Project not found') }
    }

    // Store original for rollback
    const original = existingProject
    const originalIndex = projects.value.findIndex(p => p.id === projectId)

    // Optimistically remove from local state
    projects.value = projects.value.filter(p => p.id !== projectId)

    // Call database (T027: updated for new database layer signature)
    const { error } = await deleteProjectDb(client, projectId)

    if (error) {
      // Roll back optimistic update
      projects.value = [
        ...projects.value.slice(0, originalIndex),
        original,
        ...projects.value.slice(originalIndex),
      ]
      return { data: null, error }
    }

    return { data: undefined, error: null }
  }

  /**
   * T028: Reorder projects with optimistic UI update
   * Accepts reordered array of projects and updates sort_order
   */
  async function reorderProjects(newOrder: ProjectRow[]): Promise<OptimisticResult<void>> {
    // Store original state for rollback
    const previousState = [...projects.value]

    // Optimistically update local state
    projects.value = newOrder

    // Map to database updates with new sort_order
    const updates = newOrder.map((project, index) => ({
      id: project.id,
      sortOrder: index,
    }))

    // Call database (T028: updated for new database layer signature)
    const { error } = await updateProjectSortOrderDb(client, updates)

    if (error) {
      // Roll back optimistic update
      projects.value = previousState
      return { data: null, error }
    }

    return { data: undefined, error: null }
  }

  return {
    createProject,
    updateProject,
    toggleActive,
    deleteProject,
    reorderProjects,
  }
}
