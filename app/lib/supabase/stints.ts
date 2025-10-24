import type { Database } from '~/types/database.types'
import type { TypedSupabaseClient } from '~/utils/supabase'

/**
 * Data-access helpers for the Supabase `stints` table.
 */
export type StintRow = Database['public']['Tables']['stints']['Row']
export type StintInsert = Database['public']['Tables']['stints']['Insert']
export type StintUpdate = Database['public']['Tables']['stints']['Update']

export type CreateStintPayload = Omit<StintInsert, 'user_id'>
export type UpdateStintPayload = Omit<StintUpdate, 'user_id' | 'id'>

export type Result<T> = {
  data: T | null
  error: Error | null
}

interface ListStintsOptions {
  projectId?: string
  activeOnly?: boolean
}

async function requireUserId(client: TypedSupabaseClient): Promise<Result<string>> {
  const { data, error } = await client.auth.getUser()

  if (error || !data?.user) {
    return { data: null, error: new Error('User must be authenticated to interact with stints') }
  }

  return { data: data.user.id, error: null }
}

export async function listStints(
  client: TypedSupabaseClient,
  options: ListStintsOptions = {},
): Promise<Result<StintRow[]>> {
  const userResult = await requireUserId(client)
  if (userResult.error) return { data: null, error: userResult.error }

  let query = client
    .from('stints')
    .select('*')
    .eq('user_id', userResult.data!)
    .order('started_at', { ascending: false })

  if (options.projectId) {
    query = query.eq('project_id', options.projectId)
  }

  if (options.activeOnly) {
    query = query.eq('is_completed', false).is('ended_at', null)
  }

  const { data, error } = await query

  if (error) return { data: null, error }
  return { data: data || [], error: null }
}

export async function getStintById(
  client: TypedSupabaseClient,
  stintId: string | number,
): Promise<Result<StintRow | null>> {
  const userResult = await requireUserId(client)
  if (userResult.error) return { data: null, error: userResult.error }

  const { data, error } = await client
    .from('stints')
    .select('*')
    .eq('user_id', userResult.data!)
    .eq('id', String(stintId))
    .maybeSingle<StintRow>()

  if (error) return { data: null, error }
  return { data, error: null }
}

export async function getActiveStint(
  client: TypedSupabaseClient,
): Promise<Result<StintRow | null>> {
  const userResult = await requireUserId(client)
  if (userResult.error) return { data: null, error: userResult.error }

  const { data, error } = await client
    .from('stints')
    .select('*')
    .eq('user_id', userResult.data!)
    .eq('is_completed', false)
    .is('ended_at', null)
    .maybeSingle<StintRow>()

  if (error) return { data: null, error }
  return { data, error: null }
}

export async function createStint(
  client: TypedSupabaseClient,
  payload: CreateStintPayload,
): Promise<Result<StintRow>> {
  const userResult = await requireUserId(client)
  if (userResult.error) return { data: null, error: userResult.error }

  const { data, error } = await client
    .from('stints')
    .insert({
      ...payload,
      user_id: userResult.data!,
    })
    .select('*')
    .single<StintRow>()

  if (error) return { data: null, error }
  return { data, error: null }
}

export async function updateStint(
  client: TypedSupabaseClient,
  stintId: string | number,
  updates: UpdateStintPayload,
): Promise<Result<StintRow>> {
  const userResult = await requireUserId(client)
  if (userResult.error) return { data: null, error: userResult.error }

  const { data, error } = await client
    .from('stints')
    .update(updates)
    .eq('user_id', userResult.data!)
    .eq('id', String(stintId))
    .select('*')
    .single<StintRow>()

  if (error) return { data: null, error }
  return { data, error: null }
}

export async function deleteStint(
  client: TypedSupabaseClient,
  stintId: string | number,
): Promise<Result<void>> {
  const userResult = await requireUserId(client)
  if (userResult.error) return { data: null, error: userResult.error }

  // Verify stint exists and is owned by user
  const stintResult = await getStintById(client, stintId)
  if (stintResult.error) return { data: null, error: stintResult.error }
  if (!stintResult.data) {
    return { data: null, error: new Error('Stint not found or you do not have permission to delete it') }
  }

  const { error } = await client
    .from('stints')
    .delete()
    .eq('user_id', userResult.data!)
    .eq('id', String(stintId))

  if (error) return { data: null, error }
  return { data: null, error: null }
}
