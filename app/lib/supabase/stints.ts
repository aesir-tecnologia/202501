import type { Database } from '~/types/database.types';
import type { TypedSupabaseClient } from '~/utils/supabase';
import type { SyncCheckOutput } from '~/schemas/stints';
import { STINT } from '~/constants';

/**
 * Data-access helpers for the Supabase `stints` table.
 */
export type StintRow = Database['public']['Tables']['stints']['Row'];
export type StintInsert = Database['public']['Tables']['stints']['Insert'];
export type StintUpdate = Database['public']['Tables']['stints']['Update'];

export type CreateStintPayload = Omit<StintInsert, 'user_id'>;
export type UpdateStintPayload = Omit<StintUpdate, 'user_id' | 'id'>;

export type Result<T> = {
  data: T | null
  error: Error | null
};

interface ListStintsOptions {
  projectId?: string
  activeOnly?: boolean
}

export type ConflictError = {
  code: 'CONFLICT'
  existingStint: StintRow | null
  message: string
};

export type StintConflictResult = {
  error: ConflictError
  data: null
} | {
  error: null
  data: StintRow
};

async function requireUserId(client: TypedSupabaseClient): Promise<Result<string>> {
  const { data, error } = await client.auth.getUser();

  if (error || !data?.user) {
    return { data: null, error: new Error('User must be authenticated to interact with stints') };
  }

  return { data: data.user.id, error: null };
}

export async function listStints(
  client: TypedSupabaseClient,
  options: ListStintsOptions = {},
): Promise<Result<StintRow[]>> {
  const userResult = await requireUserId(client);
  if (userResult.error) return { data: null, error: userResult.error };

  let query = client
    .from('stints')
    .select('*')
    .eq('user_id', userResult.data!)
    .order('started_at', { ascending: false });

  if (options.projectId) {
    query = query.eq('project_id', options.projectId);
  }

  if (options.activeOnly) {
    query = query.in('status', ['active', 'paused']);
  }

  const { data, error } = await query;

  if (error) return { data: null, error };
  return { data: data || [], error: null };
}

export async function getStintById(
  client: TypedSupabaseClient,
  stintId: string | number,
): Promise<Result<StintRow | null>> {
  const userResult = await requireUserId(client);
  if (userResult.error) return { data: null, error: userResult.error };

  const { data, error } = await client
    .from('stints')
    .select('*')
    .eq('user_id', userResult.data!)
    .eq('id', String(stintId))
    .maybeSingle<StintRow>();

  if (error) return { data: null, error };
  return { data, error: null };
}

/**
 * Get the currently active stint (status = 'active' only)
 *
 * Note: Changed from returning active OR paused to active only,
 * since we now allow 1 active + 1 paused simultaneously.
 */
export async function getActiveStint(
  client: TypedSupabaseClient,
): Promise<Result<StintRow | null>> {
  const userResult = await requireUserId(client);
  if (userResult.error) return { data: null, error: userResult.error };

  const { data, error } = await client
    .from('stints')
    .select('*')
    .eq('user_id', userResult.data!)
    .eq('status', 'active')
    .maybeSingle<StintRow>();

  if (error) {
    return { data: null, error: new Error(error.message || 'Failed to get active stint') };
  }

  return { data: data || null, error: null };
}

/**
 * Get the currently paused stint (status = 'paused' only)
 *
 * Returns the user's paused stint if one exists. With the pause-and-switch
 * feature, users can have both an active and a paused stint simultaneously.
 */
export async function getPausedStint(
  client: TypedSupabaseClient,
): Promise<Result<StintRow | null>> {
  const userResult = await requireUserId(client);
  if (userResult.error) return { data: null, error: userResult.error };

  const { data, error } = await client
    .from('stints')
    .select('*')
    .eq('user_id', userResult.data!)
    .eq('status', 'paused')
    .maybeSingle<StintRow>();

  if (error) {
    return { data: null, error: new Error(error.message || 'Failed to get paused stint') };
  }

  return { data: data || null, error: null };
}

export async function createStint(
  client: TypedSupabaseClient,
  payload: CreateStintPayload,
): Promise<Result<StintRow>> {
  const userResult = await requireUserId(client);
  if (userResult.error) return { data: null, error: userResult.error };

  const { data, error } = await client
    .from('stints')
    .insert({
      ...payload,
      user_id: userResult.data!,
    })
    .select('*')
    .single<StintRow>();

  if (error) return { data: null, error };
  return { data, error: null };
}

export async function updateStint(
  client: TypedSupabaseClient,
  stintId: string | number,
  updates: UpdateStintPayload,
): Promise<Result<StintRow>> {
  const userResult = await requireUserId(client);
  if (userResult.error) return { data: null, error: userResult.error };

  const { data, error } = await client
    .from('stints')
    .update(updates)
    .eq('user_id', userResult.data!)
    .eq('id', String(stintId))
    .select('*')
    .single<StintRow>();

  if (error) return { data: null, error };
  return { data, error: null };
}

export async function deleteStint(
  client: TypedSupabaseClient,
  stintId: string | number,
): Promise<Result<void>> {
  const userResult = await requireUserId(client);
  if (userResult.error) return { data: null, error: userResult.error };

  // Verify stint exists and is owned by user
  const stintResult = await getStintById(client, stintId);
  if (stintResult.error) return { data: null, error: stintResult.error };
  if (!stintResult.data) {
    return { data: null, error: new Error('Stint not found or you do not have permission to delete it') };
  }

  const { error } = await client
    .from('stints')
    .delete()
    .eq('user_id', userResult.data!)
    .eq('id', String(stintId));

  if (error) return { data: null, error };
  return { data: null, error: null };
}

/**
 * Get the current version number for a user (for optimistic locking)
 */
export async function getUserVersion(
  client: TypedSupabaseClient,
): Promise<Result<number>> {
  const userResult = await requireUserId(client);
  if (userResult.error) return { data: null, error: userResult.error };

  const { data, error } = await client
    .from('user_profiles')
    .select('version')
    .eq('id', userResult.data!)
    .single<{ version: number }>();

  if (error) return { data: null, error };
  return { data: data.version, error: null };
}

/**
 * Pause an active stint
 */
export async function pauseStint(
  client: TypedSupabaseClient,
  stintId: string,
): Promise<Result<StintRow>> {
  const userResult = await requireUserId(client);
  if (userResult.error) return { data: null, error: userResult.error };

  // Call pause_stint RPC directly
  const { data, error } = await client
    .rpc('pause_stint', { p_stint_id: stintId })
    .single<StintRow>();

  if (error) {
    // Map database errors to user-friendly messages
    if (error.message?.includes('not active')) {
      return { data: null, error: new Error('This stint is not active and cannot be paused') };
    }
    if (error.message?.includes('not found')) {
      return { data: null, error: new Error('Stint not found') };
    }
    if (error.message?.includes('already have a paused stint')) {
      return { data: null, error: new Error('You already have a paused stint. Complete or abandon it first.') };
    }
    return { data: null, error: new Error('Failed to pause stint') };
  }

  if (!data) {
    return { data: null, error: new Error('No data returned from pause operation') };
  }

  return { data, error: null };
}

/**
 * Resume a paused stint
 */
export async function resumeStint(
  client: TypedSupabaseClient,
  stintId: string,
): Promise<Result<StintRow>> {
  const userResult = await requireUserId(client);
  if (userResult.error) return { data: null, error: userResult.error };

  // Call resume_stint RPC directly
  const { data, error } = await client
    .rpc('resume_stint', { p_stint_id: stintId })
    .single<StintRow>();

  if (error) {
    // Map database errors to user-friendly messages
    if (error.message?.includes('not paused')) {
      return { data: null, error: new Error('This stint is not paused and cannot be resumed') };
    }
    if (error.message?.includes('not found')) {
      return { data: null, error: new Error('Stint not found') };
    }
    if (error.message?.includes('Cannot resume while another stint is active')) {
      return { data: null, error: new Error('Cannot resume while another stint is active. Stop or complete the active stint first.') };
    }
    return { data: null, error: new Error('Failed to resume stint') };
  }

  if (!data) {
    return { data: null, error: new Error('No data returned from resume operation') };
  }

  return { data, error: null };
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
  const userResult = await requireUserId(client);
  if (userResult.error) return { data: null, error: userResult.error };

  // Validate notes length (max 500 chars)
  if (notes && notes.length > 500) {
    return { data: null, error: new Error('Notes cannot exceed 500 characters') };
  }

  // Call complete_stint RPC directly for all completion types
  const { data, error } = await client
    .rpc('complete_stint', {
      p_stint_id: stintId,
      p_completion_type: completionType,
      p_notes: notes ?? undefined,
    })
    .single<StintRow>();

  if (error) {
    // Map database errors to user-friendly messages
    if (error.message?.includes('not active') || error.message?.includes('not paused')) {
      return { data: null, error: new Error('This stint is not active or paused and cannot be completed') };
    }
    if (error.message?.includes('not found')) {
      return { data: null, error: new Error('Stint not found') };
    }
    return { data: null, error: new Error('Failed to complete stint') };
  }

  if (!data) {
    return { data: null, error: new Error('No data returned from complete operation') };
  }

  return { data, error: null };
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
  const userResult = await requireUserId(client);
  if (userResult.error || !userResult.data) {
    return { data: null, error: userResult.error || new Error('User ID unavailable') };
  }
  const userId = userResult.data;

  // Get user version for optimistic locking
  const versionResult = await getUserVersion(client);
  if (versionResult.error || versionResult.data === null) {
    return { data: null, error: versionResult.error || new Error('User version unavailable') };
  }
  const userVersion = versionResult.data;

  // Query project for custom_stint_duration and archived_at
  const { data: project, error: projectError } = await client
    .from('projects')
    .select('id, custom_stint_duration, archived_at')
    .eq('user_id', userId)
    .eq('id', projectId)
    .maybeSingle();

  if (projectError) {
    return { data: null, error: new Error('Failed to query project') };
  }

  if (!project) {
    return { data: null, error: new Error('Project not found') };
  }

  if (project.archived_at !== null) {
    return { data: null, error: new Error('Cannot start stint for archived project') };
  }

  // Resolve planned duration: param → project custom → default 120
  const resolvedDuration = plannedDurationMinutes
    ?? project.custom_stint_duration
    ?? STINT.DURATION_MINUTES.DEFAULT;

  // Validate duration bounds (5-480)
  if (resolvedDuration < STINT.DURATION_MINUTES.MIN || resolvedDuration > STINT.DURATION_MINUTES.MAX) {
    return {
      data: null,
      error: new Error(`Duration must be between ${STINT.DURATION_MINUTES.MIN} and ${STINT.DURATION_MINUTES.MAX} minutes`),
    };
  }

  // TOCTOU (Time-of-Check-Time-of-Use) Race Condition Handling:
  // 1. Validate stint start using RPC (check user version + active stint status)
  // 2. If validation passes, attempt insert with unique constraint
  // 3. If insert fails with duplicate key (23505), handle race condition below
  // This two-phase approach ensures atomicity: validation prevents most conflicts,
  // and the unique constraint catches any race conditions between validation and insert.
  const { data: validation, error: validationError } = await client
    .rpc('validate_stint_start', {
      p_user_id: userId,
      p_project_id: projectId,
      p_version: userVersion,
    })
    .single();

  if (validationError) {
    return { data: null, error: new Error('Failed to validate stint start') };
  }

  if (!validation.can_start) {
    // Fetch existing stint details for conflict error
    const { data: existingStint } = await client
      .from('stints')
      .select('*')
      .eq('id', validation.existing_stint_id)
      .single();

    return {
      error: {
        code: 'CONFLICT',
        existingStint: existingStint || null,
        message: validation.conflict_message || 'An active stint already exists',
      },
      data: null,
    };
  }

  // Insert new stint
  const { data: newStint, error: insertError } = await client
    .from('stints')
    .insert({
      user_id: userId,
      project_id: projectId,
      planned_duration: resolvedDuration,
      notes: notes || null,
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  // Handle race condition (23505 = duplicate key)
  if (insertError) {
    if (insertError.code === '23505') {
      // Race condition: another stint was started between validation and insert
      const { data: conflictingStint } = await client
        .from('stints')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'paused'])
        .maybeSingle();

      return {
        error: {
          code: 'CONFLICT',
          existingStint: conflictingStint || null,
          message: 'An active stint already exists',
        },
        data: null,
      };
    }

    return { data: null, error: new Error('Failed to create stint') };
  }

  if (!newStint) {
    return { data: null, error: new Error('No data returned from stint creation') };
  }

  return { data: newStint, error: null };
}

export async function syncStintCheck(
  client: TypedSupabaseClient,
  stintId: string,
): Promise<Result<SyncCheckOutput>> {
  const userResult = await requireUserId(client);
  if (userResult.error) return { data: null, error: userResult.error };

  const { data: stint, error } = await client
    .from('stints')
    .select('*')
    .eq('user_id', userResult.data!)
    .eq('id', stintId)
    .maybeSingle<StintRow>();

  if (error) {
    return { data: null, error: new Error('Failed to query stint') };
  }

  if (!stint) {
    return { data: null, error: new Error('Stint not found') };
  }

  if (stint.status === 'completed') {
    return { data: null, error: new Error('Stint is completed and cannot be synced') };
  }

  if (!stint.started_at || !stint.planned_duration) {
    return { data: null, error: new Error('Invalid stint data: missing required fields') };
  }

  const now = new Date();
  const serverTimestamp = now.toISOString();
  const startedAt = new Date(stint.started_at);
  const pausedDuration = stint.paused_duration || 0;
  const plannedDurationSeconds = stint.planned_duration * 60;

  let remainingSeconds: number;

  if (stint.status === 'active') {
    const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
    const pausedSeconds = pausedDuration;
    remainingSeconds = plannedDurationSeconds - elapsedSeconds + pausedSeconds;
  }
  else {
    const pausedAt = stint.paused_at ? new Date(stint.paused_at) : now;
    const elapsedSeconds = Math.floor((pausedAt.getTime() - startedAt.getTime()) / 1000);
    const pausedSeconds = pausedDuration;
    remainingSeconds = plannedDurationSeconds - elapsedSeconds + pausedSeconds;
  }

  remainingSeconds = Math.max(0, remainingSeconds);

  return {
    data: {
      stintId: stint.id,
      status: stint.status,
      remainingSeconds,
      serverTimestamp,
    },
    error: null,
  };
}
