import type { Database } from '~/types/database.types';
import type { TypedSupabaseClient } from '~/utils/supabase';

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

interface SupabaseFunctionsError {
  context?: {
    status?: number
    body?: {
      error?: string
      message?: string
      existingStint?: StintRow
    }
  }
  status?: number
  data?: {
    error?: string
    message?: string
    existingStint?: StintRow
  }
  message?: string
}

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

/**
 * Validate that an object has the required fields of a StintRow
 */
function isValidStintRow(obj: unknown): obj is StintRow {
  if (!obj || typeof obj !== 'object') return false;
  const stint = obj as Record<string, unknown>;
  return (
    typeof stint.id === 'string'
    && typeof stint.user_id === 'string'
    && typeof stint.project_id === 'string'
    && typeof stint.status === 'string'
  );
}

/**
 * Parses Edge Function errors with consistent handling of various error formats.
 * Edge Functions may return errors in different structures depending on the error source.
 */
function parseEdgeFunctionError(error: unknown): {
  status?: number
  errorCode?: string
  message: string
  metadata?: Record<string, unknown>
} {
  const functionError = error as SupabaseFunctionsError;
  const errorContext = functionError.context || {};
  const errorData = errorContext.body || functionError.data || functionError;

  return {
    status: errorContext.status || functionError.status,
    errorCode: errorData?.error,
    message: errorData?.message || functionError.message || 'Unknown error occurred',
    metadata: errorData?.existingStint ? { existingStint: errorData.existingStint } : undefined,
  };
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

export async function getActiveStint(
  client: TypedSupabaseClient,
): Promise<Result<StintRow | null>> {
  const userResult = await requireUserId(client);
  if (userResult.error) return { data: null, error: userResult.error };

  // Call the stints-active Edge Function
  const { data, error } = await client.functions.invoke('stints-active', {
    body: {},
  });

  if (error) {
    // Map Edge Function errors
    return { data: null, error: new Error(error.message || 'Failed to get active stint') };
  }

  // Edge Function returns null if no active stint, or the stint object
  if (data && !isValidStintRow(data)) {
    return { data: null, error: new Error('Invalid stint data returned from active stint query') };
  }

  return { data: (data as StintRow | null) || null, error: null };
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

  // Call the stints-pause Edge Function
  const { data, error } = await client.functions.invoke('stints-pause', {
    body: { stintId },
  });

  if (error) {
    // Map Edge Function errors to user-friendly messages
    const errorMessage = error.message || 'Failed to pause stint';
    return { data: null, error: new Error(errorMessage) };
  }

  if (!data) {
    return { data: null, error: new Error('No data returned from pause stint') };
  }

  if (!isValidStintRow(data)) {
    return { data: null, error: new Error('Invalid stint data returned from pause operation') };
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

  // Call the stints-resume Edge Function
  const { data, error } = await client.functions.invoke('stints-resume', {
    body: { stintId },
  });

  if (error) {
    // Map Edge Function errors to user-friendly messages
    const errorMessage = error.message || 'Failed to resume stint';
    return { data: null, error: new Error(errorMessage) };
  }

  if (!data) {
    return { data: null, error: new Error('No data returned from resume stint') };
  }

  if (!isValidStintRow(data)) {
    return { data: null, error: new Error('Invalid stint data returned from resume operation') };
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

  // For manual completion, use the stints-stop Edge Function
  // For auto/interrupted, we still need to use RPC directly since Edge Function only handles manual
  if (completionType === 'manual') {
    const { data, error } = await client.functions.invoke('stints-stop', {
      body: { stintId, notes: notes || null },
    });

    if (error) {
      // Map Edge Function errors to user-friendly messages
      const errorMessage = error.message || 'Failed to complete stint';
      return { data: null, error: new Error(errorMessage) };
    }

    if (!data) {
      return { data: null, error: new Error('No data returned from complete stint') };
    }

    if (!isValidStintRow(data)) {
      return { data: null, error: new Error('Invalid stint data returned from complete operation') };
    }

    return { data, error: null };
  }

  // For auto/interrupted completion, use RPC directly
  // (Edge Function stints-stop only handles manual completion)
  const { data, error } = await client
    .rpc('complete_stint', {
      p_stint_id: stintId,
      p_completion_type: completionType,
      p_notes: notes ?? undefined,
    })
    .single<StintRow>();

  if (error) {
    // Map database errors to user-friendly messages
    if (error.message?.includes('not active')) {
      return { data: null, error: new Error('Stint is not active and cannot be completed') };
    }
    if (error.message?.includes('not found')) {
      return { data: null, error: new Error('Stint not found') };
    }
    return { data: null, error };
  }

  if (!data || !isValidStintRow(data)) {
    return { data: null, error: new Error('Invalid stint data returned from complete operation') };
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
  if (userResult.error) return { data: null, error: userResult.error };

  // Call the stints-start Edge Function
  const { data, error } = await client.functions.invoke('stints-start', {
    body: {
      projectId,
      plannedDurationMinutes,
      notes: notes || null,
    },
  });

  if (error) {
    const parsedError = parseEdgeFunctionError(error);

    if (parsedError.status === 409 || parsedError.errorCode === 'CONFLICT') {
      const rawExistingStint = parsedError.metadata?.existingStint;
      const existingStint = rawExistingStint && isValidStintRow(rawExistingStint)
        ? rawExistingStint
        : null;

      return {
        error: {
          code: 'CONFLICT',
          existingStint,
          message: parsedError.message || 'An active stint already exists',
        },
        data: null,
      };
    }

    return { data: null, error: new Error(parsedError.message) };
  }

  if (!data) {
    return { data: null, error: new Error('No data returned from start stint') };
  }

  if (!isValidStintRow(data)) {
    return { data: null, error: new Error('Invalid stint data returned from start operation') };
  }

  return { data, error: null };
}
