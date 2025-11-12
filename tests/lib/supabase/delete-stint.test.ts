import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database.types';
import { deleteStint, getStintById } from '~/lib/supabase/stints';
import { createTestUser } from '../../setup';

/**
 * Contract Test: deleteStint
 *
 * Verifies the deleteStint function meets its contract:
 * - Deletes stint successfully
 * - RLS prevents deleting other users' stints
 * - Error when stint not found (handled gracefully)
 */

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

type TestClient = ReturnType<typeof createClient<Database>>;

describe('deleteStint Contract', () => {
  let testUser1Client: TestClient;
  let testUser2Client: TestClient;
  let testUser1: { id: string, email: string } | null;
  let _testUser2: { id: string, email: string } | null;
  let projectId: string;
  let stintId: string;

  beforeEach(async () => {
    const testUser1Data = await createTestUser();
    testUser1Client = testUser1Data.client;
    testUser1 = testUser1Data.user;

    const testUser2Data = await createTestUser();
    testUser2Client = testUser2Data.client;
    _testUser2 = testUser2Data.user;

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

  it('should delete stint successfully', async () => {
    const { data, error } = await deleteStint(testUser1Client, stintId);

    expect(error).toBeNull();
    expect(data).toBeNull(); // Returns Result<void>

    // Verify stint is actually deleted
    const { data: deletedStint } = await getStintById(testUser1Client, stintId);
    expect(deletedStint).toBeNull();
  });

  it('should prevent deleting other users\' stints (RLS)', async () => {
    // User 2 tries to delete User 1's stint
    const { data } = await deleteStint(testUser2Client, stintId);

    // RLS prevents the delete - it may return null/null or an error
    // Either way, the stint should still exist
    expect(data).toBeNull();

    // Verify stint still exists (most important check)
    const { data: stillExists } = await getStintById(testUser1Client, stintId);
    expect(stillExists).toBeTruthy();
    expect(stillExists!.id).toBe(stintId);
  });

  it('should handle deleting non-existent stint gracefully', async () => {
    const fakeStintId = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await deleteStint(testUser1Client, fakeStintId);

    // Should not error on non-existent stint (idempotent delete)
    // Returns success but no data
    expect(data).toBeNull();
    expect(error).toBeNull();
  });

  it('should error if user not authenticated', async () => {
    const unauthClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

    const { data, error } = await deleteStint(unauthClient, stintId);

    expect(data).toBeNull();
    expect(error).toBeTruthy();

    // Verify stint still exists
    const { data: stillExists } = await getStintById(testUser1Client, stintId);
    expect(stillExists).toBeTruthy();
  });

  it('should delete active stint without issues', async () => {
    // Create an active stint (ended_at IS NULL)
    const { data: activeStint } = await testUser1Client
      .from('stints')
      .insert({
        project_id: projectId,
        started_at: new Date().toISOString(),
        ended_at: null,
        is_completed: false,
        user_id: testUser1!.id,
      })
      .select()
      .single();

    const { error } = await deleteStint(testUser1Client, activeStint!.id);

    expect(error).toBeNull();

    // Verify deletion
    const { data: deleted } = await getStintById(testUser1Client, activeStint!.id);
    expect(deleted).toBeNull();
  });

  it('should delete completed stint without issues', async () => {
    const now = new Date();

    // Create a completed stint
    const { data: completedStint } = await testUser1Client
      .from('stints')
      .insert({
        project_id: projectId,
        started_at: new Date(now.getTime() - 3600000).toISOString(),
        ended_at: now.toISOString(),
        is_completed: true,
        duration_minutes: 60,
        user_id: testUser1!.id,
      })
      .select()
      .single();

    const { error } = await deleteStint(testUser1Client, completedStint!.id);

    expect(error).toBeNull();

    // Verify deletion
    const { data: deleted } = await getStintById(testUser1Client, completedStint!.id);
    expect(deleted).toBeNull();
  });

  it('should allow deleting multiple stints sequentially', async () => {
    // Create multiple stints
    const { data: stint1 } = await testUser1Client
      .from('stints')
      .insert({
        project_id: projectId,
        started_at: new Date().toISOString(),
        user_id: testUser1!.id,
      })
      .select()
      .single();

    const { data: stint2 } = await testUser1Client
      .from('stints')
      .insert({
        project_id: projectId,
        started_at: new Date().toISOString(),
        user_id: testUser1!.id,
      })
      .select()
      .single();

    // Delete both
    const { error: error1 } = await deleteStint(testUser1Client, stint1!.id);
    const { error: error2 } = await deleteStint(testUser1Client, stint2!.id);

    expect(error1).toBeNull();
    expect(error2).toBeNull();

    // Verify both deleted
    const { data: deleted1 } = await getStintById(testUser1Client, stint1!.id);
    const { data: deleted2 } = await getStintById(testUser1Client, stint2!.id);

    expect(deleted1).toBeNull();
    expect(deleted2).toBeNull();
  });
});
