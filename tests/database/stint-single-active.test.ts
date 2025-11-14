import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { createClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database.types';
import { getTestUser, cleanupTestData } from '../setup';

/**
 * Database Tests for Single Active Stint Enforcement
 *
 * Tests the partial unique index that enforces only one active/paused stint per user.
 *
 * Prerequisites:
 * - Database migration 20251029223752_stint_management_core.sql applied
 * - Partial unique index: idx_stints_single_active_per_user
 */

const _supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const _supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

type TestClient = Awaited<ReturnType<typeof getTestUser>>['client'];

describe('Single Active Stint Enforcement', () => {
  let testUserClient: TestClient;
  let testProject1Id: string;
  let testProject2Id: string;
  let _testUser: { id: string, email: string } | null;

  beforeEach(async () => {
    const testUserData = await getTestUser();
    testUserClient = testUserData.client;
    _testUser = testUserData.user;
    await cleanupTestData(testUserClient);

    // Create two test projects
    const { data: project1, error: error1 } = await testUserClient
      .from('projects')
      .insert({
        user_id: _testUser!.id,
        name: 'Test Project 1',
        expected_daily_stints: 2,
      })
      .select()
      .single();

    if (error1 || !project1) {
      throw new Error(`Failed to create test project 1: ${error1?.message}`);
    }

    testProject1Id = project1.id;

    const { data: project2, error: error2 } = await testUserClient
      .from('projects')
      .insert({
        user_id: _testUser!.id,
        name: 'Test Project 2',
        expected_daily_stints: 2,
      })
      .select()
      .single();

    if (error2 || !project2) {
      throw new Error(`Failed to create test project 2: ${error2?.message}`);
    }

    testProject2Id = project2.id;
  });

  afterEach(async () => {
    if (testUserClient) {
      await testUserClient.auth.signOut();
    }
  });

  describe('Partial unique index enforcement', () => {
    it('should allow only one active stint per user', async () => {
      // Create first active stint
      const { data: stint1, error: error1 } = await testUserClient
        .from('stints')
        .insert({
          user_id: _testUser!.id,
          project_id: testProject1Id,
          planned_duration: 50,
          status: 'active',
        })
        .select()
        .single();

      expect(error1).toBeNull();
      expect(stint1).toBeTruthy();
      expect(stint1!.status).toBe('active');

      // Attempt to create second active stint (should fail)
      const { data: stint2, error: error2 } = await testUserClient
        .from('stints')
        .insert({
          user_id: _testUser!.id,
          project_id: testProject2Id,
          planned_duration: 50,
          status: 'active',
        })
        .select()
        .single();

      expect(error2).toBeTruthy();
      expect(error2?.code).toBe('23505'); // Unique constraint violation
      expect(stint2).toBeNull();
    });

    it('should allow only one paused stint per user', async () => {
      // Create first paused stint
      const { data: stint1, error: error1 } = await testUserClient
        .from('stints')
        .insert({
          user_id: _testUser!.id,
          project_id: testProject1Id,
          planned_duration: 50,
          status: 'paused',
        })
        .select()
        .single();

      expect(error1).toBeNull();
      expect(stint1).toBeTruthy();
      expect(stint1!.status).toBe('paused');

      // Attempt to create second paused stint (should fail)
      const { data: stint2, error: error2 } = await testUserClient
        .from('stints')
        .insert({
          user_id: _testUser!.id,
          project_id: testProject2Id,
          planned_duration: 50,
          status: 'paused',
        })
        .select()
        .single();

      expect(error2).toBeTruthy();
      expect(error2?.code).toBe('23505');
      expect(stint2).toBeNull();
    });

    it('should not allow active and paused stints simultaneously', async () => {
      // Create active stint
      const { data: stint1, error: error1 } = await testUserClient
        .from('stints')
        .insert({
          user_id: _testUser!.id,
          project_id: testProject1Id,
          planned_duration: 50,
          status: 'active',
        })
        .select()
        .single();

      expect(error1).toBeNull();
      expect(stint1).toBeTruthy();

      // Attempt to create paused stint (should fail)
      const { data: stint2, error: error2 } = await testUserClient
        .from('stints')
        .insert({
          user_id: _testUser!.id,
          project_id: testProject2Id,
          planned_duration: 50,
          status: 'paused',
        })
        .select()
        .single();

      expect(error2).toBeTruthy();
      expect(error2?.code).toBe('23505');
      expect(stint2).toBeNull();
    });

    it('should allow multiple completed stints', async () => {
      const now = new Date();
      const later = new Date(now.getTime() + 3600000);

      // Create first completed stint
      const { data: stint1, error: error1 } = await testUserClient
        .from('stints')
        .insert({
          user_id: _testUser!.id,
          project_id: testProject1Id,
          planned_duration: 50,
          status: 'completed',
          started_at: now.toISOString(),
          ended_at: later.toISOString(),
        })
        .select()
        .single();

      expect(error1).toBeNull();
      expect(stint1).toBeTruthy();

      // Create second completed stint (should succeed)
      const { data: stint2, error: error2 } = await testUserClient
        .from('stints')
        .insert({
          user_id: _testUser!.id,
          project_id: testProject2Id,
          planned_duration: 50,
          status: 'completed',
          started_at: now.toISOString(),
          ended_at: later.toISOString(),
        })
        .select()
        .single();

      expect(error2).toBeNull();
      expect(stint2).toBeTruthy();
    });

    it('should allow multiple interrupted stints', async () => {
      // Create first interrupted stint
      const { data: stint1, error: error1 } = await testUserClient
        .from('stints')
        .insert({
          user_id: _testUser!.id,
          project_id: testProject1Id,
          planned_duration: 50,
          status: 'interrupted',
          ended_at: new Date().toISOString(),
        })
        .select()
        .single();

      expect(error1).toBeNull();
      expect(stint1).toBeTruthy();

      // Create second interrupted stint (should succeed)
      const { data: stint2, error: error2 } = await testUserClient
        .from('stints')
        .insert({
          user_id: _testUser!.id,
          project_id: testProject2Id,
          planned_duration: 50,
          status: 'interrupted',
          ended_at: new Date().toISOString(),
        })
        .select()
        .single();

      expect(error2).toBeNull();
      expect(stint2).toBeTruthy();
    });

    it('should allow new active stint after completing previous one', async () => {
      const now = new Date();
      const later = new Date(now.getTime() + 3600000);

      // Create and complete first stint
      const { data: stint1, error: error1 } = await testUserClient
        .from('stints')
        .insert({
          user_id: _testUser!.id,
          project_id: testProject1Id,
          planned_duration: 50,
          status: 'completed',
          started_at: now.toISOString(),
          ended_at: later.toISOString(),
        })
        .select()
        .single();

      expect(error1).toBeNull();
      expect(stint1).toBeTruthy();

      // Now create new active stint (should succeed)
      const { data: stint2, error: error2 } = await testUserClient
        .from('stints')
        .insert({
          user_id: _testUser!.id,
          project_id: testProject2Id,
          planned_duration: 50,
          status: 'active',
        })
        .select()
        .single();

      expect(error2).toBeNull();
      expect(stint2).toBeTruthy();
      expect(stint2!.status).toBe('active');
    });

    it('should allow new active stint after interrupting previous one', async () => {
      // Create interrupted stint
      const { data: stint1, error: error1 } = await testUserClient
        .from('stints')
        .insert({
          user_id: _testUser!.id,
          project_id: testProject1Id,
          planned_duration: 50,
          status: 'interrupted',
          ended_at: new Date().toISOString(),
        })
        .select()
        .single();

      expect(error1).toBeNull();
      expect(stint1).toBeTruthy();

      // Now create new active stint (should succeed)
      const { data: stint2, error: error2 } = await testUserClient
        .from('stints')
        .insert({
          user_id: _testUser!.id,
          project_id: testProject2Id,
          planned_duration: 50,
          status: 'active',
        })
        .select()
        .single();

      expect(error2).toBeNull();
      expect(stint2).toBeTruthy();
      expect(stint2!.status).toBe('active');
    });
  });
});
