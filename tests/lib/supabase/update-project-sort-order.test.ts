import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { createClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database.types';
import { createProject, updateProjectSortOrder } from '~/lib/supabase/projects';
import { getTestUser, cleanupTestData } from '../../setup';

/**
 * Contract Test: updateProjectSortOrder
 *
 * Verifies the updateProjectSortOrder function meets its contract:
 * - Batch updates sort_order for multiple projects
 * - Throws error if any project not owned by user
 * - Rollback if any update fails
 */

type TestClient = ReturnType<typeof createClient<Database>>;

describe('updateProjectSortOrder Contract', () => {
  let testUser1Client: TestClient;
  let testUser2Client: TestClient;

  beforeEach(async () => {
    const testUser1Data = await getTestUser(1);
    testUser1Client = testUser1Data.client;
    await cleanupTestData(testUser1Client);

    const testUser2Data = await getTestUser(2);
    testUser2Client = testUser2Data.client;
    await cleanupTestData(testUser2Client);
  });

  afterEach(async () => {
    if (testUser1Client) await testUser1Client.auth.signOut();
    if (testUser2Client) await testUser2Client.auth.signOut();
  });

  it('should batch update sort_order for multiple projects', async () => {
    const { data: p1 } = await createProject(testUser1Client, { name: 'P1' });
    const { data: p2 } = await createProject(testUser1Client, { name: 'P2' });
    const { data: p3 } = await createProject(testUser1Client, { name: 'P3' });

    const updates = [
      { id: p2!.id, sortOrder: 0 },
      { id: p3!.id, sortOrder: 1 },
      { id: p1!.id, sortOrder: 2 },
    ];

    const { error } = await updateProjectSortOrder(testUser1Client, updates);

    expect(error).toBeNull();

    // Verify order
    const { data: projects } = await testUser1Client
      .from('projects')
      .select()
      .order('sort_order', { ascending: true });

    expect(projects![0].id).toBe(p2!.id);
    expect(projects![1].id).toBe(p3!.id);
    expect(projects![2].id).toBe(p1!.id);
  });

  it('should throw error if any project not owned by user', async () => {
    const { data: user2Project } = await createProject(testUser2Client, { name: 'U2P' });

    const updates = [
      { id: user2Project!.id, sortOrder: 0 },
    ];

    const { error } = await updateProjectSortOrder(testUser1Client, updates);
    expect(error).toBeTruthy();
  });
});
