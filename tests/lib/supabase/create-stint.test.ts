import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database.types';
import { createStint } from '~/lib/supabase/stints';
import { getTestUser, cleanupTestData } from '../../setup';

/**
 * Contract Test: createStint
 *
 * Verifies the createStint function meets its contract:
 * - Creates stint with required fields
 * - Creates stint with optional fields
 * - Auto-injects user_id from auth session
 * - Auto-applies database defaults
 * - Error when project doesn't exist
 * - Error when project belongs to another user
 */

const _supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const _supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

type TestClient = ReturnType<typeof createClient<Database>>;

describe('createStint Contract', () => {
  let testUser1Client: TestClient;
  let testUser2Client: TestClient;
  let testUser1: { id: string, email: string } | null;
  let testUser2: { id: string, email: string } | null;
  let projectId: string;

  beforeEach(async () => {
    const testUser1Data = await getTestUser(1);
    testUser1Client = testUser1Data.client;
    testUser1 = testUser1Data.user;
    await cleanupTestData(testUser1Client);

    const testUser2Data = await getTestUser(2);
    testUser2Client = testUser2Data.client;
    testUser2 = testUser2Data.user;
    await cleanupTestData(testUser2Client);

    // Create test project for user 1
    const { data: project } = await testUser1Client
      .from('projects')
      .insert({ user_id: testUser1!.id, name: 'Test Project', expected_daily_stints: 3 })
      .select()
      .single();

    projectId = project!.id;
  });

  afterEach(async () => {
    if (testUser1Client) await testUser1Client.auth.signOut();
    if (testUser2Client) await testUser2Client.auth.signOut();
  });

  it('should create stint with required fields', async () => {
    const now = new Date();

    const { data, error } = await createStint(testUser1Client, {
      project_id: projectId,
      started_at: now.toISOString(),
    });

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.project_id).toBe(projectId);
    expect(new Date(data!.started_at).getTime()).toBe(now.getTime());
    expect(data!.user_id).toBe(testUser1!.id);
  });

  it('should create stint with optional fields', async () => {
    const now = new Date();
    const endedAt = new Date(now.getTime() + 2700000); // 45 minutes later

    const { data, error } = await createStint(testUser1Client, {
      project_id: projectId,
      started_at: now.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_minutes: 45,
      notes: 'Productive session',
      is_completed: true,
    });

    expect(error).toBeNull();
    expect(new Date(data!.ended_at!).getTime()).toBe(endedAt.getTime());
    expect(data!.duration_minutes).toBe(45);
    expect(data!.notes).toBe('Productive session');
    expect(data!.is_completed).toBe(true);
  });

  it('should auto-inject user_id from auth session', async () => {
    const { data } = await createStint(testUser1Client, {
      project_id: projectId,
      started_at: new Date().toISOString(),
    });

    expect(data!.user_id).toBe(testUser1!.id);
  });

  it('should auto-apply database defaults', async () => {
    const { data } = await createStint(testUser1Client, {
      project_id: projectId,
      started_at: new Date().toISOString(),
    });

    expect(data!.is_completed).toBe(false);
    expect(data!.ended_at).toBeNull();
    expect(data!.duration_minutes).toBeNull();
    expect(data!.created_at).toBeTruthy();
  });

  it('should error when project doesn\'t exist', async () => {
    const fakeProjectId = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await createStint(testUser1Client, {
      project_id: fakeProjectId,
      started_at: new Date().toISOString(),
    });

    expect(data).toBeNull();
    expect(error).toBeTruthy();
    // RLS policy failure (42501) or foreign key violation (23503) or not found (PGRST204)
    expect(error?.code).toMatch(/42501|23503|PGRST204/);
  });

  it('should error when project belongs to another user', async () => {
    // User 2 creates a project
    const { data: user2Project } = await testUser2Client
      .from('projects')
      .insert({ user_id: testUser2!.id, name: 'User 2 Project', expected_daily_stints: 3 })
      .select()
      .single();

    // User 1 tries to create stint for User 2's project
    const { data, error } = await createStint(testUser1Client, {
      project_id: user2Project!.id,
      started_at: new Date().toISOString(),
    });

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  it('should error if user not authenticated', async () => {
    const unauthClient = createClient<Database>(_supabaseUrl, _supabaseAnonKey);

    const { data, error } = await createStint(unauthClient, {
      project_id: projectId,
      started_at: new Date().toISOString(),
    });

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  it('should create multiple stints for the same project', async () => {
    const now = new Date();

    const { data: stint1 } = await createStint(testUser1Client, {
      project_id: projectId,
      started_at: new Date(now.getTime() - 3600000).toISOString(),
    });

    const { data: stint2 } = await createStint(testUser1Client, {
      project_id: projectId,
      started_at: now.toISOString(),
    });

    expect(stint1!.id).not.toBe(stint2!.id);
    expect(stint1!.project_id).toBe(projectId);
    expect(stint2!.project_id).toBe(projectId);
  });
});
