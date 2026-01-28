import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import type { UseQueryReturnType, UseMutationReturnType } from '@tanstack/vue-query';
import { useTypedSupabaseClient } from '~/utils/supabase';
import { createLogger } from '~/utils/logger';
import {
  listStints,
  getStintById,
  getActiveStint,
  getPausedStints,
  updateStint as updateStintDb,
  deleteStint as deleteStintDb,
  pauseStint as pauseStintDb,
  resumeStint as resumeStintDb,
  completeStint as completeStintDb,
  startStint as startStintDb,
  syncStintCheck as syncStintCheckDb,
  type StintRow,
  type UpdateStintPayload as DbUpdateStintPayload,
} from '~/lib/supabase/stints';
import {
  stintStartSchema,
  stintUpdateSchema,
  stintCompletionSchema,
  stintPauseSchema,
  stintResumeSchema,
  stintInterruptSchema,
  type StintStartPayload,
  type StintUpdatePayload,
  type StintCompletionPayload,
  type StintInterruptPayload,
  type SyncCheckOutput,
} from '~/schemas/stints';
import { streakKeys, getBrowserTimezone } from '~/composables/useStreaks';
import { updateStreakAfterCompletion } from '~/lib/supabase/streaks';
import { useCelebration } from '~/composables/useCelebration';

const log = createLogger('stints');

// ============================================================================
// Query Key Factory
// ============================================================================

export const stintKeys = {
  all: ['stints'] as const,
  lists: () => [...stintKeys.all, 'list'] as const,
  list: (filters?: StintListFilters) => [...stintKeys.lists(), filters] as const,
  details: () => [...stintKeys.all, 'detail'] as const,
  detail: (id: string) => [...stintKeys.details(), id] as const,
  active: () => [...stintKeys.all, 'active'] as const,
  paused: () => [...stintKeys.all, 'paused'] as const,
};

export interface StintListFilters {
  projectId?: string
  activeOnly?: boolean
}

// ============================================================================
// TypeScript Type Exports
// ============================================================================

export type StintsQueryResult = UseQueryReturnType<StintRow[], Error>;
export type StintQueryResult = UseQueryReturnType<StintRow | null, Error>;
export type ActiveStintQueryResult = UseQueryReturnType<StintRow | null, Error>;
export type PausedStintsQueryResult = UseQueryReturnType<StintRow[], Error>;

export type CreateStintMutation = UseMutationReturnType<
  StintRow,
  Error,
  StintStartPayload,
  unknown
>;

export type UpdateStintMutation = UseMutationReturnType<
  StintRow,
  Error,
  { id: string, data: StintUpdatePayload },
  unknown
>;

export type CompleteStintMutation = UseMutationReturnType<
  StintRow,
  Error,
  StintCompletionPayload,
  unknown
>;

export type DeleteStintMutation = UseMutationReturnType<
  void,
  Error,
  string,
  unknown
>;

export type PauseStintMutation = UseMutationReturnType<
  StintRow,
  Error,
  string,
  unknown
>;

export type ResumeStintMutation = UseMutationReturnType<
  StintRow,
  Error,
  string,
  unknown
>;

export type StartStintMutation = UseMutationReturnType<
  StintRow,
  Error,
  StintStartPayload,
  unknown
>;

export type InterruptStintMutation = UseMutationReturnType<
  StintRow,
  Error,
  StintInterruptPayload,
  unknown
>;

export type SyncStintCheckMutation = UseMutationReturnType<
  SyncCheckOutput,
  Error,
  string,
  unknown
>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Transforms camelCase update payload to snake_case for database operations
 */
function toDbUpdatePayload(payload: StintUpdatePayload): DbUpdateStintPayload {
  const result: Record<string, unknown> = {};

  if (payload.notes !== undefined) {
    result.notes = payload.notes;
  }

  return result as DbUpdateStintPayload;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetches stints with optional filtering and automatic caching.
 *
 * @example
 * ```ts
 * const { data: stints, isLoading, error, refetch } = useStintsQuery()
 * const { data: projectStints } = useStintsQuery({ projectId: '123' })
 * const { data: activeStints } = useStintsQuery({ activeOnly: true })
 * ```
 */
export function useStintsQuery(filters?: StintListFilters) {
  const client = useTypedSupabaseClient();

  return useQuery({
    queryKey: stintKeys.list(filters),
    queryFn: async () => {
      const { data, error } = await listStints(client, filters);
      if (error) throw error;
      return data || [];
    },
  });
}

/**
 * Fetches a single stint by ID with automatic caching.
 *
 * @example
 * ```ts
 * const { data: stint, isLoading, error } = useStintQuery(stintId)
 * ```
 */
export function useStintQuery(id: MaybeRefOrGetter<string>) {
  const client = useTypedSupabaseClient();
  const stintId = toValue(id);

  return useQuery({
    queryKey: stintKeys.detail(stintId),
    queryFn: async () => {
      const { data, error } = await getStintById(client, stintId);
      if (error) throw error;
      return data;
    },
    enabled: !!stintId,
  });
}

/**
 * Fetches the currently active stint with automatic caching.
 *
 * @example
 * ```ts
 * const { data: activeStint, isLoading, error } = useActiveStintQuery()
 * ```
 */
export function useActiveStintQuery() {
  const client = useTypedSupabaseClient();

  return useQuery({
    queryKey: stintKeys.active(),
    queryFn: async () => {
      const { data, error } = await getActiveStint(client);
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Fetches all paused stints for the current user with automatic caching.
 *
 * With unlimited paused stints (Issue #46), users can have multiple paused stints
 * alongside their active stint. Returns an array ordered by most recently paused first.
 *
 * @example
 * ```ts
 * const { data: pausedStints, isLoading, error } = usePausedStintsQuery()
 * ```
 */
export function usePausedStintsQuery() {
  const client = useTypedSupabaseClient();

  return useQuery({
    queryKey: stintKeys.paused(),
    queryFn: async () => {
      const { data, error } = await getPausedStints(client);
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Returns a Map<projectId, StintRow> for efficient lookup of paused stints per project.
 * Useful for ProjectList to pass the correct paused stint to each ProjectListCard.
 * If multiple paused stints exist for the same project, returns the most recent one.
 *
 * Also exposes error and isLoading states from the underlying query to prevent
 * silent failures - consumers can display appropriate UI when data fetch fails.
 *
 * @example
 * ```ts
 * const { map: pausedStintsMap, error, isLoading } = usePausedStintsMap()
 * const pausedStintForProject = pausedStintsMap.value.get(projectId)
 * if (error.value) { // handle error }
 * ```
 */
export function usePausedStintsMap() {
  const { data: pausedStints, error, isLoading } = usePausedStintsQuery();

  const map = computed(() => {
    const result = new Map<string, StintRow>();
    if (pausedStints.value) {
      for (const stint of pausedStints.value) {
        const existing = result.get(stint.project_id);
        if (!existing || (stint.paused_at && existing.paused_at && stint.paused_at > existing.paused_at)) {
          result.set(stint.project_id, stint);
        }
      }
    }
    return result;
  });

  return { map, error, isLoading };
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Updates an existing stint with Zod validation and optimistic updates.
 * Auto-invalidates affected queries on success.
 *
 * @example
 * ```ts
 * const { mutateAsync } = useUpdateStint()
 * await mutateAsync({ id: stintId, data: { notes: 'Updated notes' } })
 * ```
 */
export function useUpdateStint() {
  const client = useTypedSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: StintUpdatePayload }) => {
      // Validate input
      const validation = stintUpdateSchema.safeParse(data);
      if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || 'Validation failed');
      }

      // Call database
      const dbPayload = toDbUpdatePayload(validation.data);
      const { data: result, error } = await updateStintDb(client, id, dbPayload);

      if (error || !result) {
        throw error || new Error('Failed to update stint');
      }

      return result;
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: stintKeys.lists() });
      await queryClient.cancelQueries({ queryKey: stintKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: stintKeys.active() });
      await queryClient.cancelQueries({ queryKey: stintKeys.paused() });

      // Snapshot previous values
      const previousStints = queryClient.getQueryData<StintRow[]>(stintKeys.list(undefined));
      const previousStint = queryClient.getQueryData<StintRow>(stintKeys.detail(id));
      const previousActiveStint = queryClient.getQueryData<StintRow | null>(stintKeys.active());
      const previousPausedStints = queryClient.getQueryData<StintRow[]>(stintKeys.paused()) || [];

      // Optimistically update list
      if (previousStints) {
        queryClient.setQueryData<StintRow[]>(
          stintKeys.list(undefined),
          previousStints.map(s =>
            s.id === id
              ? {
                  ...s,
                  notes: data.notes !== undefined ? data.notes : s.notes,
                  updated_at: new Date().toISOString(),
                }
              : s,
          ),
        );
      }

      // Optimistically update detail
      if (previousStint) {
        queryClient.setQueryData<StintRow>(stintKeys.detail(id), {
          ...previousStint,
          notes: data.notes !== undefined ? data.notes : previousStint.notes,
          updated_at: new Date().toISOString(),
        });
      }

      // Optimistically update active stint if it matches
      if (previousActiveStint && previousActiveStint.id === id) {
        queryClient.setQueryData<StintRow | null>(stintKeys.active(), {
          ...previousActiveStint,
          notes: data.notes !== undefined ? data.notes : previousActiveStint.notes,
          updated_at: new Date().toISOString(),
        });
      }

      // Optimistically update paused stints array if it contains this stint
      if (previousPausedStints.some(s => s.id === id)) {
        queryClient.setQueryData<StintRow[]>(
          stintKeys.paused(),
          previousPausedStints.map(s =>
            s.id === id
              ? {
                  ...s,
                  notes: data.notes !== undefined ? data.notes : s.notes,
                  updated_at: new Date().toISOString(),
                }
              : s,
          ),
        );
      }

      return { previousStints, previousStint, previousActiveStint, previousPausedStints };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousStints) {
        queryClient.setQueryData(stintKeys.list(undefined), context.previousStints);
      }
      if (context?.previousStint) {
        queryClient.setQueryData(stintKeys.detail(id), context.previousStint);
      }
      if (context?.previousActiveStint !== undefined) {
        queryClient.setQueryData(stintKeys.active(), context.previousActiveStint);
      }
      if (context?.previousPausedStints) {
        queryClient.setQueryData(stintKeys.paused(), context.previousPausedStints);
      }
    },
    onSuccess: (_data, { id }) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: stintKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stintKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: stintKeys.active() });
      queryClient.invalidateQueries({ queryKey: stintKeys.paused() });
    },
  });
}

/**
 * Completes an active stint with validation and optimistic updates.
 * Auto-invalidates stint queries on success.
 *
 * @example
 * ```ts
 * const { mutateAsync } = useCompleteStint()
 * await mutateAsync({ stintId: '123', durationMinutes: 25, completed: true })
 * ```
 */
export function useCompleteStint() {
  const client = useTypedSupabaseClient();
  const queryClient = useQueryClient();
  const { checkAndCelebrate } = useCelebration();

  return useMutation({
    mutationFn: async (payload: StintCompletionPayload) => {
      // Validate input
      const validation = stintCompletionSchema.safeParse(payload);
      if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || 'Validation failed');
      }

      // Call database with completeStint RPC function
      const { data, error } = await completeStintDb(
        client,
        payload.stintId,
        payload.completionType,
        payload.notes,
      );

      if (error || !data) {
        throw error || new Error('Failed to complete stint');
      }

      return data;
    },
    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: stintKeys.lists() });
      await queryClient.cancelQueries({ queryKey: stintKeys.detail(payload.stintId) });
      await queryClient.cancelQueries({ queryKey: stintKeys.active() });
      await queryClient.cancelQueries({ queryKey: stintKeys.paused() });

      // Snapshot previous values
      const previousStints = queryClient.getQueryData<StintRow[]>(stintKeys.list(undefined));
      const previousStint = queryClient.getQueryData<StintRow>(stintKeys.detail(payload.stintId));
      const previousActiveStint = queryClient.getQueryData<StintRow | null>(stintKeys.active());
      const previousPausedStints = queryClient.getQueryData<StintRow[]>(stintKeys.paused()) || [];

      // Optimistically update list
      if (previousStints) {
        queryClient.setQueryData<StintRow[]>(
          stintKeys.list(undefined),
          previousStints.map(s =>
            s.id === payload.stintId
              ? {
                  ...s,
                  status: 'completed' as const,
                  completion_type: payload.completionType,
                  ended_at: new Date().toISOString(),
                  notes: payload.notes !== undefined ? payload.notes : s.notes,
                  updated_at: new Date().toISOString(),
                }
              : s,
          ),
        );
      }

      // Optimistically update detail
      if (previousStint) {
        queryClient.setQueryData<StintRow>(stintKeys.detail(payload.stintId), {
          ...previousStint,
          status: 'completed' as const,
          completion_type: payload.completionType,
          ended_at: new Date().toISOString(),
          notes: payload.notes !== undefined ? payload.notes : previousStint.notes,
          updated_at: new Date().toISOString(),
        });
      }

      // Clear active stint (since it's being completed)
      if (previousActiveStint && previousActiveStint.id === payload.stintId) {
        queryClient.setQueryData<StintRow | null>(stintKeys.active(), null);
      }

      // Remove from paused stints array if completing a paused stint
      if (previousPausedStints.some(s => s.id === payload.stintId)) {
        queryClient.setQueryData<StintRow[]>(
          stintKeys.paused(),
          previousPausedStints.filter(s => s.id !== payload.stintId),
        );
      }

      return { previousStints, previousStint, previousActiveStint, previousPausedStints };
    },
    onError: (_err, payload, context) => {
      // Rollback on error
      if (context?.previousStints) {
        queryClient.setQueryData(stintKeys.list(undefined), context.previousStints);
      }
      if (context?.previousStint) {
        queryClient.setQueryData(stintKeys.detail(payload.stintId), context.previousStint);
      }
      if (context?.previousActiveStint !== undefined) {
        queryClient.setQueryData(stintKeys.active(), context.previousActiveStint);
      }
      if (context?.previousPausedStints) {
        queryClient.setQueryData(stintKeys.paused(), context.previousPausedStints);
      }
    },
    onSuccess: async (_data, payload) => {
      // Invalidate and refetch stint queries
      queryClient.invalidateQueries({ queryKey: stintKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stintKeys.detail(payload.stintId) });
      queryClient.invalidateQueries({ queryKey: stintKeys.active() });
      queryClient.invalidateQueries({ queryKey: stintKeys.paused() });

      // Update the user_streaks materialized cache table (fire-and-forget)
      // This keeps the cache in sync for faster reads; errors don't block UI
      // as calculate_streak_with_tz RPC still works without it
      const timezone = getBrowserTimezone();
      updateStreakAfterCompletion(client, timezone).catch((err) => {
        log.error('Failed to update streak cache. Streak display may be stale.', {
          error: err instanceof Error ? err.message : String(err),
          timezone,
          stintId: payload.stintId,
        });
      });

      // Invalidate streak cache to trigger refetch and update UI
      queryClient.invalidateQueries({ queryKey: streakKeys.all });

      // Check if daily goal was achieved and celebrate
      checkAndCelebrate();
    },
  });
}

/**
 * Deletes a stint with optimistic updates.
 * Auto-invalidates stint queries on success.
 *
 * @example
 * ```ts
 * const { mutateAsync } = useDeleteStint()
 * await mutateAsync(stintId)
 * ```
 */
export function useDeleteStint() {
  const client = useTypedSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteStintDb(client, id);

      if (error) {
        throw error;
      }
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: stintKeys.lists() });
      await queryClient.cancelQueries({ queryKey: stintKeys.active() });
      await queryClient.cancelQueries({ queryKey: stintKeys.paused() });

      // Snapshot previous values
      const previousStints = queryClient.getQueryData<StintRow[]>(stintKeys.list(undefined));
      const previousActiveStint = queryClient.getQueryData<StintRow | null>(stintKeys.active());
      const previousPausedStints = queryClient.getQueryData<StintRow[]>(stintKeys.paused()) || [];

      // Optimistically remove from list
      if (previousStints) {
        queryClient.setQueryData<StintRow[]>(
          stintKeys.list(undefined),
          previousStints.filter(s => s.id !== id),
        );
      }

      // Clear active stint if it matches the deleted stint
      if (previousActiveStint && previousActiveStint.id === id) {
        queryClient.setQueryData<StintRow | null>(stintKeys.active(), null);
      }

      // Remove from paused stints array if it matches the deleted stint
      if (previousPausedStints.some(s => s.id === id)) {
        queryClient.setQueryData<StintRow[]>(
          stintKeys.paused(),
          previousPausedStints.filter(s => s.id !== id),
        );
      }

      return { previousStints, previousActiveStint, previousPausedStints };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousStints) {
        queryClient.setQueryData(stintKeys.list(undefined), context.previousStints);
      }
      if (context?.previousActiveStint !== undefined) {
        queryClient.setQueryData(stintKeys.active(), context.previousActiveStint);
      }
      if (context?.previousPausedStints) {
        queryClient.setQueryData(stintKeys.paused(), context.previousPausedStints);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: stintKeys.all });
    },
  });
}

/**
 * Pauses an active stint with Zod validation and optimistic updates.
 * Auto-invalidates stint queries on success.
 *
 * @example
 * ```ts
 * const { mutateAsync, isPending } = usePauseStint()
 * await mutateAsync(stintId)
 * ```
 */
export function usePauseStint() {
  const client = useTypedSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stintId: string) => {
      // Validate input
      const validation = stintPauseSchema.safeParse({ stintId });
      if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || 'Validation failed');
      }

      // Call database
      const { data, error } = await pauseStintDb(client, stintId);

      if (error || !data) {
        throw error || new Error('Failed to pause stint');
      }

      return data;
    },
    onMutate: async (stintId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: stintKeys.lists() });
      await queryClient.cancelQueries({ queryKey: stintKeys.detail(stintId) });
      await queryClient.cancelQueries({ queryKey: stintKeys.active() });
      await queryClient.cancelQueries({ queryKey: stintKeys.paused() });

      // Snapshot previous values
      const previousStints = queryClient.getQueryData<StintRow[]>(stintKeys.list(undefined));
      const previousStint = queryClient.getQueryData<StintRow>(stintKeys.detail(stintId));
      const previousActiveStint = queryClient.getQueryData<StintRow | null>(stintKeys.active());
      const previousPausedStints = queryClient.getQueryData<StintRow[]>(stintKeys.paused()) || [];

      // Optimistically update list
      if (previousStints) {
        queryClient.setQueryData<StintRow[]>(
          stintKeys.list(undefined),
          previousStints.map(s =>
            s.id === stintId
              ? {
                  ...s,
                  status: 'paused' as const,
                  paused_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }
              : s,
          ),
        );
      }

      // Optimistically update detail
      if (previousStint) {
        queryClient.setQueryData<StintRow>(stintKeys.detail(stintId), {
          ...previousStint,
          status: 'paused' as const,
          paused_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // Clear active stint and add to paused stints array
      if (previousActiveStint && previousActiveStint.id === stintId) {
        queryClient.setQueryData<StintRow | null>(stintKeys.active(), null);
        const newPausedStint: StintRow = {
          ...previousActiveStint,
          status: 'paused' as const,
          paused_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        queryClient.setQueryData<StintRow[]>(
          stintKeys.paused(),
          [newPausedStint, ...previousPausedStints],
        );
      }

      return { previousStints, previousStint, previousActiveStint, previousPausedStints };
    },
    onError: (_err, stintId, context) => {
      // Rollback on error
      if (context?.previousStints) {
        queryClient.setQueryData(stintKeys.list(undefined), context.previousStints);
      }
      if (context?.previousStint) {
        queryClient.setQueryData(stintKeys.detail(stintId), context.previousStint);
      }
      if (context?.previousActiveStint !== undefined) {
        queryClient.setQueryData(stintKeys.active(), context.previousActiveStint);
      }
      if (context?.previousPausedStints) {
        queryClient.setQueryData(stintKeys.paused(), context.previousPausedStints);
      }
    },
    onSuccess: (_data, stintId) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: stintKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stintKeys.detail(stintId) });
      queryClient.invalidateQueries({ queryKey: stintKeys.active() });
      queryClient.invalidateQueries({ queryKey: stintKeys.paused() });
    },
  });
}

/**
 * Resumes a paused stint with Zod validation.
 * No optimistic update - waits for DB response to get accurate paused_duration.
 * Auto-invalidates stint queries on success.
 *
 * @example
 * ```ts
 * const { mutateAsync, isPending } = useResumeStint()
 * await mutateAsync(stintId)
 * ```
 */
export function useResumeStint() {
  const client = useTypedSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stintId: string) => {
      // Validate input
      const validation = stintResumeSchema.safeParse({ stintId });
      if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || 'Validation failed');
      }

      // Call database
      const { data, error } = await resumeStintDb(client, stintId);

      if (error || !data) {
        throw error || new Error('Failed to resume stint');
      }

      return data;
    },
    onSuccess: (_data, stintId) => {
      // Invalidate and refetch to get accurate paused_duration from DB
      queryClient.invalidateQueries({ queryKey: stintKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stintKeys.detail(stintId) });
      queryClient.invalidateQueries({ queryKey: stintKeys.active() });
      queryClient.invalidateQueries({ queryKey: stintKeys.paused() });
    },
  });
}

/**
 * Starts a new stint with validation, conflict detection, and optimistic updates.
 * Handles conflicts when another stint is already active.
 * Auto-invalidates stint queries on success.
 *
 * @example
 * ```ts
 * const { mutateAsync, isPending, error } = useStartStint()
 * try {
 *   await mutateAsync({ projectId: '123', plannedDurationMinutes: 50, notes: 'Starting work' })
 * } catch (err) {
 *   // Handle conflict or other errors
 *   if (err.message.includes('already active')) {
 *     // Show conflict resolution modal
 *   }
 * }
 * ```
 */
export function useStartStint() {
  const client = useTypedSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: StintStartPayload) => {
      // Validate input
      const validation = stintStartSchema.safeParse(payload);
      if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || 'Validation failed');
      }

      // Call database start function (handles validation and conflicts via RPC)
      const result = await startStintDb(
        client,
        payload.projectId,
        payload.plannedDurationMinutes,
        payload.notes,
      );

      // Check for conflict
      if (result.error && 'code' in result.error && result.error.code === 'CONFLICT') {
        // Throw error with conflict details for UI to handle
        const error = new Error('Another stint is already active') as Error & { conflict: StintRow | null };
        error.conflict = result.error.existingStint;
        throw error;
      }

      const { data, error } = result;
      if (error || !data) {
        throw error || new Error('Failed to start stint');
      }

      return data;
    },
    onMutate: async (payload) => {
      // Cancel outgoing refetches for all list queries
      await queryClient.cancelQueries({ queryKey: stintKeys.lists() });
      await queryClient.cancelQueries({ queryKey: stintKeys.active() });

      // Snapshot previous value (use list with undefined filters to match default query)
      const previousStints = queryClient.getQueryData<StintRow[]>(stintKeys.list(undefined));
      const previousActiveStint = queryClient.getQueryData<StintRow | null>(stintKeys.active());

      // Optimistically update to the new value
      if (previousStints) {
        const optimisticStint: StintRow = {
          id: crypto.randomUUID(),
          project_id: payload.projectId,
          user_id: '',
          started_at: new Date().toISOString(),
          ended_at: null,
          actual_duration: null,
          completion_type: null,
          planned_duration: payload.plannedDurationMinutes || 50,
          status: 'active' as const,
          paused_at: null,
          paused_duration: 0,
          notes: payload.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        queryClient.setQueryData<StintRow[]>(
          stintKeys.list(undefined),
          [optimisticStint, ...previousStints],
        );

        // Set as active stint
        queryClient.setQueryData<StintRow | null>(stintKeys.active(), optimisticStint);
      }

      return { previousStints, previousActiveStint };
    },
    onError: (_err, _payload, context) => {
      // Rollback to previous value on error (including conflicts)
      if (context?.previousStints) {
        queryClient.setQueryData(stintKeys.list(undefined), context.previousStints);
      }
      if (context?.previousActiveStint !== undefined) {
        queryClient.setQueryData(stintKeys.active(), context.previousActiveStint);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: stintKeys.all });
    },
  });
}

/**
 * Interrupts an active stint with validation and optimistic updates.
 * Marks the stint as interrupted with an optional reason.
 * Auto-invalidates stint queries on success.
 *
 * @example
 * ```ts
 * const { mutateAsync, isPending } = useInterruptStint()
 * await mutateAsync({ stintId: '123', reason: 'Unexpected meeting' })
 * ```
 */
export function useInterruptStint() {
  const client = useTypedSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: StintInterruptPayload) => {
      // Validate input
      const validation = stintInterruptSchema.safeParse(payload);
      if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || 'Validation failed');
      }

      // Call database with completeStint using 'interrupted' type
      const { data, error } = await completeStintDb(
        client,
        payload.stintId,
        'interrupted',
        payload.reason,
      );

      if (error || !data) {
        throw error || new Error('Failed to interrupt stint');
      }

      return data;
    },
    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: stintKeys.lists() });
      await queryClient.cancelQueries({ queryKey: stintKeys.detail(payload.stintId) });
      await queryClient.cancelQueries({ queryKey: stintKeys.active() });
      await queryClient.cancelQueries({ queryKey: stintKeys.paused() });

      // Snapshot previous values
      const previousStints = queryClient.getQueryData<StintRow[]>(stintKeys.list(undefined));
      const previousStint = queryClient.getQueryData<StintRow>(stintKeys.detail(payload.stintId));
      const previousActiveStint = queryClient.getQueryData<StintRow | null>(stintKeys.active());
      const previousPausedStints = queryClient.getQueryData<StintRow[]>(stintKeys.paused()) || [];

      // Optimistically update list
      if (previousStints) {
        queryClient.setQueryData<StintRow[]>(
          stintKeys.list(undefined),
          previousStints.map(s =>
            s.id === payload.stintId
              ? {
                  ...s,
                  status: 'completed' as const,
                  completion_type: 'interrupted' as const,
                  ended_at: new Date().toISOString(),
                  notes: payload.reason || s.notes,
                  updated_at: new Date().toISOString(),
                }
              : s,
          ),
        );
      }

      // Optimistically update detail
      if (previousStint) {
        queryClient.setQueryData<StintRow>(stintKeys.detail(payload.stintId), {
          ...previousStint,
          status: 'completed' as const,
          completion_type: 'interrupted' as const,
          ended_at: new Date().toISOString(),
          notes: payload.reason || previousStint.notes,
          updated_at: new Date().toISOString(),
        });
      }

      // Clear active stint (since it's being interrupted)
      if (previousActiveStint && previousActiveStint.id === payload.stintId) {
        queryClient.setQueryData<StintRow | null>(stintKeys.active(), null);
      }

      // Remove from paused stints array if interrupting a paused stint
      if (previousPausedStints.some(s => s.id === payload.stintId)) {
        queryClient.setQueryData<StintRow[]>(
          stintKeys.paused(),
          previousPausedStints.filter(s => s.id !== payload.stintId),
        );
      }

      return { previousStints, previousStint, previousActiveStint, previousPausedStints };
    },
    onError: (_err, payload, context) => {
      // Rollback on error
      if (context?.previousStints) {
        queryClient.setQueryData(stintKeys.list(undefined), context.previousStints);
      }
      if (context?.previousStint) {
        queryClient.setQueryData(stintKeys.detail(payload.stintId), context.previousStint);
      }
      if (context?.previousActiveStint !== undefined) {
        queryClient.setQueryData(stintKeys.active(), context.previousActiveStint);
      }
      if (context?.previousPausedStints) {
        queryClient.setQueryData(stintKeys.paused(), context.previousPausedStints);
      }
    },
    onSuccess: (_data, payload) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: stintKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stintKeys.detail(payload.stintId) });
      queryClient.invalidateQueries({ queryKey: stintKeys.active() });
      queryClient.invalidateQueries({ queryKey: stintKeys.paused() });

      // Note: No streak cache update here - interrupted stints don't count toward streaks
      // per spec: "Only completed stints count toward streaks; interrupted stints do not"
    },
  });
}

const lastSyncTimes = new Map<string, number>();
const SYNC_DEBOUNCE_MS = 60 * 1000;
const MAX_SYNC_CACHE_ENTRIES = 100;

// Cleanup old entries to prevent unbounded memory growth
function cleanupOldSyncTimes(): void {
  if (lastSyncTimes.size > MAX_SYNC_CACHE_ENTRIES) {
    // Remove entries older than 24 hours
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const entriesToDelete: string[] = [];

    for (const [stintId, timestamp] of lastSyncTimes.entries()) {
      if (now - timestamp > oneDayMs) {
        entriesToDelete.push(stintId);
      }
    }

    // If still too many entries after removing old ones, remove oldest entries
    if (lastSyncTimes.size - entriesToDelete.length > MAX_SYNC_CACHE_ENTRIES) {
      const sortedEntries = Array.from(lastSyncTimes.entries())
        .sort((a, b) => a[1] - b[1]);
      const numToRemove = lastSyncTimes.size - MAX_SYNC_CACHE_ENTRIES;
      for (let i = 0; i < numToRemove; i++) {
        const entry = sortedEntries[i];
        if (entry) {
          entriesToDelete.push(entry[0]);
        }
      }
    }

    entriesToDelete.forEach(id => lastSyncTimes.delete(id));
  }
}

export function useSyncStintCheck() {
  const client = useTypedSupabaseClient();

  return useMutation({
    mutationFn: async (stintId: string) => {
      const validation = stintPauseSchema.safeParse({ stintId });
      if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || 'Validation failed');
      }

      const now = Date.now();
      const lastSync = lastSyncTimes.get(stintId);

      if (lastSync && now - lastSync < SYNC_DEBOUNCE_MS) {
        const remainingMs = SYNC_DEBOUNCE_MS - (now - lastSync);
        const remainingSec = Math.ceil(remainingMs / 1000);
        throw new Error(`Please wait ${remainingSec} seconds before syncing again`);
      }

      const { data, error } = await syncStintCheckDb(client, stintId);

      if (error || !data) {
        throw error || new Error('Failed to sync stint');
      }

      lastSyncTimes.set(stintId, now);
      cleanupOldSyncTimes();

      return data;
    },
  });
}
