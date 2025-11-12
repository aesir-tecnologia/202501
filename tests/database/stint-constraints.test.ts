import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { createClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database.types';
import { createTestUser } from '../setup';

/**
 * Database Constraint Tests for Stint Management Feature
 *
 * Tests database-level constraints:
 * - planned_duration must be between 10-120 minutes (or NULL)
 * - notes must be <= 500 characters
 * - ended_at must be >= started_at
 * - completed stints must have ended_at
 *
 * Prerequisites:
 * - Database migration 20251029223752_stint_management_core.sql applied
 */

const _supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const _supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

type TestClient = ReturnType<typeof createClient<Database>>;

describe('Stint Database Constraints', () => {
  let testUserClient: TestClient;
  let testProjectId: string;
  let _testUser: { id: string, email: string } | null;

  beforeEach(async () => {
    const testUserData = await createTestUser();
    testUserClient = testUserData.client;
    _testUser = testUserData.user;

    // Create a test project
    const { data: project, error: projectError } = await testUserClient
      .from('projects')
      .insert({
        name: 'Test Project',
        expected_daily_stints: 2,
        custom_stint_duration: 50,
      })
      .select()
      .single();

    if (projectError || !project) {
      throw new Error(`Failed to create test project: ${projectError?.message}`);
    }

    testProjectId = project.id;
  });

  afterEach(async () => {
    if (testUserClient) {
      await testUserClient.auth.signOut();
    }
  });

  describe('planned_duration constraint', () => {
    it('should reject planned_duration less than 10 minutes', async () => {
      const { data, error } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 9,
          status: 'active',
        })
        .select()
        .single();

      expect(error).toBeTruthy();
      expect(error?.code).toBe('23514'); // CHECK constraint violation
      expect(data).toBeNull();
    });

    it('should reject planned_duration greater than 120 minutes', async () => {
      const { data, error } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 121,
          status: 'active',
        })
        .select()
        .single();

      expect(error).toBeTruthy();
      expect(error?.code).toBe('23514');
      expect(data).toBeNull();
    });

    it('should accept NULL planned_duration', async () => {
      const { data, error } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: null,
          status: 'active',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data!.planned_duration).toBeNull();
    });

    it('should accept valid planned_duration values', async () => {
      const { data: stint1, error: error1 } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 10,
          status: 'active',
        })
        .select()
        .single();

      expect(error1).toBeNull();
      expect(stint1).toBeTruthy();
      expect(stint1!.planned_duration).toBe(10);

      const { data: stint2, error: error2 } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 120,
          status: 'active',
        })
        .select()
        .single();

      expect(error2).toBeNull();
      expect(stint2).toBeTruthy();
      expect(stint2!.planned_duration).toBe(120);

      const { data: stint3, error: error3 } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'active',
        })
        .select()
        .single();

      expect(error3).toBeNull();
      expect(stint3).toBeTruthy();
      expect(stint3!.planned_duration).toBe(50);
    });
  });

  describe('notes constraint', () => {
    it('should reject notes longer than 500 characters', async () => {
      const longNotes = 'a'.repeat(501);
      const { data, error } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'active',
          notes: longNotes,
        })
        .select()
        .single();

      expect(error).toBeTruthy();
      expect(error?.code).toBe('23514');
      expect(data).toBeNull();
    });

    it('should accept notes exactly 500 characters', async () => {
      const notes = 'a'.repeat(500);
      const { data, error } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'active',
          notes,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data!.notes).toBe(notes);
    });

    it('should accept NULL notes', async () => {
      const { data, error } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'active',
          notes: null,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data!.notes).toBeNull();
    });

    it('should accept empty string notes', async () => {
      const { data, error } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'active',
          notes: '',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data!.notes).toBe('');
    });
  });

  describe('ended_at constraint', () => {
    it('should reject ended_at before started_at', async () => {
      const startedAt = new Date();
      const endedAt = new Date(startedAt.getTime() - 1000); // 1 second before start

      const { data, error } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'completed',
          started_at: startedAt.toISOString(),
          ended_at: endedAt.toISOString(),
        })
        .select()
        .single();

      expect(error).toBeTruthy();
      expect(error?.code).toBe('23514');
      expect(data).toBeNull();
    });

    it('should accept ended_at equal to started_at', async () => {
      const now = new Date();

      const { data, error } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'completed',
          started_at: now.toISOString(),
          ended_at: now.toISOString(),
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });

    it('should accept ended_at after started_at', async () => {
      const startedAt = new Date();
      const endedAt = new Date(startedAt.getTime() + 3600000); // 1 hour later

      const { data, error } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'completed',
          started_at: startedAt.toISOString(),
          ended_at: endedAt.toISOString(),
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });
  });

  describe('completed status constraint', () => {
    it('should reject completed stint without ended_at', async () => {
      const { data, error } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'completed',
          ended_at: null,
        })
        .select()
        .single();

      expect(error).toBeTruthy();
      expect(error?.code).toBe('23514');
      expect(data).toBeNull();
    });

    it('should accept active stint without ended_at', async () => {
      const { data, error } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'active',
          ended_at: null,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data!.status).toBe('active');
      expect(data!.ended_at).toBeNull();
    });

    it('should accept paused stint without ended_at', async () => {
      const { data, error } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'paused',
          ended_at: null,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data!.status).toBe('paused');
      expect(data!.ended_at).toBeNull();
    });

    it('should accept completed stint with ended_at', async () => {
      const startedAt = new Date();
      const endedAt = new Date(startedAt.getTime() + 3600000);

      const { data, error } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'completed',
          started_at: startedAt.toISOString(),
          ended_at: endedAt.toISOString(),
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data!.status).toBe('completed');
      expect(data!.ended_at).toBeTruthy();
    });
  });
});
