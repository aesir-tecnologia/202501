import type { TypedSupabaseClient } from '~/utils/supabase'
import {
  startStint as startStintDb,
  stopStint as stopStintDb,
  pauseStint as pauseStintDb,
  resumeStint as resumeStintDb,
  type StintRow,
} from '~/lib/supabase/stints'
import {
  stintStartSchema,
  stintCompletionSchema,
  type StintStartPayload,
} from '~/schemas/stints'
import type { OptimisticResult } from '~/types/optimistic'

/**
 * Composable providing optimistic mutation helpers for stint lifecycle operations.
 *
 * All mutations immediately update local state and roll back on failure.
 * Enforces single-active stint constraint via Supabase RPC functions.
 *
 * Usage:
 * ```ts
 * const { startStint, stopStint, pauseStint, resumeStint } = useStintLifecycle()
 * const result = await startStint({ projectId: '...' })
 * ```
 */
export function useStintLifecycle(
  clientOverride?: TypedSupabaseClient,
  stintsStateOverride?: Ref<StintRow[]>,
  activeStintStateOverride?: Ref<StintRow | null>,
) {
  const client: TypedSupabaseClient = clientOverride ?? (useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient)
  const stints = stintsStateOverride ?? useState<StintRow[]>('stints', () => [])
  const activeStint = activeStintStateOverride ?? useState<StintRow | null>('activeStint', () => null)

  /**
   * Starts a new stint with optimistic UI update.
   * Automatically stops any existing active stint.
   */
  async function startStint(
    payload: StintStartPayload,
  ): Promise<OptimisticResult<StintRow>> {
    // Validate input
    const validation = stintStartSchema.safeParse(payload)
    if (!validation.success) {
      return {
        data: null,
        error: new Error(validation.error.errors[0]?.message || 'Validation failed'),
      }
    }

    // Store current active stint for rollback
    const previousActiveStint = activeStint.value

    // Create optimistic stint
    const optimisticStint: StintRow = {
      id: crypto.randomUUID(),
      project_id: validation.data.projectId,
      user_id: '', // Will be set by server
      started_at: (validation.data.startedAt ?? new Date()).toISOString(),
      ended_at: null,
      duration_minutes: null,
      notes: validation.data.notes ?? null,
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Optimistically update state
    activeStint.value = optimisticStint
    stints.value = [optimisticStint, ...stints.value]

    try {
      // Call database
      const { data, error } = await startStintDb(client, validation.data.projectId, {
        notes: validation.data.notes,
        startedAt: validation.data.startedAt,
      })

      if (error || !data) {
        // Roll back optimistic update
        activeStint.value = previousActiveStint
        stints.value = stints.value.filter(s => s.id !== optimisticStint.id)
        return { data: null, error: error || new Error('Failed to start stint') }
      }

      // Replace optimistic stint with real data
      activeStint.value = data
      stints.value = stints.value.map(s =>
        s.id === optimisticStint.id ? data : s,
      )

      return { data, error: null }
    }
    catch (err) {
      // Roll back optimistic update
      activeStint.value = previousActiveStint
      stints.value = stints.value.filter(s => s.id !== optimisticStint.id)
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Unknown error'),
      }
    }
  }

  /**
   * Stops an active stint with optimistic UI update.
   * Marks stint as completed.
   */
  async function stopStint(
    stintId: string,
    options?: {
      endedAt?: Date
      durationMinutes?: number
      notes?: string
    },
  ): Promise<OptimisticResult<StintRow>> {
    // Validate duration if provided
    if (options?.durationMinutes !== undefined) {
      const validation = stintCompletionSchema.safeParse({
        stintId,
        durationMinutes: options.durationMinutes,
        notes: options.notes,
      })
      if (!validation.success) {
        return {
          data: null,
          error: new Error(validation.error.errors[0]?.message || 'Validation failed'),
        }
      }
    }

    // Find existing stint
    const existingStint = stints.value.find(s => s.id === stintId)
    if (!existingStint) {
      return { data: null, error: new Error('Stint not found') }
    }

    // Calculate duration if not provided
    const endedAt = options?.endedAt ?? new Date()
    const startedAt = new Date(existingStint.started_at!)
    const calculatedDuration = Math.floor((endedAt.getTime() - startedAt.getTime()) / 60000)

    // Create optimistic update
    const optimisticStint: StintRow = {
      ...existingStint,
      ended_at: endedAt.toISOString(),
      duration_minutes: options?.durationMinutes ?? calculatedDuration,
      notes: options?.notes ?? existingStint.notes,
      is_completed: true,
      updated_at: new Date().toISOString(),
    }

    // Store original for rollback
    const original = existingStint

    // Optimistically update local state
    stints.value = stints.value.map(s => (s.id === stintId ? optimisticStint : s))
    if (activeStint.value?.id === stintId) {
      activeStint.value = null
    }

    try {
      // Call database
      const { data, error } = await stopStintDb(client, stintId, {
        endedAt: options?.endedAt,
        notes: options?.notes,
      })

      if (error || !data) {
        // Roll back optimistic update
        stints.value = stints.value.map(s => (s.id === stintId ? original : s))
        if (original.is_completed === false && original.ended_at === null) {
          activeStint.value = original
        }
        return { data: null, error: error || new Error('Failed to stop stint') }
      }

      // Replace optimistic stint with real data
      stints.value = stints.value.map(s => (s.id === stintId ? data : s))

      return { data, error: null }
    }
    catch (err) {
      // Roll back optimistic update
      stints.value = stints.value.map(s => (s.id === stintId ? original : s))
      if (original.is_completed === false && original.ended_at === null) {
        activeStint.value = original
      }
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Unknown error'),
      }
    }
  }

  /**
   * Pauses an active stint with optimistic UI update.
   * Sets ended_at but keeps is_completed false.
   */
  async function pauseStint(
    stintId: string,
    options?: {
      pausedAt?: Date
      notes?: string
    },
  ): Promise<OptimisticResult<StintRow>> {
    // Find existing stint
    const existingStint = stints.value.find(s => s.id === stintId)
    if (!existingStint) {
      return { data: null, error: new Error('Stint not found') }
    }

    // Calculate duration
    const pausedAt = options?.pausedAt ?? new Date()
    const startedAt = new Date(existingStint.started_at!)
    const calculatedDuration = Math.floor((pausedAt.getTime() - startedAt.getTime()) / 60000)

    // Create optimistic update
    const optimisticStint: StintRow = {
      ...existingStint,
      ended_at: pausedAt.toISOString(),
      duration_minutes: calculatedDuration,
      notes: options?.notes ?? existingStint.notes,
      updated_at: new Date().toISOString(),
    }

    // Store original for rollback
    const original = existingStint

    // Optimistically update local state
    stints.value = stints.value.map(s => (s.id === stintId ? optimisticStint : s))
    if (activeStint.value?.id === stintId) {
      activeStint.value = null
    }

    try {
      // Call database
      const { data, error } = await pauseStintDb(client, stintId, {
        pausedAt: options?.pausedAt,
        notes: options?.notes,
      })

      if (error || !data) {
        // Roll back optimistic update
        stints.value = stints.value.map(s => (s.id === stintId ? original : s))
        if (original.ended_at === null) {
          activeStint.value = original
        }
        return { data: null, error: error || new Error('Failed to pause stint') }
      }

      // Replace optimistic stint with real data
      stints.value = stints.value.map(s => (s.id === stintId ? data : s))

      return { data, error: null }
    }
    catch (err) {
      // Roll back optimistic update
      stints.value = stints.value.map(s => (s.id === stintId ? original : s))
      if (original.ended_at === null) {
        activeStint.value = original
      }
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Unknown error'),
      }
    }
  }

  /**
   * Resumes a paused stint with optimistic UI update.
   * Creates a new stint continuing from the paused one.
   */
  async function resumeStint(
    pausedStintId: string,
    options?: {
      resumedAt?: Date
    },
  ): Promise<OptimisticResult<StintRow>> {
    // Find paused stint
    const pausedStint = stints.value.find(s => s.id === pausedStintId)
    if (!pausedStint) {
      return { data: null, error: new Error('Paused stint not found') }
    }

    // Store current active stint for rollback
    const previousActiveStint = activeStint.value

    // Create optimistic new stint
    const optimisticStint: StintRow = {
      id: crypto.randomUUID(),
      project_id: pausedStint.project_id,
      user_id: pausedStint.user_id,
      started_at: (options?.resumedAt ?? new Date()).toISOString(),
      ended_at: null,
      duration_minutes: null,
      notes: pausedStint.notes,
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Optimistically update state
    activeStint.value = optimisticStint
    stints.value = [optimisticStint, ...stints.value]

    try {
      // Call database
      const { data, error } = await resumeStintDb(client, pausedStintId, {
        resumedAt: options?.resumedAt,
      })

      if (error || !data) {
        // Roll back optimistic update
        activeStint.value = previousActiveStint
        stints.value = stints.value.filter(s => s.id !== optimisticStint.id)
        return { data: null, error: error || new Error('Failed to resume stint') }
      }

      // Replace optimistic stint with real data
      activeStint.value = data
      stints.value = stints.value.map(s =>
        s.id === optimisticStint.id ? data : s,
      )

      return { data, error: null }
    }
    catch (err) {
      // Roll back optimistic update
      activeStint.value = previousActiveStint
      stints.value = stints.value.filter(s => s.id !== optimisticStint.id)
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Unknown error'),
      }
    }
  }

  return {
    startStint,
    stopStint,
    pauseStint,
    resumeStint,
  }
}
