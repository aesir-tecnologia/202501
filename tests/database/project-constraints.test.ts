import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { createClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database.types';
import { getTestUser, cleanupTestData } from '../setup';

/**
 * Database Constraint Tests for Project Management Feature
 *
 * Tests database-level constraints:
 * - Duplicate project names (case-insensitive)
 * - Negative or zero expected_daily_stints
 * - Negative or zero custom_stint_duration
 *
 * Prerequisites:
 * - Database migration applied with constraints
 * - Unique index on LOWER(name) per user
 * - CHECK constraints on numeric fields
 */

const _supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const _supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

type TestClient = Awaited<ReturnType<typeof getTestUser>>['client'];

describe('Project Database Constraints', () => {
  let testUserClient: TestClient;
  let _testUser: { id: string, email: string } | null;

  beforeEach(async () => {
    const testUserData = await getTestUser();
    testUserClient = testUserData.client;
    _testUser = testUserData.user;
    await cleanupTestData(testUserClient);
  });

  afterEach(async () => {
    if (testUserClient) {
      await testUserClient.auth.signOut();
    }
  });

  describe('Duplicate project names (case-insensitive)', () => {
    it('should reject duplicate project names with same case', async () => {
      // Create first project
      const { data: project1, error: error1 } = await testUserClient
        .from('projects')
        .insert({
          user_id: _testUser!.id,
          name: 'Client Alpha',
          expected_daily_stints: 3,
        })
        .select()
        .single();

      expect(error1).toBeNull();
      expect(project1).toBeTruthy();

      // Attempt to create second project with same name
      const { data: project2, error: error2 } = await testUserClient
        .from('projects')
        .insert({
          user_id: _testUser!.id,
          name: 'Client Alpha',
          expected_daily_stints: 4,
        })
        .select()
        .single();

      // Should fail with unique constraint violation (error code 23505)
      expect(error2).toBeTruthy();
      expect(error2?.code).toBe('23505');
      expect(project2).toBeNull();
    });

    it('should reject duplicate project names with different case', async () => {
      // Create first project
      const { data: project1, error: error1 } = await testUserClient
        .from('projects')
        .insert({
          user_id: _testUser!.id,
          name: 'Client Beta',
          expected_daily_stints: 3,
        })
        .select()
        .single();

      expect(error1).toBeNull();
      expect(project1).toBeTruthy();

      // Attempt to create second project with different case
      const { data: project2, error: error2 } = await testUserClient
        .from('projects')
        .insert({
          user_id: _testUser!.id,
          name: 'client beta', // lowercase
          expected_daily_stints: 4,
        })
        .select()
        .single();

      // Should fail with unique constraint violation (case-insensitive)
      expect(error2).toBeTruthy();
      expect(error2?.code).toBe('23505');
      expect(project2).toBeNull();
    });

    it('should reject duplicate project names with mixed case', async () => {
      // Create first project
      const { data: project1, error: error1 } = await testUserClient
        .from('projects')
        .insert({
          user_id: _testUser!.id,
          name: 'Client Gamma',
          expected_daily_stints: 3,
        })
        .select()
        .single();

      expect(error1).toBeNull();
      expect(project1).toBeTruthy();

      // Attempt to create second project with mixed case
      const { data: project2, error: error2 } = await testUserClient
        .from('projects')
        .insert({
          user_id: _testUser!.id,
          name: 'CLIENT GAMMA', // uppercase
          expected_daily_stints: 4,
        })
        .select()
        .single();

      // Should fail with unique constraint violation (case-insensitive)
      expect(error2).toBeTruthy();
      expect(error2?.code).toBe('23505');
      expect(project2).toBeNull();
    });
  });

  describe('Negative expected_daily_stints validation', () => {
    it('should reject negative expected_daily_stints', async () => {
      const { data, error } = await testUserClient
        .from('projects')
        .insert({
          user_id: _testUser!.id,
          name: 'Invalid Negative Stints',
          expected_daily_stints: -1,
          custom_stint_duration: 45,
        })
        .select()
        .single();

      // Should fail with CHECK constraint violation (error code 23514)
      expect(error).toBeTruthy();
      expect(error?.code).toBe('23514');
      expect(data).toBeNull();
    });
  });

  describe('Zero expected_daily_stints validation', () => {
    it('should reject zero expected_daily_stints', async () => {
      const { data, error } = await testUserClient
        .from('projects')
        .insert({
          user_id: _testUser!.id,
          name: 'Invalid Zero Stints',
          expected_daily_stints: 0,
          custom_stint_duration: 45,
        })
        .select()
        .single();

      // Should fail with CHECK constraint violation
      expect(error).toBeTruthy();
      expect(error?.code).toBe('23514');
      expect(data).toBeNull();
    });
  });

  describe('Negative custom_stint_duration validation', () => {
    it('should reject negative custom_stint_duration', async () => {
      const { data, error } = await testUserClient
        .from('projects')
        .insert({
          user_id: _testUser!.id,
          name: 'Invalid Negative Duration',
          expected_daily_stints: 3,
          custom_stint_duration: -5,
        })
        .select()
        .single();

      // Should fail with CHECK constraint violation
      expect(error).toBeTruthy();
      expect(error?.code).toBe('23514');
      expect(data).toBeNull();
    });
  });

  describe('Zero custom_stint_duration validation', () => {
    it('should reject zero custom_stint_duration', async () => {
      const { data, error } = await testUserClient
        .from('projects')
        .insert({
          user_id: _testUser!.id,
          name: 'Invalid Zero Duration',
          expected_daily_stints: 3,
          custom_stint_duration: 0,
        })
        .select()
        .single();

      // Should fail with CHECK constraint violation
      expect(error).toBeTruthy();
      expect(error?.code).toBe('23514');
      expect(data).toBeNull();
    });
  });

  describe('Valid values should pass', () => {
    it('should accept valid positive values', async () => {
      const { data, error } = await testUserClient
        .from('projects')
        .insert({
          user_id: _testUser!.id,
          name: 'Valid Project',
          expected_daily_stints: 5,
          custom_stint_duration: 60,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data!.name).toBe('Valid Project');
      expect(data!.expected_daily_stints).toBe(5);
      expect(data!.custom_stint_duration).toBe(60);
    });

    it('should accept minimum valid values (1)', async () => {
      const { data, error } = await testUserClient
        .from('projects')
        .insert({
          user_id: _testUser!.id,
          name: 'Minimum Valid Project',
          expected_daily_stints: 1,
          custom_stint_duration: 1,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data!.expected_daily_stints).toBe(1);
      expect(data!.custom_stint_duration).toBe(1);
    });
  });
});
