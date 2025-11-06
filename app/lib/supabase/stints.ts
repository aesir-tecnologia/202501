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

export type ConflictError = {
  code: 'CONFLICT'
  existingStint: StintRow
  message: string
}

export type StintConflictResult = {
  error: ConflictError
  data: null
} | {
  error: null
  data: StintRow
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
    query = query.in('status', ['active', 'paused'])
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

  // Use status-based filtering instead of is_completed
  const { data, error } = await client
    .from('stints')
    .select('*')
    .eq('user_id', userResult.data!)
    .in('status', ['active', 'paused'])
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

/**
 * Get the current version number for a user (for optimistic locking)
 */
export async function getUserVersion(
  client: TypedSupabaseClient,
): Promise<Result<number>> {
  const userResult = await requireUserId(client)
  if (userResult.error) return { data: null, error: userResult.error }

  const { data, error } = await client
    .from('user_profiles')
    .select('version')
    .eq('id', userResult.data!)
    .single<{ version: number }>()

  if (error) return { data: null, error }
  return { data: data.version, error: null }
}

/**
 * Pause an active stint
 */
export async function pauseStint(
  client: TypedSupabaseClient,
  stintId: string,
): Promise<Result<StintRow>> {
  const userResult = await requireUserId(client)
  if (userResult.error) return { data: null, error: userResult.error }

  // Call the pause_stint RPC function
  const { data, error } = await client
    .rpc('pause_stint', { p_stint_id: stintId })
    .single<StintRow>()

  if (error) {
    // Map database errors to user-friendly messages
    if (error.message?.includes('not active')) {
      return { data: null, error: new Error('Stint is not active and cannot be paused') }
    }
    if (error.message?.includes('not found')) {
      return { data: null, error: new Error('Stint not found') }
    }
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Resume a paused stint
 */
export async function resumeStint(
  client: TypedSupabaseClient,
  stintId: string,
): Promise<Result<StintRow>> {
  const userResult = await requireUserId(client)
  if (userResult.error) return { data: null, error: userResult.error }

  // Call the resume_stint RPC function
  const { data, error } = await client
    .rpc('resume_stint', { p_stint_id: stintId })
    .single<StintRow>()

  if (error) {
    // Map database errors to user-friendly messages
    if (error.message?.includes('not paused')) {
      return { data: null, error: new Error('Stint is not paused and cannot be resumed') }
    }
    if (error.message?.includes('not found')) {
      return { data: null, error: new Error('Stint not found') }
    }
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Complete a stint (manual or auto completion)
 */
export async function completeStint(
  client: TypedSupabaseClient,
  stintId: string,
  completionType: 'manual' | 'auto' | 'interrupted',
  notes?: string | null,
): Promise<Result<StintRow>> {
  const userResult = await requireUserId(client)
  if (userResult.error) return { data: null, error: userResult.error }

  // Call the complete_stint RPC function
  const { data, error } = await client
    .rpc('complete_stint', {
      p_stint_id: stintId,
      p_completion_type: completionType,
      p_notes: notes ?? undefined,
    })
    .single<StintRow>()

  if (error) {
    // Map database errors to user-friendly messages
    if (error.message?.includes('not active')) {
      return { data: null, error: new Error('Stint is not active and cannot be completed') }
    }
    if (error.message?.includes('not found')) {
      return { data: null, error: new Error('Stint not found') }
    }
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Start a new stint with validation and conflict detection
 */
export async function startStint(
  client: TypedSupabaseClient,
  projectId: string,
  plannedDurationMinutes?: number,
  notes?: string,
): Promise<StintConflictResult | Result<StintRow>> {
  const userResult = await requireUserId(client)
  if (userResult.error) return { data: null, error: userResult.error }

  const userId = userResult.data!

  // Get user version for optimistic locking
  const versionResult = await getUserVersion(client)
  if (versionResult.error) return { data: null, error: versionResult.error }

  const userVersion = versionResult.data!

  // Get project to determine planned duration
  const { data: project, error: projectError } = await client
    .from('projects')
    .select('custom_stint_duration')
    .eq('id', projectId)
    .eq('user_id', userId)
    .is('archived_at', null)
    .single<{ custom_stint_duration: number | null }>()

  if (projectError || !project) {
    return { data: null, error: new Error('Project not found or archived') }
  }

  // Determine planned duration: use provided, project custom, or default 50
  const plannedDuration = plannedDurationMinutes ?? project.custom_stint_duration ?? 50

  // Validate stint start using database function
  const { data: validation, error: validationError } = await client
    .rpc('validate_stint_start', {
      p_user_id: userId,
      p_project_id: projectId,
      p_version: userVersion,
    })
    .single<{
    can_start: boolean
    existing_stint_id: string | null
    conflict_message: string | null
  }>()

  if (validationError) {
    return { data: null, error: validationError }
  }

  // If validation fails, return conflict error
  if (!validation.can_start) {
    // Fetch the existing stint details
    const existingStintResult = await getStintById(client, validation.existing_stint_id!)
    if (existingStintResult.error || !existingStintResult.data) {
      return {
        error: {
          code: 'CONFLICT',
          existingStint: {} as StintRow,
          message: validation.conflict_message || 'Cannot start stint: conflict detected',
        },
        data: null,
      }
    }

    return {
      error: {
        code: 'CONFLICT',
        existingStint: existingStintResult.data,
        message: validation.conflict_message || 'An active stint already exists',
      },
      data: null,
    }
  }

  // Validation passed, create the stint
  const { data, error } = await client
    .from('stints')
    .insert({
      project_id: projectId,
      user_id: userId,
      status: 'active',
      planned_duration: plannedDuration,
      started_at: new Date().toISOString(),
      notes: notes || null,
    })
    .select('*')
    .single<StintRow>()

  if (error) {
    // Check if conflict occurred (race condition)
    if (error.code === '23505') {
      // Unique constraint violation - another stint was started concurrently
      const activeStintResult = await getActiveStint(client)
      if (activeStintResult.data) {
        return {
          error: {
            code: 'CONFLICT',
            existingStint: activeStintResult.data,
            message: 'Another stint was started concurrently',
          },
          data: null,
        }
      }
    }
    return { data: null, error }
  }

  return { data, error: null }
}
