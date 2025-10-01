import type { Database } from '~/types/database.types'
import type { TypedSupabaseClient } from '~/utils/supabase'

/**
 * Data-access helpers for the Supabase `stints` table.
 *
 * Usage example:
 * ```ts
 * const client = useSupabaseClient<TypedSupabaseClient>()
 * const { data, error } = await listStints(client, { projectId })
 * ```
 */
export type StintRow = Database['public']['Tables']['stints']['Row']
export type StintInsert = Database['public']['Tables']['stints']['Insert']
export type StintUpdate = Database['public']['Tables']['stints']['Update']

export type CreateStintPayload = Omit<StintInsert, 'user_id'>
export type UpdateStintPayload = Omit<StintUpdate, 'user_id' | 'id'>

interface ListStintsOptions {
  projectId?: string
  activeOnly?: boolean
}

async function requireUserId(client: TypedSupabaseClient): Promise<string> {
  const { data, error } = await client.auth.getUser()

  if (error || !data?.user) {
    throw new Error('User must be authenticated to interact with stints')
  }

  return data.user.id
}

export async function listStints(
  client: TypedSupabaseClient,
  options: ListStintsOptions = {},
) {
  const userId = await requireUserId(client)
  let query = client
    .from('stints')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })

  if (options.projectId) {
    query = query.eq('project_id', options.projectId)
  }

  if (options.activeOnly) {
    query = query.eq('is_completed', false).is('ended_at', null)
  }

  return query
}

export async function getStintById(
  client: TypedSupabaseClient,
  stintId: string,
) {
  const userId = await requireUserId(client)
  return client
    .from('stints')
    .select('*')
    .eq('user_id', userId)
    .eq('id', stintId)
    .maybeSingle<StintRow>()
}

export async function getActiveStint(
  client: TypedSupabaseClient,
) {
  const userId = await requireUserId(client)
  return client
    .from('stints')
    .select('*')
    .eq('user_id', userId)
    .eq('is_completed', false)
    .is('ended_at', null)
    .maybeSingle<StintRow>()
}

export async function createStint(
  client: TypedSupabaseClient,
  payload: CreateStintPayload,
) {
  const userId = await requireUserId(client)
  return client
    .from('stints')
    .insert({
      ...payload,
      user_id: userId,
    })
    .select('*')
    .single<StintRow>()
}

export async function updateStint(
  client: TypedSupabaseClient,
  stintId: string,
  updates: UpdateStintPayload,
) {
  const userId = await requireUserId(client)
  return client
    .from('stints')
    .update(updates)
    .eq('user_id', userId)
    .eq('id', stintId)
    .select('*')
    .single<StintRow>()
}

export async function deleteStint(
  client: TypedSupabaseClient,
  stintId: string,
) {
  const userId = await requireUserId(client)
  return client
    .from('stints')
    .delete()
    .eq('user_id', userId)
    .eq('id', stintId)
    .select('*')
    .maybeSingle<StintRow>()
}
