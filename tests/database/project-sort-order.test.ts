import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database.types';
import { getTestUser, cleanupTestData } from '../setup';

/**
 * Sort Order Tests for Projects
 *
 * Tests the sort_order column functionality:
 * - New projects get max(sort_order) + 1
 * - Reordering updates sort_order correctly
 * - Projects returned in sort_order ASC
 *
 * Prerequisites:
 * - Database migration applied (add sort_order column)
 * - Index created on (user_id, sort_order)
 */

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

type TestClient = Awaited<ReturnType<typeof getTestUser>>['client'];

describe('Project Sort Order', () => {
  let testUserClient: TestClient;
  let testUser: { id: string, email: string } | null;

  beforeEach(async () => {
    const testUserData = await getTestUser();
    testUserClient = testUserData.client;
    testUser = testUserData.user;
    await cleanupTestData(testUserClient);
  });

  afterEach(async () => {
    if (testUserClient) {
      await testUserClient.auth.signOut();
    }
  });

  describe('Auto-assignment of sort_order', () => {
    it('should assign sort_order 0 to first project', async () => {
      // Create first project
      const { data: project1 } = await testUserClient
        .from('projects')
        .insert({
          user_id: testUser!.id,
          name: 'First Project',
          expected_daily_stints: 3,
        })
        .select()
        .single();

      expect(project1).toBeTruthy();
      expect(project1!.sort_order).toBe(0);
    });

    it('should assign incremental sort_order to subsequent projects', async () => {
      // Create multiple projects
      const { data: project1 } = await testUserClient
        .from('projects')
        .insert({
          user_id: testUser!.id,
          name: 'Project 1',
          expected_daily_stints: 3,
        })
        .select()
        .single();

      const { data: project2 } = await testUserClient
        .from('projects')
        .insert({
          user_id: testUser!.id,
          name: 'Project 2',
          expected_daily_stints: 3,
        })
        .select()
        .single();

      const { data: project3 } = await testUserClient
        .from('projects')
        .insert({
          user_id: testUser!.id,
          name: 'Project 3',
          expected_daily_stints: 3,
        })
        .select()
        .single();

      expect(project1!.sort_order).toBe(0);
      expect(project2!.sort_order).toBe(1);
      expect(project3!.sort_order).toBe(2);
    });

    it('should assign sort_order independent per user', async () => {
      if (!testUser) throw new Error('Test user not created');

      // Create project for user 1
      const { data: project1 } = await testUserClient
        .from('projects')
        .insert({
          user_id: testUser.id,
          name: 'User 1 Project',
          expected_daily_stints: 3,
        })
        .select()
        .single();

      expect(project1!.sort_order).toBe(0);

      // Create second user
      const testEmail2 = `test2-${Date.now()}@example.com`;
      const testPassword2 = 'testPassword123!';

      const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
      const { data: _userData2 } = await supabase.auth.signUp({
        email: testEmail2,
        password: testPassword2,
      });

      const testUser2Client = createClient<Database>(supabaseUrl, supabaseAnonKey);
      await testUser2Client.auth.signInWithPassword({
        email: testEmail2,
        password: testPassword2,
      });

      // Create project for user 2
      const { data: project2 } = await testUser2Client
        .from('projects')
        .insert({
          user_id: _userData2!.user!.id,
          name: 'User 2 Project',
          expected_daily_stints: 3,
        })
        .select()
        .single();

      // User 2's first project should also have sort_order 0
      expect(project2!.sort_order).toBe(0);

      await testUser2Client.auth.signOut();
    });
  });

  describe('Ordering in queries', () => {
    it('should return projects ordered by sort_order ASC', async () => {
      // Create projects in specific order
      await testUserClient
        .from('projects')
        .insert([
          { user_id: testUser!.id, name: 'Alpha', expected_daily_stints: 3 },
          { user_id: testUser!.id, name: 'Beta', expected_daily_stints: 3 },
          { user_id: testUser!.id, name: 'Gamma', expected_daily_stints: 3 },
        ]);

      // Query projects ordered by sort_order
      const { data: projects } = await testUserClient
        .from('projects')
        .select('*')
        .order('sort_order', { ascending: true });

      expect(projects).toBeTruthy();
      expect(projects).toHaveLength(3);
      expect(projects![0].name).toBe('Alpha');
      expect(projects![1].name).toBe('Beta');
      expect(projects![2].name).toBe('Gamma');
      expect(projects![0].sort_order).toBe(0);
      expect(projects![1].sort_order).toBe(1);
      expect(projects![2].sort_order).toBe(2);
    });
  });

  describe('Manual reordering', () => {
    it('should allow updating sort_order manually', async () => {
      // Create three projects
      const { data: projects } = await testUserClient
        .from('projects')
        .insert([
          { user_id: testUser!.id, name: 'Project A', expected_daily_stints: 3 },
          { user_id: testUser!.id, name: 'Project B', expected_daily_stints: 3 },
          { user_id: testUser!.id, name: 'Project C', expected_daily_stints: 3 },
        ])
        .select();

      expect(projects).toHaveLength(3);

      // Reorder: Move Project C to position 0
      const projectC = projects!.find(p => p.name === 'Project C');
      const projectA = projects!.find(p => p.name === 'Project A');
      const projectB = projects!.find(p => p.name === 'Project B');

      // Update sort orders
      await testUserClient
        .from('projects')
        .update({ sort_order: 0 })
        .eq('id', projectC!.id);

      await testUserClient
        .from('projects')
        .update({ sort_order: 1 })
        .eq('id', projectA!.id);

      await testUserClient
        .from('projects')
        .update({ sort_order: 2 })
        .eq('id', projectB!.id);

      // Query ordered projects
      const { data: reordered } = await testUserClient
        .from('projects')
        .select('*')
        .order('sort_order', { ascending: true });

      expect(reordered![0].name).toBe('Project C');
      expect(reordered![1].name).toBe('Project A');
      expect(reordered![2].name).toBe('Project B');
    });

    it('should preserve sort_order after deletion', async () => {
      // Create three projects
      const { data: projects } = await testUserClient
        .from('projects')
        .insert([
          { user_id: testUser!.id, name: 'Project 1', expected_daily_stints: 3 },
          { user_id: testUser!.id, name: 'Project 2', expected_daily_stints: 3 },
          { user_id: testUser!.id, name: 'Project 3', expected_daily_stints: 3 },
        ])
        .select();

      expect(projects).toHaveLength(3);

      // Delete middle project
      const project2 = projects!.find(p => p.name === 'Project 2');
      await testUserClient
        .from('projects')
        .delete()
        .eq('id', project2!.id);

      // Query remaining projects
      const { data: remaining } = await testUserClient
        .from('projects')
        .select('*')
        .order('sort_order', { ascending: true });

      expect(remaining).toHaveLength(2);
      expect(remaining![0].name).toBe('Project 1');
      expect(remaining![0].sort_order).toBe(0);
      expect(remaining![1].name).toBe('Project 3');
      expect(remaining![1].sort_order).toBe(2); // Gap preserved

      // New project should get sort_order 3 (max + 1)
      const { data: newProject } = await testUserClient
        .from('projects')
        .insert({
          user_id: testUser!.id,
          name: 'Project 4',
          expected_daily_stints: 3,
        })
        .select()
        .single();

      expect(newProject!.sort_order).toBe(3);
    });
  });
});
