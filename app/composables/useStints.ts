import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { UseQueryReturnType, UseMutationReturnType } from '@tanstack/vue-query'
import type { TypedSupabaseClient } from '~/utils/supabase'
import {
  listStints,
  getStintById,
  getActiveStint,
  createStint as createStintDb,
  updateStint as updateStintDb,
  deleteStint as deleteStintDb,
  type StintRow,
  type CreateStintPayload as DbCreateStintPayload,
  type UpdateStintPayload as DbUpdateStintPayload,
} from '~/lib/supabase/stints'
import {
  stintStartSchema,
  stintUpdateSchema,
  stintCompletionSchema,
  type StintStartPayload,
  type StintUpdatePayload,
  type StintCompletionPayload,
} from '~/schemas/stints'

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
}

export interface StintListFilters {
  projectId?: string
  activeOnly?: boolean
}

// ============================================================================
// TypeScript Type Exports
// ============================================================================

export type StintsQueryResult = UseQueryReturnType<StintRow[], Error>
export type StintQueryResult = UseQueryReturnType<StintRow | null, Error>
export type ActiveStintQueryResult = UseQueryReturnType<StintRow | null, Error>

export type CreateStintMutation = UseMutationReturnType<
  StintRow,
  Error,
  StintStartPayload,
  unknown
>

export type UpdateStintMutation = UseMutationReturnType<
  StintRow,
  Error,
  { id: string, data: StintUpdatePayload },
  unknown
>

export type CompleteStintMutation = UseMutationReturnType<
  StintRow,
  Error,
  StintCompletionPayload,
  unknown
>

export type DeleteStintMutation = UseMutationReturnType<
  void,
  Error,
  string,
  unknown
>

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Transforms camelCase payload to snake_case for database operations
 */
function toDbCreatePayload(payload: StintStartPayload): DbCreateStintPayload {
  const result: Record<string, unknown> = {
    project_id: payload.projectId,
  }

  if (payload.startedAt !== undefined) {
    result.started_at = payload.startedAt.toISOString()
  }
  if (payload.notes !== undefined) {
    result.notes = payload.notes
  }

  return result as DbCreateStintPayload
}

/**
 * Transforms camelCase update payload to snake_case for database operations
 */
function toDbUpdatePayload(payload: StintUpdatePayload): DbUpdateStintPayload {
  const result: Record<string, unknown> = {}

  if (payload.notes !== undefined) {
    result.notes = payload.notes
  }

  return result as DbUpdateStintPayload
}

/**
 * Transforms completion payload to database update format
 */
function toDbCompletionPayload(payload: StintCompletionPayload): DbUpdateStintPayload {
  const result: Record<string, unknown> = {
    is_completed: payload.completed,
    duration_minutes: payload.durationMinutes,
  }

  if (payload.endedAt !== undefined) {
    result.ended_at = payload.endedAt.toISOString()
  }
  if (payload.notes !== undefined) {
    result.notes = payload.notes
  }

  return result as DbUpdateStintPayload
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
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient

  return useQuery({
    queryKey: stintKeys.list(filters),
    queryFn: async () => {
      const { data, error } = await listStints(client, filters)
      if (error) throw error
      return data || []
    },
  })
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
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient
  const stintId = toValue(id)

  return useQuery({
    queryKey: stintKeys.detail(stintId),
    queryFn: async () => {
      const { data, error } = await getStintById(client, stintId)
      if (error) throw error
      return data
    },
    enabled: !!stintId,
  })
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
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient

  return useQuery({
    queryKey: stintKeys.active(),
    queryFn: async () => {
      const { data, error } = await getActiveStint(client)
      if (error) throw error
      return data
    },
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Creates (starts) a new stint with Zod validation and optimistic updates.
 * Auto-invalidates stint queries on success.
 *
 * @example
 * ```ts
 * const { mutateAsync, isPending } = useCreateStint()
 * await mutateAsync({ projectId: '123', notes: 'Starting work' })
 * ```
 */
export function useCreateStint() {
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: StintStartPayload) => {
      // Validate input
      const validation = stintStartSchema.safeParse(payload)
      if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || 'Validation failed')
      }

      // Call database
      const dbPayload = toDbCreatePayload(validation.data)
      const { data, error } = await createStintDb(client, dbPayload)

      if (error || !data) {
        throw error || new Error('Failed to create stint')
      }

      return data
    },
    onMutate: async (payload) => {
      // Cancel outgoing refetches for all list queries
      await queryClient.cancelQueries({ queryKey: stintKeys.lists() })
      await queryClient.cancelQueries({ queryKey: stintKeys.active() })

      // Snapshot previous value (use list with undefined filters to match default query)
      const previousStints = queryClient.getQueryData<StintRow[]>(stintKeys.list(undefined))
      const previousActiveStint = queryClient.getQueryData<StintRow | null>(stintKeys.active())

      // Optimistically update to the new value
      if (previousStints) {
        const optimisticStint: StintRow = {
          id: crypto.randomUUID(),
          project_id: payload.projectId,
          user_id: '',
          started_at: payload.startedAt?.toISOString() || new Date().toISOString(),
          ended_at: null,
          duration_minutes: null,
          is_completed: false,
          notes: payload.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        queryClient.setQueryData<StintRow[]>(
          stintKeys.list(undefined),
          [optimisticStint, ...previousStints],
        )

        // Set as active stint
        queryClient.setQueryData<StintRow | null>(stintKeys.active(), optimisticStint)
      }

      return { previousStints, previousActiveStint }
    },
    onError: (_err, _payload, context) => {
      // Rollback to previous value on error
      if (context?.previousStints) {
        queryClient.setQueryData(stintKeys.list(undefined), context.previousStints)
      }
      if (context?.previousActiveStint !== undefined) {
        queryClient.setQueryData(stintKeys.active(), context.previousActiveStint)
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: stintKeys.all })
    },
  })
}

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
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: StintUpdatePayload }) => {
      // Validate input
      const validation = stintUpdateSchema.safeParse(data)
      if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || 'Validation failed')
      }

      // Call database
      const dbPayload = toDbUpdatePayload(validation.data)
      const { data: result, error } = await updateStintDb(client, id, dbPayload)

      if (error || !result) {
        throw error || new Error('Failed to update stint')
      }

      return result
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: stintKeys.lists() })
      await queryClient.cancelQueries({ queryKey: stintKeys.detail(id) })
      await queryClient.cancelQueries({ queryKey: stintKeys.active() })

      // Snapshot previous values
      const previousStints = queryClient.getQueryData<StintRow[]>(stintKeys.list(undefined))
      const previousStint = queryClient.getQueryData<StintRow>(stintKeys.detail(id))
      const previousActiveStint = queryClient.getQueryData<StintRow | null>(stintKeys.active())

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
        )
      }

      // Optimistically update detail
      if (previousStint) {
        queryClient.setQueryData<StintRow>(stintKeys.detail(id), {
          ...previousStint,
          notes: data.notes !== undefined ? data.notes : previousStint.notes,
          updated_at: new Date().toISOString(),
        })
      }

      // Optimistically update active stint if it matches
      if (previousActiveStint && previousActiveStint.id === id) {
        queryClient.setQueryData<StintRow | null>(stintKeys.active(), {
          ...previousActiveStint,
          notes: data.notes !== undefined ? data.notes : previousActiveStint.notes,
          updated_at: new Date().toISOString(),
        })
      }

      return { previousStints, previousStint, previousActiveStint }
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousStints) {
        queryClient.setQueryData(stintKeys.list(undefined), context.previousStints)
      }
      if (context?.previousStint) {
        queryClient.setQueryData(stintKeys.detail(id), context.previousStint)
      }
      if (context?.previousActiveStint !== undefined) {
        queryClient.setQueryData(stintKeys.active(), context.previousActiveStint)
      }
    },
    onSuccess: (_data, { id }) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: stintKeys.lists() })
      queryClient.invalidateQueries({ queryKey: stintKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: stintKeys.active() })
    },
  })
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
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: StintCompletionPayload) => {
      // Validate input
      const validation = stintCompletionSchema.safeParse(payload)
      if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || 'Validation failed')
      }

      // Call database
      const dbPayload = toDbCompletionPayload(validation.data)
      const { data, error } = await updateStintDb(client, payload.stintId, dbPayload)

      if (error || !data) {
        throw error || new Error('Failed to complete stint')
      }

      return data
    },
    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: stintKeys.lists() })
      await queryClient.cancelQueries({ queryKey: stintKeys.detail(payload.stintId) })
      await queryClient.cancelQueries({ queryKey: stintKeys.active() })

      // Snapshot previous values
      const previousStints = queryClient.getQueryData<StintRow[]>(stintKeys.list(undefined))
      const previousStint = queryClient.getQueryData<StintRow>(stintKeys.detail(payload.stintId))
      const previousActiveStint = queryClient.getQueryData<StintRow | null>(stintKeys.active())

      // Optimistically update list
      if (previousStints) {
        queryClient.setQueryData<StintRow[]>(
          stintKeys.list(undefined),
          previousStints.map(s =>
            s.id === payload.stintId
              ? {
                  ...s,
                  ended_at: payload.endedAt?.toISOString() || new Date().toISOString(),
                  duration_minutes: payload.durationMinutes,
                  is_completed: payload.completed,
                  notes: payload.notes !== undefined ? payload.notes : s.notes,
                  updated_at: new Date().toISOString(),
                }
              : s,
          ),
        )
      }

      // Optimistically update detail
      if (previousStint) {
        queryClient.setQueryData<StintRow>(stintKeys.detail(payload.stintId), {
          ...previousStint,
          ended_at: payload.endedAt?.toISOString() || new Date().toISOString(),
          duration_minutes: payload.durationMinutes,
          is_completed: payload.completed,
          notes: payload.notes !== undefined ? payload.notes : previousStint.notes,
          updated_at: new Date().toISOString(),
        })
      }

      // Clear active stint (since it's being completed)
      if (previousActiveStint && previousActiveStint.id === payload.stintId) {
        queryClient.setQueryData<StintRow | null>(stintKeys.active(), null)
      }

      return { previousStints, previousStint, previousActiveStint }
    },
    onError: (_err, payload, context) => {
      // Rollback on error
      if (context?.previousStints) {
        queryClient.setQueryData(stintKeys.list(undefined), context.previousStints)
      }
      if (context?.previousStint) {
        queryClient.setQueryData(stintKeys.detail(payload.stintId), context.previousStint)
      }
      if (context?.previousActiveStint !== undefined) {
        queryClient.setQueryData(stintKeys.active(), context.previousActiveStint)
      }
    },
    onSuccess: (_data, payload) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: stintKeys.lists() })
      queryClient.invalidateQueries({ queryKey: stintKeys.detail(payload.stintId) })
      queryClient.invalidateQueries({ queryKey: stintKeys.active() })
    },
  })
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
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteStintDb(client, id)

      if (error) {
        throw error
      }
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: stintKeys.lists() })
      await queryClient.cancelQueries({ queryKey: stintKeys.active() })

      // Snapshot previous value
      const previousStints = queryClient.getQueryData<StintRow[]>(stintKeys.list(undefined))
      const previousActiveStint = queryClient.getQueryData<StintRow | null>(stintKeys.active())

      // Optimistically remove from list
      if (previousStints) {
        queryClient.setQueryData<StintRow[]>(
          stintKeys.list(undefined),
          previousStints.filter(s => s.id !== id),
        )
      }

      // Clear active stint if it matches the deleted stint
      if (previousActiveStint && previousActiveStint.id === id) {
        queryClient.setQueryData<StintRow | null>(stintKeys.active(), null)
      }

      return { previousStints, previousActiveStint }
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousStints) {
        queryClient.setQueryData(stintKeys.list(undefined), context.previousStints)
      }
      if (context?.previousActiveStint !== undefined) {
        queryClient.setQueryData(stintKeys.active(), context.previousActiveStint)
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: stintKeys.all })
    },
  })
}
