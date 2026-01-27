import type { TypedSupabaseClient } from '~/utils/supabase';
import { requireUserId, type Result } from './auth';

export interface PreferencesData {
  defaultStintDuration: number | null
  celebrationAnimation: boolean
  desktopNotifications: boolean
}

export type { Result };

export async function getPreferences(
  client: TypedSupabaseClient,
): Promise<Result<PreferencesData | null>> {
  const userResult = await requireUserId(client, 'read preferences');
  if (userResult.error || !userResult.data) {
    return { data: null, error: userResult.error || new Error('User ID unavailable') };
  }
  const userId = userResult.data;

  const { data, error } = await client
    .from('user_profiles')
    .select('default_stint_duration, celebration_animation, desktop_notifications')
    .eq('id', userId)
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  if (!data) {
    return { data: null, error: new Error('Profile not found') };
  }

  return {
    data: {
      // Convert from seconds (database) to minutes (user-facing)
      defaultStintDuration: data.default_stint_duration !== null
        ? Math.round(data.default_stint_duration / 60)
        : null,
      celebrationAnimation: data.celebration_animation,
      desktopNotifications: data.desktop_notifications,
    },
    error: null,
  };
}

export async function updatePreferences(
  client: TypedSupabaseClient,
  updates: Partial<PreferencesData>,
): Promise<Result<PreferencesData>> {
  const userResult = await requireUserId(client, 'update preferences');
  if (userResult.error || !userResult.data) {
    return { data: null, error: userResult.error || new Error('User ID unavailable') };
  }
  const userId = userResult.data;

  const dbUpdates: Record<string, unknown> = {};
  if ('defaultStintDuration' in updates) {
    // Convert from minutes (user-facing) to seconds (database storage)
    const durationMinutes = updates.defaultStintDuration;
    dbUpdates.default_stint_duration = durationMinutes != null
      ? durationMinutes * 60
      : null;
  }
  if ('celebrationAnimation' in updates) {
    dbUpdates.celebration_animation = updates.celebrationAnimation;
  }
  if ('desktopNotifications' in updates) {
    dbUpdates.desktop_notifications = updates.desktopNotifications;
  }

  const { data, error } = await client
    .from('user_profiles')
    .update(dbUpdates)
    .eq('id', userId)
    .select('default_stint_duration, celebration_animation, desktop_notifications')
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return {
    data: {
      // Convert from seconds (database) to minutes (user-facing)
      defaultStintDuration: data.default_stint_duration !== null
        ? Math.round(data.default_stint_duration / 60)
        : null,
      celebrationAnimation: data.celebration_animation,
      desktopNotifications: data.desktop_notifications,
    },
    error: null,
  };
}
