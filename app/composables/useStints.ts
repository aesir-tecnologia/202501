import { ref, computed, readonly, onMounted, onUnmounted } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { TypedSupabaseClient } from '~/utils/supabase'
import type { StintRow } from '~/lib/supabase/stints'
import { listStints, getActiveStint } from '~/lib/supabase/stints'

/**
 * Composable for centralized stint state management
 *
 * Provides reactive state for stints list with real-time synchronization.
 * Integrates with useStintLifecycle for optimistic updates.
 * Integrates with Web Worker timer for accurate background timing.
 * Enforces single active stint constraint across all tabs.
 *
 * Usage:
 * ```ts
 * const { activeStint, stints, startTimer, stopTimer, isTimerRunning } = useStints()
 * await fetchStints()
 * await startTimer(projectId)
 * ```
 */
export interface TimerWorkerMessage {
  type: 'tick' | 'warning' | 'complete' | 'started' | 'stopped' | 'paused' | 'error'
  elapsed?: number
  remaining?: number
  message?: string
}

export function useStints(
  clientOverride?: TypedSupabaseClient,
  stintsStateOverride?: Ref<StintRow[]>,
  activeStintStateOverride?: Ref<StintRow | null>,
) {
  const client: TypedSupabaseClient = clientOverride ?? (useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient)

  // Global state
  const stints = stintsStateOverride ?? useState<StintRow[]>('stints', () => [])
  const activeStint = activeStintStateOverride ?? useState<StintRow | null>('activeStint', () => null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const isSubscribed = ref(false)

  // Timer state
  const timerWorker = ref<Worker | null>(null)
  const elapsedSeconds = ref(0)
  const isTimerRunning = ref(false)

  // Store channel reference for cleanup
  let realtimeChannel: RealtimeChannel | null = null

  /**
   * Computed: Filter only completed stints
   */
  const completedStints = computed(() =>
    stints.value.filter(s => s.is_completed),
  )

  /**
   * Computed: Format elapsed time as HH:MM:SS
   */
  const formattedTime = computed(() => {
    const hours = Math.floor(elapsedSeconds.value / 3600)
    const minutes = Math.floor((elapsedSeconds.value % 3600) / 60)
    const seconds = elapsedSeconds.value % 60

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  /**
   * Initialize Web Worker for timer
   */
  function initTimerWorker(): void {
    if (!import.meta.client || timerWorker.value)
      return

    try {
      timerWorker.value = new Worker('/workers/timer-worker.js')

      timerWorker.value.addEventListener('message', (e: MessageEvent<TimerWorkerMessage>) => {
        handleWorkerMessage(e.data)
      })

      timerWorker.value.addEventListener('error', (e) => {
        console.error('Timer worker error:', e)
        error.value = new Error('Timer worker error')
      })
    }
    catch (err) {
      console.error('Failed to initialize timer worker:', err)
      error.value = err instanceof Error ? err : new Error('Failed to initialize timer worker')
    }
  }

  /**
   * Handle messages from timer worker
   */
  function handleWorkerMessage(message: TimerWorkerMessage): void {
    switch (message.type) {
      case 'tick':
        elapsedSeconds.value = message.elapsed ?? 0
        break

      case 'warning':
        // Emit warning event for notification handling
        if (import.meta.client) {
          window.dispatchEvent(new CustomEvent('stint:warning', {
            detail: { elapsed: message.elapsed, remaining: message.remaining },
          }))
        }
        break

      case 'complete':
        // Emit completion event for notification handling
        if (import.meta.client) {
          window.dispatchEvent(new CustomEvent('stint:complete', {
            detail: { elapsed: message.elapsed },
          }))
        }
        isTimerRunning.value = false
        break

      case 'started':
        isTimerRunning.value = true
        break

      case 'stopped':
      case 'paused':
        isTimerRunning.value = false
        break

      case 'error':
        console.error('Timer worker error:', message.message)
        error.value = new Error(message.message ?? 'Timer worker error')
        break
    }
  }

  /**
   * Start timer for active stint
   */
  function startTimer(targetDurationMinutes?: number): void {
    if (!activeStint.value) {
      console.warn('Cannot start timer without active stint')
      return
    }

    initTimerWorker()

    // Calculate elapsed time if stint was already started
    const startedAt = activeStint.value.started_at
      ? new Date(activeStint.value.started_at)
      : new Date()
    const now = new Date()
    const pausedElapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000)

    const targetSeconds = targetDurationMinutes
      ? targetDurationMinutes * 60
      : undefined

    timerWorker.value?.postMessage({
      type: 'start',
      pausedElapsed,
      duration: targetSeconds,
    })
  }

  /**
   * Stop timer
   */
  function stopTimer(): void {
    timerWorker.value?.postMessage({ type: 'stop' })
    isTimerRunning.value = false
    elapsedSeconds.value = 0
  }

  /**
   * Pause timer
   */
  function pauseTimer(): void {
    timerWorker.value?.postMessage({ type: 'pause' })
  }

  /**
   * Fetch stints from database
   */
  async function fetchStints(options: { projectId?: string } = {}): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await listStints(client, options)

      if (fetchError) {
        error.value = fetchError
        return
      }

      stints.value = data || []

      // Fetch active stint separately
      const { data: activeData, error: activeError } = await getActiveStint(client)

      if (activeError) {
        error.value = activeError
        return
      }

      activeStint.value = activeData

      // Auto-start timer if there's an active stint
      if (activeStint.value && !isTimerRunning.value) {
        startTimer()
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to fetch stints')
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Get stint by ID
   */
  function getStintById(id: string): StintRow | undefined {
    return stints.value.find(s => s.id === id)
  }

  /**
   * Subscribe to real-time stint updates
   */
  function subscribeToStints(): void {
    if (isSubscribed.value || !import.meta.client)
      return

    try {
      realtimeChannel = client
        .channel('stints-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'stints',
          },
          (payload) => {
            handleRealtimeEvent(payload)
          },
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            isSubscribed.value = true
          }
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Realtime subscription error:', status)
            isSubscribed.value = false
          }
        })
    }
    catch (err) {
      console.error('Failed to subscribe to realtime updates:', err)
    }
  }

  /**
   * Handle real-time events from Supabase with conflict resolution
   */
  function handleRealtimeEvent(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload

    // Use conflict resolution for concurrent edits
    const { resolveStintConflict } = useConflictResolution()

    switch (eventType) {
      case 'INSERT':
        // Add new stint if not already present (avoid duplicates from optimistic updates)
        if (!stints.value.some(s => s.id === newRecord.id)) {
          stints.value = [newRecord as StintRow, ...stints.value]
        }
        // Update active stint if it's not completed
        if (!newRecord.is_completed && !newRecord.ended_at) {
          activeStint.value = newRecord as StintRow
          if (!isTimerRunning.value) {
            startTimer()
          }
        }
        break

      case 'UPDATE':
        // Resolve conflicts with existing client data
        const existingStint = stints.value.find(s => s.id === newRecord.id)
        const resolvedStint = resolveStintConflict(
          existingStint ?? null,
          newRecord as StintRow,
          'merge-timestamps',
        )

        // Update with resolved data
        stints.value = stints.value.map(s =>
          s.id === newRecord.id ? resolvedStint : s,
        )

        // Update active stint if it matches
        if (activeStint.value?.id === newRecord.id) {
          if (resolvedStint.is_completed || resolvedStint.ended_at) {
            activeStint.value = null
            stopTimer()
          }
          else {
            activeStint.value = resolvedStint
          }
        }
        break

      case 'DELETE':
        // Remove deleted stint
        stints.value = stints.value.filter(s => s.id !== oldRecord.id)
        // Clear active stint if it was deleted
        if (activeStint.value?.id === oldRecord.id) {
          activeStint.value = null
          stopTimer()
        }
        break
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  function unsubscribe(): void {
    if (realtimeChannel) {
      client.removeChannel(realtimeChannel)
      realtimeChannel = null
      isSubscribed.value = false
    }
  }

  /**
   * Reset state (useful for logout)
   */
  function resetState(): void {
    unsubscribe()
    stopTimer()
    stints.value = []
    activeStint.value = null
    error.value = null
    isLoading.value = false
    elapsedSeconds.value = 0

    // Terminate worker
    if (timerWorker.value) {
      timerWorker.value.terminate()
      timerWorker.value = null
    }
  }

  // Auto-subscribe on client-side mount
  if (import.meta.client) {
    onMounted(() => {
      subscribeToStints()
    })

    onUnmounted(() => {
      unsubscribe()
      if (timerWorker.value) {
        timerWorker.value.terminate()
        timerWorker.value = null
      }
    })
  }

  /**
   * Start a new stint with automatic timer start
   * Integrates with useStintLifecycle for database operations
   */
  async function startNewStint(
    projectId: string,
    options?: {
      notes?: string
      targetDurationMinutes?: number
    },
  ): Promise<void> {
    // Import and use stint lifecycle
    const { startStint: startStintDb } = useStintLifecycle(
      client,
      stints as Ref<StintRow[]>,
      activeStint as Ref<StintRow | null>,
    )

    const result = await startStintDb({
      projectId,
      notes: options?.notes,
    })

    if (result.error) {
      error.value = result.error
      return
    }

    // Start timer after successful stint start
    if (result.data) {
      activeStint.value = result.data
      startTimer(options?.targetDurationMinutes)
    }
  }

  /**
   * Stop active stint with automatic timer stop
   * Integrates with useStintLifecycle for database operations
   */
  async function stopActiveStint(options?: {
    notes?: string
  }): Promise<void> {
    if (!activeStint.value) {
      error.value = new Error('No active stint to stop')
      return
    }

    // Stop timer first
    stopTimer()

    const stintId = activeStint.value.id

    // Import and use stint lifecycle
    const { stopStint: stopStintDb } = useStintLifecycle(
      client,
      stints as Ref<StintRow[]>,
      activeStint as Ref<StintRow | null>,
    )

    const result = await stopStintDb(stintId, {
      notes: options?.notes,
      durationMinutes: Math.floor(elapsedSeconds.value / 60),
    })

    if (result.error) {
      error.value = result.error
      // Restart timer on error
      if (activeStint.value) {
        startTimer()
      }
      return
    }

    activeStint.value = null
  }

  /**
   * Pause active stint with timer pause
   * Integrates with useStintLifecycle for database operations
   */
  async function pauseActiveStint(options?: {
    notes?: string
  }): Promise<void> {
    if (!activeStint.value) {
      error.value = new Error('No active stint to pause')
      return
    }

    // Pause timer first
    pauseTimer()

    const stintId = activeStint.value.id

    // Import and use stint lifecycle
    const { pauseStint: pauseStintDb } = useStintLifecycle(
      client,
      stints as Ref<StintRow[]>,
      activeStint as Ref<StintRow | null>,
    )

    const result = await pauseStintDb(stintId, {
      notes: options?.notes,
    })

    if (result.error) {
      error.value = result.error
      // Restart timer on error
      if (activeStint.value) {
        startTimer()
      }
      return
    }

    activeStint.value = null
  }

  /**
   * Resume a paused stint with timer restart
   * Integrates with useStintLifecycle for database operations
   */
  async function resumePausedStint(
    pausedStintId: string,
    options?: {
      targetDurationMinutes?: number
    },
  ): Promise<void> {
    // Import and use stint lifecycle
    const { resumeStint: resumeStintDb } = useStintLifecycle(
      client,
      stints as Ref<StintRow[]>,
      activeStint as Ref<StintRow | null>,
    )

    const result = await resumeStintDb(pausedStintId)

    if (result.error) {
      error.value = result.error
      return
    }

    // Start timer after successful stint resume
    if (result.data) {
      activeStint.value = result.data
      startTimer(options?.targetDurationMinutes)
    }
  }

  return {
    // State
    stints: readonly(stints),
    activeStint: readonly(activeStint),
    completedStints: readonly(completedStints),
    isLoading: readonly(isLoading),
    error: readonly(error),
    isSubscribed: readonly(isSubscribed),

    // Timer state
    elapsedSeconds: readonly(elapsedSeconds),
    formattedTime: readonly(formattedTime),
    isTimerRunning: readonly(isTimerRunning),

    // Methods
    fetchStints,
    getStintById,
    subscribeToStints,
    unsubscribe,
    resetState,

    // Timer methods
    startTimer,
    stopTimer,
    pauseTimer,

    // Stint lifecycle methods (with timer integration)
    startNewStint,
    stopActiveStint,
    pauseActiveStint,
    resumePausedStint,
  }
}
