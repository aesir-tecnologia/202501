import type { TypedSupabaseClient } from '~/utils/supabase';
import type { StintDayAttribution } from '~/schemas/preferences';
import { requireUserId, type Result } from './auth';

export interface PreferencesData {
  defaultStintDuration: number | null
  celebrationAnimation: boolean
  desktopNotifications: boolean
  stintDayAttribution: StintDayAttribution
  timezone: string
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
    .select('default_stint_duration, celebration_animation, desktop_notifications, stint_day_attribution, timezone')
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
      defaultStintDuration: data.default_stint_duration,
      celebrationAnimation: data.celebration_animation,
      desktopNotifications: data.desktop_notifications,
      stintDayAttribution: data.stint_day_attribution as StintDayAttribution,
      timezone: data.timezone,
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
    dbUpdates.default_stint_duration = updates.defaultStintDuration;
  }
  if ('celebrationAnimation' in updates) {
    dbUpdates.celebration_animation = updates.celebrationAnimation;
  }
  if ('desktopNotifications' in updates) {
    dbUpdates.desktop_notifications = updates.desktopNotifications;
  }
  if ('stintDayAttribution' in updates) {
    dbUpdates.stint_day_attribution = updates.stintDayAttribution;
  }
  if ('timezone' in updates) {
    dbUpdates.timezone = updates.timezone;
  }

  const { data, error } = await client
    .from('user_profiles')
    .update(dbUpdates)
    .eq('id', userId)
    .select('default_stint_duration, celebration_animation, desktop_notifications, stint_day_attribution, timezone')
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return {
    data: {
      defaultStintDuration: data.default_stint_duration,
      celebrationAnimation: data.celebration_animation,
      desktopNotifications: data.desktop_notifications,
      stintDayAttribution: data.stint_day_attribution as StintDayAttribution,
      timezone: data.timezone,
    },
    error: null,
  };
}
