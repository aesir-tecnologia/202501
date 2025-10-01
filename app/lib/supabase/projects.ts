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

async function requireUserId(client: TypedSupabaseClient): Promise<string> {
  const { data, error } = await client.auth.getUser()

  if (error || !data?.user) {
    throw new Error('User must be authenticated to interact with projects')
  }

  return data.user.id
}

export async function listProjects(client: TypedSupabaseClient) {
  const userId = await requireUserId(client)
  return client
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

export async function getProjectById(
  client: TypedSupabaseClient,
  projectId: string,
) {
  const userId = await requireUserId(client)
  return client
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .eq('id', projectId)
    .maybeSingle<ProjectRow>()
}

export async function createProject(
  client: TypedSupabaseClient,
  payload: CreateProjectPayload,
) {
  const userId = await requireUserId(client)
  return client
    .from('projects')
    .insert({
      ...payload,
      user_id: userId,
    })
    .select('*')
    .single<ProjectRow>()
}

export async function updateProject(
  client: TypedSupabaseClient,
  projectId: string,
  updates: UpdateProjectPayload,
) {
  const userId = await requireUserId(client)
  return client
    .from('projects')
    .update(updates)
    .eq('user_id', userId)
    .eq('id', projectId)
    .select('*')
    .single<ProjectRow>()
}

export async function deleteProject(
  client: TypedSupabaseClient,
  projectId: string,
) {
  const userId = await requireUserId(client)
  return client
    .from('projects')
    .delete()
    .eq('user_id', userId)
    .eq('id', projectId)
    .select('*')
    .maybeSingle<ProjectRow>()
}
