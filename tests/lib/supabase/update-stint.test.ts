import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database.types';
import { updateStint } from '~/lib/supabase/stints';
import { getTestUser, cleanupTestData } from '../../setup';

/**
 * Contract Test: updateStint
 *
 * Verifies the updateStint function meets its contract:
 * - Updates stint fields successfully
 * - Verifies updated_at trigger updates timestamp
 * - RLS prevents updating other users' stints
 * - Error when stint not found
 */

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

type TestClient = ReturnType<typeof createClient<Database>>;

describe('updateStint Contract', () => {
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

  it('should update stint notes successfully', async () => {
    const { data, error } = await updateStint(testUser1Client, stintId, {
      notes: 'Updated notes',
    });

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.notes).toBe('Updated notes');
    expect(data!.id).toBe(stintId);
  });

  it('should update ended_at and mark as completed', async () => {
    const endedAt = new Date();

    const { data, error } = await updateStint(testUser1Client, stintId, {
      ended_at: endedAt.toISOString(),
      actual_duration: 2700,
      status: 'completed',
      completion_type: 'manual',
    });

    expect(error).toBeNull();
    expect(new Date(data!.ended_at!).getTime()).toBe(endedAt.getTime());
    expect(data!.actual_duration).toBe(2700);
    expect(data!.status).toBe('completed');
    expect(data!.completion_type).toBe('manual');
  });

  it('should update multiple fields at once', async () => {
    const endedAt = new Date();

    const { data } = await updateStint(testUser1Client, stintId, {
      ended_at: endedAt.toISOString(),
      actual_duration: 1800,
      notes: 'Completed session',
      status: 'completed',
      completion_type: 'auto',
    });

    expect(new Date(data!.ended_at!).getTime()).toBe(endedAt.getTime());
    expect(data!.actual_duration).toBe(1800);
    expect(data!.notes).toBe('Completed session');
    expect(data!.status).toBe('completed');
    expect(data!.completion_type).toBe('auto');
  });

  it('should verify updated_at trigger updates timestamp', async () => {
    // Get original updated_at
    const { data: original } = await testUser1Client
      .from('stints')
      .select('*')
      .eq('id', stintId)
      .single();

    const originalUpdatedAt = original!.updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 100));

    // Update the stint
    const { data } = await updateStint(testUser1Client, stintId, {
      notes: 'Trigger test',
    });

    // updated_at should be different (newer)
    expect(data!.updated_at).not.toBe(originalUpdatedAt);
    if (data!.updated_at && originalUpdatedAt) {
      expect(new Date(data!.updated_at).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime(),
      );
    }
  });

  it('should prevent updating other users\' stints (RLS)', async () => {
    // User 2 tries to update User 1's stint
    const { data, error } = await updateStint(testUser2Client, stintId, {
      notes: 'Hacked notes',
    });

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  it('should error when stint not found', async () => {
    const fakeStintId = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await updateStint(testUser1Client, fakeStintId, {
      notes: 'Should fail',
    });

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  it('should error if user not authenticated', async () => {
    const unauthClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

    const { data, error } = await updateStint(unauthClient, stintId, {
      notes: 'Should fail',
    });

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  it('should allow clearing notes by setting to null', async () => {
    // First set notes
    await updateStint(testUser1Client, stintId, {
      notes: 'Some notes',
    });

    // Then clear notes
    const { data } = await updateStint(testUser1Client, stintId, {
      notes: null,
    });

    expect(data!.notes).toBeNull();
  });

  it('should preserve unchanged fields', async () => {
    const startedAt = new Date();

    // Create stint with specific values
    const { data: newStint } = await testUser1Client
      .from('stints')
      .insert({
        project_id: projectId,
        started_at: startedAt.toISOString(),
        notes: 'Original notes',
        user_id: testUser1!.id,
      })
      .select()
      .single();

    // Update only one field
    const { data } = await updateStint(testUser1Client, newStint!.id, {
      status: 'paused',
    });

    // Other fields should remain unchanged
    expect(new Date(data!.started_at).getTime()).toBe(startedAt.getTime());
    expect(data!.notes).toBe('Original notes');
    expect(data!.status).toBe('paused');
  });
});
