import { useQuery } from '@tanstack/vue-query';
import type { TypedSupabaseClient } from '~/utils/supabase';
import { getStreak } from '~/lib/supabase/streaks';

// ============================================================================
// Query Key Factory
// ============================================================================

export const streakKeys = {
  all: ['streaks'] as const,
  current: () => [...streakKeys.all, 'current'] as const,
};

// ============================================================================
// TypeScript Type Exports
// ============================================================================

// Note: Return type is inferred from useQuery to avoid type compatibility issues

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the user's browser timezone using the Intl API.
 * Falls back to 'UTC' if timezone detection fails.
 */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  catch {
    return 'UTC';
  }
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetches the current user's streak data including current streak,
 * longest streak, last stint date, and at-risk status.
 *
 * The streak is calculated server-side using the user's browser timezone
 * for accurate day boundary detection.
 *
 * Cache Configuration:
 * - staleTime: 5 minutes (streak doesn't change often)
 * - Invalidated automatically after stint completion via useStints.ts
 *
 * @example
 * ```ts
 * const { data: streak, isLoading, error } = useStreakQuery()
 *
 * // Access streak data
 * if (streak?.currentStreak > 0) {
 *   console.log(`🔥 ${streak.currentStreak} day streak!`)
 * }
 *
 * // Check if at risk
 * if (streak?.isAtRisk) {
 *   console.log('Complete a stint today to maintain your streak!')
 * }
 * ```
 */
export function useStreakQuery() {
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient;
  const timezone = getBrowserTimezone();

  return useQuery({
    queryKey: streakKeys.current(),
    queryFn: async () => {
      const { data, error } = await getStreak(client, timezone);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - streak doesn't change often except on completion
  });
}
