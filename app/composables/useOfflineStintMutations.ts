import { useStintLifecycle } from './useStintLifecycle'
import { useOfflineQueue } from './useOfflineQueue'
import { ErrorCategory } from '~/utils/errors'
import type { OptimisticResult } from './useStintLifecycle'
import type { StintRow } from '~/lib/supabase/stints'
import type { StintStartPayload } from '~/schemas/stints'

/**
 * Enhanced stint lifecycle composable with offline support
 *
 * Automatically queues failed mutations for retry on reconnection
 *
 * Usage:
 * ```ts
 * const { startStint, stopStint } = useOfflineStintMutations()
 * const result = await startStint({ projectId: '...' })
 * // Automatically queued if network fails
 * ```
 */
export function useOfflineStintMutations(
  clientOverride?: any,
  stintsStateOverride?: any,
  activeStintStateOverride?: any,
) {
  const baseComposable = useStintLifecycle(clientOverride, stintsStateOverride, activeStintStateOverride)
  const { queueMutation, isOnline } = useOfflineQueue()
  const { showInfo } = useErrorToast()

  async function startStint(payload: StintStartPayload): Promise<OptimisticResult<StintRow>> {
    const result = await baseComposable.startStint(payload)

    // Queue if network error
    if (result.error && result.error.category === ErrorCategory.Network) {
      await queueMutation('stint', 'start', { projectId: payload.projectId, ...payload })
      showInfo('Stint will be started when connection is restored')
      return result
    }

    return result
  }

  async function stopStint(
    stintId: string,
    options?: { endedAt?: Date, durationMinutes?: number, notes?: string },
  ): Promise<OptimisticResult<StintRow>> {
    const result = await baseComposable.stopStint(stintId, options)

    // Queue if network error
    if (result.error && result.error.category === ErrorCategory.Network) {
      await queueMutation('stint', 'stop', { stintId, ...options })
      showInfo('Stint will be stopped when connection is restored')
      return result
    }

    return result
  }

  async function pauseStint(
    stintId: string,
    options?: { pausedAt?: Date, notes?: string },
  ): Promise<OptimisticResult<StintRow>> {
    const result = await baseComposable.pauseStint(stintId, options)

    // Queue if network error
    if (result.error && result.error.category === ErrorCategory.Network) {
      await queueMutation('stint', 'pause', { stintId, ...options })
      showInfo('Stint will be paused when connection is restored')
      return result
    }

    return result
  }

  async function resumeStint(
    pausedStintId: string,
    options?: { resumedAt?: Date },
  ): Promise<OptimisticResult<StintRow>> {
    const result = await baseComposable.resumeStint(pausedStintId, options)

    // Queue if network error
    if (result.error && result.error.category === ErrorCategory.Network) {
      await queueMutation('stint', 'resume', { pausedStintId, ...options })
      showInfo('Stint will be resumed when connection is restored')
      return result
    }

    return result
  }

  return {
    startStint,
    stopStint,
    pauseStint,
    resumeStint,
    isOnline: readonly(isOnline),
  }
}
