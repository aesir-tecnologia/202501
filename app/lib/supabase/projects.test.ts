/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { TypedSupabaseClient } from '~/utils/supabase';
import type { CreateProjectPayload } from './projects';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  updateProjectSortOrder,
  hasActiveStint,
  archiveProject,
  unarchiveProject,
  permanentlyDeleteProject,
} from './projects';
import {
  getServiceClient,
  getUnauthenticatedClient,
  getAuthenticatedClient,
  createTestUser,
  deleteTestUser,
  cleanupTestData,
  createTestProject,
  createActiveStint,
  createCompletedStint,
} from './test-utils';

describe('projects.ts - Integration Tests', () => {
  let serviceClient: TypedSupabaseClient;
  let unauthenticatedClient: TypedSupabaseClient;
  let authenticatedClient: TypedSupabaseClient;
  let testUserId: string;
  let testUserEmail: string;

  beforeAll(async () => {
    testUserEmail = `test-projects-${Date.now()}@integration.test`;
    serviceClient = getServiceClient();
    testUserId = await createTestUser(serviceClient, testUserEmail);
    unauthenticatedClient = getUnauthenticatedClient();
    authenticatedClient = await getAuthenticatedClient(testUserEmail);
  });

  beforeEach(async () => {
    await cleanupTestData(serviceClient, testUserId);
  });

  afterAll(async () => {
    await cleanupTestData(serviceClient, testUserId);
    await deleteTestUser(serviceClient, testUserId);
  });

  describe('listProjects', () => {
    it('should return empty array when no projects exist', async () => {
      const result = await listProjects(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });

    it('should return projects ordered by sort_order', async () => {
      await createTestProject(serviceClient, testUserId, { name: 'Project B', sort_order: 2 });
      await createTestProject(serviceClient, testUserId, { name: 'Project A', sort_order: 1 });
      await createTestProject(serviceClient, testUserId, { name: 'Project C', sort_order: 3 });

      const result = await listProjects(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(3);
      expect(result.data![0]!.name).toBe('Project A');
      expect(result.data![1]!.name).toBe('Project B');
      expect(result.data![2]!.name).toBe('Project C');
    });

    it('should filter out archived projects by default', async () => {
      await createTestProject(serviceClient, testUserId, { name: 'Active Project' });
      await createTestProject(serviceClient, testUserId, {
        name: 'Archived Project',
        archived_at: new Date().toISOString(),
      });

      const result = await listProjects(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data![0]!.name).toBe('Active Project');
    });

    it('should include archived projects when options.archived is true', async () => {
      await createTestProject(serviceClient, testUserId, { name: 'Active Project' });
      await createTestProject(serviceClient, testUserId, {
        name: 'Archived Project',
        archived_at: new Date().toISOString(),
      });

      const result = await listProjects(authenticatedClient, { archived: true });

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data![0]!.name).toBe('Archived Project');
    });

    it('should include inactive projects when options.includeInactive is true', async () => {
      await createTestProject(serviceClient, testUserId, { name: 'Active Project', is_active: true });
      await createTestProject(serviceClient, testUserId, { name: 'Inactive Project', is_active: false });

      const resultWithoutInactive = await listProjects(authenticatedClient);
      expect(resultWithoutInactive.data).toHaveLength(1);

      const resultWithInactive = await listProjects(authenticatedClient, { includeInactive: true });
      expect(resultWithInactive.data).toHaveLength(2);
    });

    it('should return auth error when user is not authenticated', async () => {
      const result = await listProjects(unauthenticatedClient);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('getProject', () => {
    it('should return project when found', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'Test Project' });

      const result = await getProject(authenticatedClient, project.id);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data!.id).toBe(project.id);
      expect(result.data!.name).toBe('Test Project');
    });

    it('should return null when project does not exist', async () => {
      const result = await getProject(authenticatedClient, '00000000-0000-0000-0000-000000000000');

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it('should return auth error when user is not authenticated', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'Test Project' });

      const result = await getProject(unauthenticatedClient, project.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('createProject', () => {
    it('should create project with valid payload', async () => {
      const payload: CreateProjectPayload = {
        name: 'New Project',
        expected_daily_stints: 3,
        custom_stint_duration: 45,
      };

      const result = await createProject(authenticatedClient, payload);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data!.name).toBe('New Project');
      expect(result.data!.expected_daily_stints).toBe(3);
      expect(result.data!.custom_stint_duration).toBe(45);
      expect(result.data!.user_id).toBe(testUserId);
    });

    it('should auto-generate id and timestamps', async () => {
      const result = await createProject(authenticatedClient, { name: 'Auto ID Project' });

      expect(result.error).toBeNull();
      expect(result.data!.id).toBeDefined();
      expect(result.data!.id.length).toBe(36);
      expect(result.data!.created_at).toBeDefined();
      expect(result.data!.updated_at).toBeDefined();
    });

    it('should return error for duplicate project name', async () => {
      await createProject(authenticatedClient, { name: 'Duplicate Name' });

      const result = await createProject(authenticatedClient, { name: 'Duplicate Name' });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('already exists');
    });

    it('should return auth error when user is not authenticated', async () => {
      const result = await createProject(unauthenticatedClient, { name: 'Unauth Project' });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('updateProject', () => {
    it('should update project name', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'Original Name' });

      const result = await updateProject(authenticatedClient, project.id, { name: 'Updated Name' });

      expect(result.error).toBeNull();
      expect(result.data!.name).toBe('Updated Name');
    });

    it('should update multiple fields at once', async () => {
      const project = await createTestProject(serviceClient, testUserId, {
        name: 'Original',
        is_active: true,
        color_tag: null,
      });

      const result = await updateProject(authenticatedClient, project.id, {
        name: 'Updated',
        is_active: false,
        color_tag: 'red',
      });

      expect(result.error).toBeNull();
      expect(result.data!.name).toBe('Updated');
      expect(result.data!.is_active).toBe(false);
      expect(result.data!.color_tag).toBe('red');
    });

    it('should return error for duplicate project name', async () => {
      await createTestProject(serviceClient, testUserId, { name: 'Existing Name' });
      const project = await createTestProject(serviceClient, testUserId, { name: 'Other Name' });

      const result = await updateProject(authenticatedClient, project.id, { name: 'Existing Name' });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('already exists');
    });

    it('should return auth error when user is not authenticated', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'Test' });

      const result = await updateProject(unauthenticatedClient, project.id, { name: 'Updated' });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });

    it('should return error when deactivating project with active stint', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'Active Stint', is_active: true });
      await createActiveStint(serviceClient, project.id, testUserId);

      const result = await updateProject(authenticatedClient, project.id, { is_active: false });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('Cannot deactivate project while a stint is running');
    });

    it('should allow deactivating project without active stint', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'No Stint', is_active: true });

      const result = await updateProject(authenticatedClient, project.id, { is_active: false });

      expect(result.error).toBeNull();
      expect(result.data!.is_active).toBe(false);
    });

    it('should allow deactivating project with only completed stints', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'Completed Stint', is_active: true });
      await createCompletedStint(serviceClient, project.id, testUserId);

      const result = await updateProject(authenticatedClient, project.id, { is_active: false });

      expect(result.error).toBeNull();
      expect(result.data!.is_active).toBe(false);
    });
  });

  describe('deleteProject', () => {
    it('should delete project without active stints', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'To Delete' });

      const result = await deleteProject(authenticatedClient, project.id);

      expect(result.error).toBeNull();

      const checkResult = await getProject(authenticatedClient, project.id);
      expect(checkResult.data).toBeNull();
    });

    it('should cascade delete associated stints', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'With Stints' });
      await createCompletedStint(serviceClient, project.id, testUserId);

      const result = await deleteProject(authenticatedClient, project.id);

      expect(result.error).toBeNull();

      const { data: stints } = await serviceClient
        .from('stints')
        .select('*')
        .eq('project_id', project.id);
      expect(stints).toHaveLength(0);
    });

    it('should return error when project has active stint', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'Active Stint' });
      await createActiveStint(serviceClient, project.id, testUserId);

      const result = await deleteProject(authenticatedClient, project.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('active stint');
    });

    it('should return error when project not found', async () => {
      const result = await deleteProject(authenticatedClient, '00000000-0000-0000-0000-000000000000');

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('not found');
    });

    it('should return auth error when user is not authenticated', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'Test' });

      const result = await deleteProject(unauthenticatedClient, project.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('updateProjectSortOrder', () => {
    it('should update sort order for multiple projects', async () => {
      const project1 = await createTestProject(serviceClient, testUserId, { name: 'P1', sort_order: 1 });
      const project2 = await createTestProject(serviceClient, testUserId, { name: 'P2', sort_order: 2 });
      const project3 = await createTestProject(serviceClient, testUserId, { name: 'P3', sort_order: 3 });

      const result = await updateProjectSortOrder(authenticatedClient, [
        { id: project1.id, sortOrder: 3 },
        { id: project2.id, sortOrder: 1 },
        { id: project3.id, sortOrder: 2 },
      ]);

      expect(result.error).toBeNull();

      const listResult = await listProjects(authenticatedClient, { includeInactive: true });
      expect(listResult.data![0]!.name).toBe('P2');
      expect(listResult.data![1]!.name).toBe('P3');
      expect(listResult.data![2]!.name).toBe('P1');
    });

    it('should return error when some projects not found', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'P1', sort_order: 1 });

      const result = await updateProjectSortOrder(authenticatedClient, [
        { id: project.id, sortOrder: 2 },
        { id: '00000000-0000-0000-0000-000000000000', sortOrder: 1 },
      ]);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('could not be updated');
    });

    it('should return auth error when user is not authenticated', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'P1' });

      const result = await updateProjectSortOrder(unauthenticatedClient, [
        { id: project.id, sortOrder: 1 },
      ]);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('hasActiveStint', () => {
    it('should return true when project has active stint', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'Active' });
      await createActiveStint(serviceClient, project.id, testUserId);

      const result = await hasActiveStint(authenticatedClient, project.id);

      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
    });

    it('should return false when project has no stints', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'No Stints' });

      const result = await hasActiveStint(authenticatedClient, project.id);

      expect(result.error).toBeNull();
      expect(result.data).toBe(false);
    });

    it('should return false when project only has completed stints', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'Completed' });
      await createCompletedStint(serviceClient, project.id, testUserId);

      const result = await hasActiveStint(authenticatedClient, project.id);

      expect(result.error).toBeNull();
      expect(result.data).toBe(false);
    });

    it('should return auth error when user is not authenticated', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'Test' });

      const result = await hasActiveStint(unauthenticatedClient, project.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('archiveProject', () => {
    it('should archive an active project', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'To Archive' });

      const result = await archiveProject(authenticatedClient, project.id);

      expect(result.error).toBeNull();
      expect(result.data!.archived_at).not.toBeNull();
    });

    it('should set archived_at timestamp', async () => {
      const beforeArchive = new Date();
      const project = await createTestProject(serviceClient, testUserId, { name: 'Timestamp Test' });

      const result = await archiveProject(authenticatedClient, project.id);
      const afterArchive = new Date();

      expect(result.error).toBeNull();
      const archivedAt = new Date(result.data!.archived_at!);
      expect(archivedAt.getTime()).toBeGreaterThanOrEqual(beforeArchive.getTime());
      expect(archivedAt.getTime()).toBeLessThanOrEqual(afterArchive.getTime());
    });

    it('should return error when project is already archived', async () => {
      const project = await createTestProject(serviceClient, testUserId, {
        name: 'Already Archived',
        archived_at: new Date().toISOString(),
      });

      const result = await archiveProject(authenticatedClient, project.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('already archived');
    });

    it('should return error when project has active stint', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'Active Stint' });
      await createActiveStint(serviceClient, project.id, testUserId);

      const result = await archiveProject(authenticatedClient, project.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('active stint');
    });

    it('should return error when project not found', async () => {
      const result = await archiveProject(authenticatedClient, '00000000-0000-0000-0000-000000000000');

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('not found');
    });

    it('should return auth error when user is not authenticated', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'Test' });

      const result = await archiveProject(unauthenticatedClient, project.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('unarchiveProject', () => {
    it('should unarchive an archived project', async () => {
      const project = await createTestProject(serviceClient, testUserId, {
        name: 'To Unarchive',
        archived_at: new Date().toISOString(),
      });

      const result = await unarchiveProject(authenticatedClient, project.id);

      expect(result.error).toBeNull();
      expect(result.data!.archived_at).toBeNull();
    });

    it('should clear archived_at timestamp', async () => {
      const project = await createTestProject(serviceClient, testUserId, {
        name: 'Clear Timestamp',
        archived_at: new Date().toISOString(),
      });

      const result = await unarchiveProject(authenticatedClient, project.id);

      expect(result.error).toBeNull();
      expect(result.data!.archived_at).toBeNull();
    });

    it('should return error when project is not archived', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'Not Archived' });

      const result = await unarchiveProject(authenticatedClient, project.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('not archived');
    });

    it('should return error when project not found', async () => {
      const result = await unarchiveProject(authenticatedClient, '00000000-0000-0000-0000-000000000000');

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('not found');
    });

    it('should return auth error when user is not authenticated', async () => {
      const project = await createTestProject(serviceClient, testUserId, {
        name: 'Test',
        archived_at: new Date().toISOString(),
      });

      const result = await unarchiveProject(unauthenticatedClient, project.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('permanentlyDeleteProject', () => {
    it('should permanently delete an archived project', async () => {
      const project = await createTestProject(serviceClient, testUserId, {
        name: 'To Permanently Delete',
        archived_at: new Date().toISOString(),
      });

      const result = await permanentlyDeleteProject(authenticatedClient, project.id);

      expect(result.error).toBeNull();

      const checkResult = await serviceClient
        .from('projects')
        .select('*')
        .eq('id', project.id)
        .maybeSingle();
      expect(checkResult.data).toBeNull();
    });

    it('should return error when project is not archived', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'Not Archived' });

      const result = await permanentlyDeleteProject(authenticatedClient, project.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('archived');
    });

    it('should return error when project not found', async () => {
      const result = await permanentlyDeleteProject(authenticatedClient, '00000000-0000-0000-0000-000000000000');

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('not found');
    });

    it('should return auth error when user is not authenticated', async () => {
      const project = await createTestProject(serviceClient, testUserId, {
        name: 'Test',
        archived_at: new Date().toISOString(),
      });

      const result = await permanentlyDeleteProject(unauthenticatedClient, project.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });
});
