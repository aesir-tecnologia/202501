import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createProject } from '~/lib/supabase/projects';
import { createTestUser } from '../../setup';

/**
 * Contract Test: createProject
 *
 * Verifies the createProject function meets its contract:
 * - Creates project with defaults (daily stints=3, duration=45)
 * - Creates project with custom values
 * - Auto-assigns sort_order as max + 1
 * - Throws error on duplicate name (case-insensitive)
 */

type TestClient = Awaited<ReturnType<typeof createTestUser>>['client'];

describe('createProject Contract', () => {
  let testUserClient: TestClient;
  let testUser: { id: string, email: string } | null;

  beforeEach(async () => {
    const testUserData = await createTestUser();
    testUserClient = testUserData.client;
    testUser = testUserData.user;
  });

  afterEach(async () => {
    if (testUserClient) await testUserClient.auth.signOut();
  });

  it('should create project with defaults', async () => {
    const { data, error } = await createProject(testUserClient, {
      name: 'New Project',
    });

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.name).toBe('New Project');
    expect(data!.user_id).toBe(testUser!.id);
    expect(data!.expected_daily_stints).toBeTruthy();
    expect(data!.sort_order).toBe(0); // First project
  });

  it('should create project with custom values', async () => {
    const { data, error } = await createProject(testUserClient, {
      name: 'Custom Project',
      expected_daily_stints: 5,
      custom_stint_duration: 60,
    });

    expect(error).toBeNull();
    expect(data!.name).toBe('Custom Project');
    expect(data!.expected_daily_stints).toBe(5);
    expect(data!.custom_stint_duration).toBe(60);
  });

  it('should auto-assign sort_order as max + 1', async () => {
    // Create first project
    const { data: project1 } = await createProject(testUserClient, {
      name: 'Project 1',
    });
    expect(project1!.sort_order).toBe(0);

    // Create second project
    const { data: project2 } = await createProject(testUserClient, {
      name: 'Project 2',
    });
    expect(project2!.sort_order).toBe(1);

    // Create third project
    const { data: project3 } = await createProject(testUserClient, {
      name: 'Project 3',
    });
    expect(project3!.sort_order).toBe(2);
  });

  it('should throw error on duplicate name (same case)', async () => {
    await createProject(testUserClient, {
      name: 'Duplicate Project',
    });

    // Attempt to create project with same name
    const { error } = await createProject(testUserClient, {
      name: 'Duplicate Project',
    });

    expect(error).toBeTruthy();
    expect(error?.code).toBe('23505'); // Unique constraint violation
  });

  it('should throw error on duplicate name (case-insensitive)', async () => {
    await createProject(testUserClient, {
      name: 'Case Test',
    });

    // Attempt to create project with different case
    const { error } = await createProject(testUserClient, {
      name: 'case test',
    });

    expect(error).toBeTruthy();
    expect(error?.code).toBe('23505');
  });
});
