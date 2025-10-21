import type { Database } from '~/types/database.types'
import type { TypedSupabaseClient } from '~/utils/supabase'

/**
 * Data-access helpers for the Supabase `projects` table.
 *
 * Example usage inside a composable or component:
 * ```ts
 * const client = useSupabaseClient<TypedSupabaseClient>()
 * const { data, error } = await listProjects(client)
 * ```
 */
export type ProjectRow = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export type CreateProjectPayload = Omit<ProjectInsert, 'user_id'>
export type UpdateProjectPayload = Omit<ProjectUpdate, 'user_id' | 'id'>

export type Result<T> = {
  data: T | null
  error: Error | null
}

async function requireUserId(client: TypedSupabaseClient): Promise<Result<string>> {
  const { data, error } = await client.auth.getUser()

  if (error || !data?.user) {
    return { data: null, error: new Error('User must be authenticated to interact with projects') }
  }

  return { data: data.user.id, error: null }
}

export async function listProjects(client: TypedSupabaseClient): Promise<Result<ProjectRow[]>> {
  const userResult = await requireUserId(client)
  if (userResult.error) return { data: null, error: userResult.error }

  const { data, error } = await client
    .from('projects')
    .select('*')
    .eq('user_id', userResult.data!)
    .order('sort_order', { ascending: true })

  if (error) return { data: null, error }
  return { data: data || [], error: null }
}

export async function getProject(
  client: TypedSupabaseClient,
  projectId: string | number,
): Promise<Result<ProjectRow | null>> {
  const userResult = await requireUserId(client)
  if (userResult.error) return { data: null, error: userResult.error }

  const { data, error } = await client
    .from('projects')
    .select('*')
    .eq('user_id', userResult.data!)
    .eq('id', String(projectId))
    .maybeSingle<ProjectRow>()

  if (error) return { data: null, error }
  return { data, error: null }
}

/**
 * @deprecated Use getProject instead
 */
export async function getProjectById(
  client: TypedSupabaseClient,
  projectId: string,
) {
  return getProject(client, projectId)
}

export async function createProject(
  client: TypedSupabaseClient,
  payload: CreateProjectPayload,
): Promise<Result<ProjectRow>> {
  const userResult = await requireUserId(client)
  if (userResult.error) return { data: null, error: userResult.error }

  const { data, error } = await client
    .from('projects')
    .insert({
      ...payload,
      user_id: userResult.data!,
    })
    .select('*')
    .single<ProjectRow>()

  if (error) {
    // Handle duplicate name error (case-insensitive unique constraint)
    if (error.code === '23505') {
      return { data: null, error: { ...error, message: 'A project with this name already exists' } }
    }
    return { data: null, error }
  }

  return { data, error: null }
}

export async function updateProject(
  client: TypedSupabaseClient,
  projectId: string | number,
  updates: UpdateProjectPayload,
): Promise<Result<ProjectRow>> {
  const userResult = await requireUserId(client)
  if (userResult.error) return { data: null, error: userResult.error }

  const { data, error } = await client
    .from('projects')
    .update(updates)
    .eq('user_id', userResult.data!)
    .eq('id', String(projectId))
    .select('*')
    .single<ProjectRow>()

  if (error) {
    // Handle duplicate name error (case-insensitive unique constraint)
    if (error.code === '23505') {
      return { data: null, error: { ...error, message: 'A project with this name already exists' } }
    }
    return { data: null, error }
  }

  return { data, error: null }
}

export async function deleteProject(
  client: TypedSupabaseClient,
  projectId: string | number,
): Promise<Result<void>> {
  const userResult = await requireUserId(client)
  if (userResult.error) return { data: null, error: userResult.error }

  // Verify project exists and is owned by user
  const projectResult = await getProject(client, projectId)
  if (projectResult.error) return { data: null, error: projectResult.error }
  if (!projectResult.data) {
    return { data: null, error: new Error('Project not found or you do not have permission to delete it') }
  }

  // Check for active stints (end_time IS NULL means active)
  const { data: activeStints } = await client
    .from('stints')
    .select('id')
    .eq('project_id', String(projectId))
    .eq('user_id', userResult.data!)
    .is('ended_at', null)
    .limit(1)

  if (activeStints && activeStints.length > 0) {
    return { data: null, error: new Error('Cannot delete project with active stint. Please stop the stint first.') }
  }

  // Delete project (cascade deletes stints via FK constraint)
  const { error } = await client
    .from('projects')
    .delete()
    .eq('user_id', userResult.data!)
    .eq('id', String(projectId))

  if (error) return { data: null, error }
  return { data: null, error: null }
}

export async function updateProjectSortOrder(
  client: TypedSupabaseClient,
  updates: Array<{ id: string | number, sortOrder: number }>,
): Promise<Result<void>> {
  const userResult = await requireUserId(client)
  if (userResult.error) return { data: null, error: userResult.error }

  // Batch update using Promise.all
  const promises = updates.map(({ id, sortOrder }) =>
    client
      .from('projects')
      .update({ sort_order: sortOrder })
      .eq('id', String(id))
      .eq('user_id', userResult.data!),
  )

  const results = await Promise.all(promises)

  // Check for any errors
  const errors = results.filter(r => r.error)
  if (errors.length > 0) {
    return { data: null, error: new Error('Failed to update project order') }
  }

  return { data: null, error: null }
}

export async function hasActiveStint(
  client: TypedSupabaseClient,
  projectId: string | number,
): Promise<Result<boolean>> {
  const userResult = await requireUserId(client)
  if (userResult.error) return { data: null, error: userResult.error }

  const { data, error } = await client
    .from('stints')
    .select('id')
    .eq('project_id', String(projectId))
    .eq('user_id', userResult.data!)
    .is('ended_at', null)
    .limit(1)

  if (error) return { data: null, error }
  return { data: Boolean(data && data.length > 0), error: null }
}
