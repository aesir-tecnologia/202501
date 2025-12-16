import type { Database } from '~/types/database.types';
import type { TypedSupabaseClient } from '~/utils/supabase';

export type UserStreakRow = Database['public']['Tables']['user_streaks']['Row'];

export type StreakData = {
  currentStreak: number
  longestStreak: number
  lastStintDate: string | null
  isAtRisk: boolean
};

export type Result<T> = {
  data: T | null
  error: Error | null
};

async function requireUserId(client: TypedSupabaseClient): Promise<Result<string>> {
  const { data, error } = await client.auth.getUser();

  if (error || !data?.user) {
    return { data: null, error: new Error('User must be authenticated to view streaks') };
  }

  return { data: data.user.id, error: null };
}

/**
 * Gets the current streak data for the authenticated user.
 * Uses the calculate_streak_with_tz database function for accurate calculation
 * with timezone support and grace period logic.
 *
 * @param client - Typed Supabase client
 * @param timezone - User's timezone (e.g., 'America/Sao_Paulo'). Defaults to 'UTC'
 * @returns Streak data including current streak, longest streak, last stint date, and at-risk status
 */
export async function getStreak(
  client: TypedSupabaseClient,
  timezone: string = 'UTC',
): Promise<Result<StreakData>> {
  const userResult = await requireUserId(client);
  if (userResult.error || !userResult.data) {
    return { data: null, error: userResult.error || new Error('User ID unavailable') };
  }
  const userId = userResult.data;

  const { data, error } = await client.rpc('calculate_streak_with_tz', {
    p_user_id: userId,
    p_timezone: timezone,
  });

  if (error) {
    return {
      data: null,
      error: new Error(error.message || 'Failed to calculate streak'),
    };
  }

  if (!data || data.length === 0) {
    return {
      data: {
        currentStreak: 0,
        longestStreak: 0,
        lastStintDate: null,
        isAtRisk: false,
      },
      error: null,
    };
  }

  const result = data[0]!;
  return {
    data: {
      currentStreak: result.current_streak,
      longestStreak: result.longest_streak,
      lastStintDate: result.last_stint_date,
      isAtRisk: result.is_at_risk,
    },
    error: null,
  };
}

/**
 * Updates the user's streak after completing a stint.
 * This should be called after a stint is completed to keep the user_streaks table in sync.
 *
 * @param client - Typed Supabase client
 * @param timezone - User's timezone for accurate day boundary calculation
 * @returns Updated streak data
 */
export async function updateStreakAfterCompletion(
  client: TypedSupabaseClient,
  timezone: string = 'UTC',
): Promise<Result<StreakData>> {
  const userResult = await requireUserId(client);
  if (userResult.error || !userResult.data) {
    return { data: null, error: userResult.error || new Error('User ID unavailable') };
  }
  const userId = userResult.data;

  const { data, error } = await client.rpc('update_user_streak', {
    p_user_id: userId,
    p_timezone: timezone,
  });

  if (error) {
    return {
      data: null,
      error: new Error(error.message || 'Failed to update streak'),
    };
  }

  if (!data || data.length === 0) {
    return {
      data: {
        currentStreak: 0,
        longestStreak: 0,
        lastStintDate: null,
        isAtRisk: false,
      },
      error: null,
    };
  }

  const result = data[0]!;

  return {
    data: {
      currentStreak: result.current_streak,
      longestStreak: result.longest_streak,
      lastStintDate: result.last_stint_date,
      isAtRisk: result.is_at_risk,
    },
    error: null,
  };
}
