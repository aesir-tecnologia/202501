import type { StintRow } from '~/lib/supabase/stints';

export interface StintTimeInfo {
  remainingSeconds: number
  elapsedSeconds: number
  plannedDurationSeconds: number
  pausedDurationSeconds: number
  endTime: number
}

/**
 * Calculate time-related values for a stint.
 *
 * For active stints: calculates based on current time
 * For paused stints: calculates based on pause time (frozen state)
 *
 * Formula: remaining = planned - (elapsed - pausedDuration)
 *        = planned - activeTime
 *
 * @param stint - The stint row from database
 * @param referenceTime - Optional reference time (defaults to now), useful for testing
 * @returns StintTimeInfo with all calculated values
 */
export function calculateStintTime(
  stint: StintRow,
  referenceTime: Date = new Date(),
): StintTimeInfo {
  if (!stint.started_at || !stint.planned_duration) {
    return {
      remainingSeconds: 0,
      elapsedSeconds: 0,
      plannedDurationSeconds: 0,
      pausedDurationSeconds: 0,
      endTime: referenceTime.getTime(),
    };
  }

  const startedAt = new Date(stint.started_at);
  const pausedDurationSeconds = stint.paused_duration || 0;
  const plannedDurationSeconds = stint.planned_duration * 60;

  let elapsedSeconds: number;

  if (stint.status === 'active') {
    elapsedSeconds = Math.floor((referenceTime.getTime() - startedAt.getTime()) / 1000);
  }
  else {
    const pausedAt = stint.paused_at ? new Date(stint.paused_at) : referenceTime;
    elapsedSeconds = Math.floor((pausedAt.getTime() - startedAt.getTime()) / 1000);
  }

  const activeTimeSeconds = elapsedSeconds - pausedDurationSeconds;
  const remainingSeconds = Math.max(0, plannedDurationSeconds - activeTimeSeconds);

  const endTime = startedAt.getTime() + (plannedDurationSeconds + pausedDurationSeconds) * 1000;

  return {
    remainingSeconds,
    elapsedSeconds,
    plannedDurationSeconds,
    pausedDurationSeconds,
    endTime,
  };
}

/**
 * Calculate remaining seconds for a stint (convenience wrapper).
 */
export function calculateRemainingSeconds(stint: StintRow, referenceTime?: Date): number {
  return calculateStintTime(stint, referenceTime).remainingSeconds;
}

/**
 * Format seconds as timer display string.
 * Shows MM:SS when under 1 hour, H:MM:SS when 1 hour or more.
 * Examples: 45:23, 1:29:59, -02:15 (overtime), -1:02:15 (overtime > 1hr)
 */
export function formatStintTime(seconds: number): string {
  const absSeconds = Math.abs(seconds);
  const hours = Math.floor(absSeconds / 3600);
  const mins = Math.floor((absSeconds % 3600) / 60);
  const secs = absSeconds % 60;
  const sign = seconds < 0 ? '-' : '';

  if (hours > 0) {
    return `${sign}${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format seconds as H:MM:SS for compact display (same as formatStintTime).
 * @deprecated Use formatStintTime instead
 */
export function formatStintTimeCompact(seconds: number): string {
  return formatStintTime(seconds);
}
