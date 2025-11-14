import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database.types';
import { getStintById, getActiveStint } from '~/lib/supabase/stints';
import { getTestUser, cleanupTestData } from '../../setup';

/**
 * Contract Test: getStintById & getActiveStint
 *
 * Verifies the stint retrieval functions meet their contracts:
 * - getStintById: fetches stint by ID
 * - getStintById: returns null when not found
 * - getStintById: RLS prevents fetching other users' stints
 * - getActiveStint: returns active stint (ended_at IS NULL)
 * - getActiveStint: returns null when no active stint
 */

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

type TestClient = ReturnType<typeof createClient<Database>>;

describe('getStintById Contract', () => {
  let testUser1Client: TestClient;
  let testUser2Client: TestClient;
  let testUser1: { id: string, email: string } | null;
  let _testUser2: { id: string, email: string } | null;
  let projectId: string;
  let stintId: string;

  beforeEach(async () => {
    const testUser1Data = await getTestUser(1);
    testUser1Client = testUser1Data.client;
    testUser1 = testUser1Data.user;
    await cleanupTestData(testUser1Client);

    const testUser2Data = await getTestUser(2);
    testUser2Client = testUser2Data.client;
    _testUser2 = testUser2Data.user;
    await cleanupTestData(testUser2Client);

    // Create test project for user 1
    const { data: project } = await testUser1Client
      .from('projects')
      .insert({ name: 'Test Project', expected_daily_stints: 3, user_id: testUser1!.id })
      .select()
      .single();

    projectId = project!.id;

    // Create a test stint
    const { data: stint } = await testUser1Client
      .from('stints')
      .insert({
        project_id: projectId,
        started_at: new Date().toISOString(),
        user_id: testUser1!.id,
      })
      .select()
      .single();

    stintId = stint!.id;
  });

  afterEach(async () => {
    if (testUser1Client) await testUser1Client.auth.signOut();
    if (testUser2Client) await testUser2Client.auth.signOut();
  });

  it('should fetch stint by ID successfully', async () => {
    const { data, error } = await getStintById(testUser1Client, stintId);

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.id).toBe(stintId);
    expect(data!.project_id).toBe(projectId);
    expect(data!.user_id).toBe(testUser1!.id);
  });

  it('should return null when stint not found', async () => {
    const fakeStintId = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await getStintById(testUser1Client, fakeStintId);

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it('should prevent fetching other users\' stints (RLS)', async () => {
    // User 2 tries to fetch User 1's stint
    const { data } = await getStintById(testUser2Client, stintId);

    // RLS should prevent access, returning null (or potentially an error)
    expect(data).toBeNull();
  });

  it('should error if user not authenticated', async () => {
    const unauthClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

    const { data, error } = await getStintById(unauthClient, stintId);

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  it('should return all stint fields', async () => {
    const { data } = await getStintById(testUser1Client, stintId);

    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('user_id');
    expect(data).toHaveProperty('project_id');
    expect(data).toHaveProperty('started_at');
    expect(data).toHaveProperty('ended_at');
    expect(data).toHaveProperty('duration_minutes');
    expect(data).toHaveProperty('is_completed');
    expect(data).toHaveProperty('notes');
    expect(data).toHaveProperty('created_at');
    expect(data).toHaveProperty('updated_at');
  });
});

describe('getActiveStint Contract', () => {
  let testUserClient: TestClient;
  let testUser: { id: string, email: string } | null;
  let projectId: string;

  beforeEach(async () => {
    const testUserData = await getTestUser();
    testUserClient = testUserData.client;
    testUser = testUserData.user;
    await cleanupTestData(testUserClient);

    // Create test project
    const { data: project } = await testUserClient
      .from('projects')
      .insert({ name: 'Test Project', expected_daily_stints: 3, user_id: testUser!.id })
      .select()
      .single();

    projectId = project!.id;
  });

  afterEach(async () => {
    if (testUserClient) await testUserClient.auth.signOut();
  });

  it('should return active stint when one exists', async () => {
    // Create active stint (ended_at IS NULL)
    const { data: activeStint } = await testUserClient
      .from('stints')
      .insert({
        project_id: projectId,
        started_at: new Date().toISOString(),
        ended_at: null,
        is_completed: false,
        user_id: testUser!.id,
      })
      .select()
      .single();

    const { data, error } = await getActiveStint(testUserClient);

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.id).toBe(activeStint!.id);
    expect(data!.ended_at).toBeNull();
    expect(data!.is_completed).toBe(false);
  });

  it('should return null when no active stint exists', async () => {
    const { data, error } = await getActiveStint(testUserClient);

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it('should return null when only completed stints exist', async () => {
    const now = new Date();

    // Create completed stint
    await testUserClient
      .from('stints')
      .insert({
        project_id: projectId,
        started_at: new Date(now.getTime() - 3600000).toISOString(),
        ended_at: now.toISOString(),
        is_completed: true,
        user_id: testUser!.id,
      });

    const { data, error } = await getActiveStint(testUserClient);

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it('should only return stint where ended_at IS NULL', async () => {
    const now = new Date();

    // Create completed stint
    await testUserClient
      .from('stints')
      .insert({
        project_id: projectId,
        started_at: new Date(now.getTime() - 7200000).toISOString(),
        ended_at: new Date(now.getTime() - 5400000).toISOString(),
        is_completed: true,
        user_id: testUser!.id,
      });

    // Create active stint
    const { data: activeStint } = await testUserClient
      .from('stints')
      .insert({
        project_id: projectId,
        started_at: now.toISOString(),
        ended_at: null,
        is_completed: false,
        user_id: testUser!.id,
      })
      .select()
      .single();

    const { data } = await getActiveStint(testUserClient);

    expect(data).toBeTruthy();
    expect(data!.id).toBe(activeStint!.id);
    expect(data!.ended_at).toBeNull();
  });

  it('should error if user not authenticated', async () => {
    const unauthClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

    const { data, error } = await getActiveStint(unauthClient);

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });
});
