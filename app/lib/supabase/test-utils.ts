import { createClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database.types';
import type { TypedSupabaseClient } from '~/utils/supabase';
import type { ProjectRow, ProjectInsert } from './projects';
import type { StintRow, StintInsert } from './stints';

export const SUPABASE_URL = process.env.SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const TEST_USER_PASSWORD = 'IntegrationTest2025!';

export function getServiceClient(): TypedSupabaseClient {
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

export function getUnauthenticatedClient(): TypedSupabaseClient {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export async function getAuthenticatedClient(email: string): Promise<TypedSupabaseClient> {
  const client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  await client.auth.signInWithPassword({
    email,
    password: TEST_USER_PASSWORD,
  });
  return client;
}

export async function createTestUser(client: TypedSupabaseClient, email: string): Promise<string> {
  const { data, error } = await client.auth.admin.createUser({
    email,
    password: TEST_USER_PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user.id;
}

export async function deleteTestUser(client: TypedSupabaseClient, userId: string): Promise<void> {
  await client.auth.admin.deleteUser(userId);
}

export async function cleanupTestData(client: TypedSupabaseClient, userId: string): Promise<void> {
  await client.from('stints').delete().eq('user_id', userId);
  await client.from('projects').delete().eq('user_id', userId);
  await client.from('user_streaks').delete().eq('user_id', userId);
}

export async function createTestProject(
  client: TypedSupabaseClient,
  userId: string,
  overrides?: Partial<ProjectInsert>,
): Promise<ProjectRow> {
  const { data, error } = await client
    .from('projects')
    .insert({
      name: `Test Project ${Date.now()}`,
      user_id: userId,
      ...overrides,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

// NOTE: planned_duration is in SECONDS
export async function createActiveStint(
  client: TypedSupabaseClient,
  projectId: string,
  userId: string,
  overrides?: Partial<StintInsert>,
): Promise<StintRow> {
  const { data, error } = await client
    .from('stints')
    .insert({
      project_id: projectId,
      user_id: userId,
      planned_duration: 1500, // 25 minutes in seconds
      status: 'active',
      started_at: new Date().toISOString(),
      ...overrides,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function createPausedStint(
  client: TypedSupabaseClient,
  projectId: string,
  userId: string,
  overrides?: Partial<StintInsert>,
): Promise<StintRow> {
  const { data, error } = await client
    .from('stints')
    .insert({
      project_id: projectId,
      user_id: userId,
      planned_duration: 1500, // 25 minutes in seconds
      status: 'paused',
      started_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      paused_at: new Date().toISOString(),
      paused_duration: 0,
      ...overrides,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function createCompletedStint(
  client: TypedSupabaseClient,
  projectId: string,
  userId: string,
  overrides?: Partial<StintInsert>,
): Promise<StintRow> {
  const startedAt = new Date(Date.now() - 30 * 60 * 1000);
  const endedAt = new Date();
  const { data, error } = await client
    .from('stints')
    .insert({
      project_id: projectId,
      user_id: userId,
      planned_duration: 1500, // 25 minutes in seconds
      status: 'completed',
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      actual_duration: 1500, // 25 minutes in seconds
      completion_type: 'manual',
      ...overrides,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Creates a completed stint that ended on a specific date.
 * Useful for testing streak scenarios.
 */
export async function createCompletedStintOnDate(
  client: TypedSupabaseClient,
  projectId: string,
  userId: string,
  endedAt: Date,
  overrides?: Partial<StintInsert>,
): Promise<StintRow> {
  const startedAt = new Date(endedAt.getTime() - 30 * 60 * 1000);
  const { data, error } = await client
    .from('stints')
    .insert({
      project_id: projectId,
      user_id: userId,
      planned_duration: 1500, // 25 minutes in seconds
      status: 'completed',
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      actual_duration: 1500, // 25 minutes in seconds
      completion_type: 'manual',
      ...overrides,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Gets a UTC date N days ago at a specific hour (defaults to noon UTC).
 * Uses UTC methods to ensure consistent behavior across timezones.
 */
export function getDateDaysAgoUTC(daysAgo: number, hour: number = 12): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

/**
 * Gets today's date at a specific hour in UTC.
 */
export function getTodayUTC(hour: number = 12): Date {
  return getDateDaysAgoUTC(0, hour);
}
