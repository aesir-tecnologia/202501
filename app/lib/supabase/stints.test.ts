/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { TypedSupabaseClient } from '~/utils/supabase';
import type { ProjectRow } from './projects';
import {
  listStints,
  getStintById,
  getActiveStint,
  getPausedStint,
  createStint,
  updateStint,
  deleteStint,
  getUserVersion,
  pauseStint,
  resumeStint,
  completeStint,
  startStint,
  syncStintCheck,
} from './stints';
import {
  getServiceClient,
  getUnauthenticatedClient,
  getAuthenticatedClient,
  createTestUser,
  deleteTestUser,
  cleanupTestData,
  createTestProject,
  createActiveStint,
  createPausedStint,
  createCompletedStint,
} from './test-utils';

describe('stints.ts - Integration Tests', () => {
  let serviceClient: TypedSupabaseClient;
  let unauthenticatedClient: TypedSupabaseClient;
  let authenticatedClient: TypedSupabaseClient;
  let testUserId: string;
  let testUserEmail: string;
  let testProject: ProjectRow;

  beforeAll(async () => {
    testUserEmail = `test-stints-${Date.now()}@integration.test`;
    serviceClient = getServiceClient();
    testUserId = await createTestUser(serviceClient, testUserEmail);
    unauthenticatedClient = getUnauthenticatedClient();
    authenticatedClient = await getAuthenticatedClient(testUserEmail);
  });

  beforeEach(async () => {
    await cleanupTestData(serviceClient, testUserId);
    testProject = await createTestProject(serviceClient, testUserId);
  });

  afterAll(async () => {
    await cleanupTestData(serviceClient, testUserId);
    await deleteTestUser(serviceClient, testUserId);
  });

  describe('listStints', () => {
    it('should return empty array when no stints exist', async () => {
      const result = await listStints(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });

    it('should return stints ordered by started_at DESC', async () => {
      const older = new Date(Date.now() - 60 * 60 * 1000);
      const newer = new Date(Date.now() - 30 * 60 * 1000);

      await createCompletedStint(serviceClient, testProject.id, testUserId, {
        started_at: older.toISOString(),
        ended_at: new Date(older.getTime() + 25 * 60 * 1000).toISOString(),
      });
      await createCompletedStint(serviceClient, testProject.id, testUserId, {
        started_at: newer.toISOString(),
        ended_at: new Date(newer.getTime() + 25 * 60 * 1000).toISOString(),
      });

      const result = await listStints(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      const stints = result.data!;
      expect(new Date(stints[0]!.started_at!).getTime()).toBeGreaterThan(
        new Date(stints[1]!.started_at!).getTime(),
      );
    });

    it('should filter by projectId', async () => {
      const otherProject = await createTestProject(serviceClient, testUserId, {
        name: 'Other Project',
      });
      await createCompletedStint(serviceClient, testProject.id, testUserId);
      await createCompletedStint(serviceClient, otherProject.id, testUserId);

      const result = await listStints(authenticatedClient, { projectId: testProject.id });

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data![0]!.project_id).toBe(testProject.id);
    });

    it('should filter active/paused stints when activeOnly is true', async () => {
      await createActiveStint(serviceClient, testProject.id, testUserId);
      const otherProject = await createTestProject(serviceClient, testUserId, {
        name: 'Other Project',
      });
      await createCompletedStint(serviceClient, otherProject.id, testUserId);

      const result = await listStints(authenticatedClient, { activeOnly: true });

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data![0]!.status).toBe('active');
    });

    it('should return auth error when user is not authenticated', async () => {
      const result = await listStints(unauthenticatedClient);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('getStintById', () => {
    it('should return stint when found', async () => {
      const stint = await createActiveStint(serviceClient, testProject.id, testUserId);

      const result = await getStintById(authenticatedClient, stint.id);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data!.id).toBe(stint.id);
    });

    it('should return null when stint does not exist', async () => {
      const result = await getStintById(authenticatedClient, '00000000-0000-0000-0000-000000000000');

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it('should return auth error when user is not authenticated', async () => {
      const stint = await createActiveStint(serviceClient, testProject.id, testUserId);

      const result = await getStintById(unauthenticatedClient, stint.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('getActiveStint', () => {
    it('should return active stint when exists', async () => {
      await createActiveStint(serviceClient, testProject.id, testUserId);

      const result = await getActiveStint(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data!.status).toBe('active');
    });

    it('should return null when only paused stint exists (active only)', async () => {
      await createPausedStint(serviceClient, testProject.id, testUserId);

      const result = await getActiveStint(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it('should return null when no active stint', async () => {
      await createCompletedStint(serviceClient, testProject.id, testUserId);

      const result = await getActiveStint(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it('should return auth error when user is not authenticated', async () => {
      const result = await getActiveStint(unauthenticatedClient);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('getPausedStint', () => {
    it('should return paused stint when exists', async () => {
      await createPausedStint(serviceClient, testProject.id, testUserId);

      const result = await getPausedStint(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data!.status).toBe('paused');
    });

    it('should return null when only active stint exists (paused only)', async () => {
      await createActiveStint(serviceClient, testProject.id, testUserId);

      const result = await getPausedStint(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it('should return null when no paused stint', async () => {
      await createCompletedStint(serviceClient, testProject.id, testUserId);

      const result = await getPausedStint(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it('should return auth error when user is not authenticated', async () => {
      const result = await getPausedStint(unauthenticatedClient);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('createStint', () => {
    it('should create stint with valid payload', async () => {
      const result = await createStint(authenticatedClient, {
        project_id: testProject.id,
        planned_duration: 30,
        status: 'active',
        started_at: new Date().toISOString(),
      });

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data!.planned_duration).toBe(30);
      expect(result.data!.status).toBe('active');
    });

    it('should auto-generate id and timestamps', async () => {
      const result = await createStint(authenticatedClient, {
        project_id: testProject.id,
        planned_duration: 25,
        status: 'active',
        started_at: new Date().toISOString(),
      });

      expect(result.error).toBeNull();
      expect(result.data!.id).toBeDefined();
      expect(result.data!.id.length).toBe(36);
      expect(result.data!.created_at).toBeDefined();
    });

    it('should return auth error when user is not authenticated', async () => {
      const result = await createStint(unauthenticatedClient, {
        project_id: testProject.id,
        planned_duration: 25,
        status: 'active',
        started_at: new Date().toISOString(),
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('updateStint', () => {
    it('should update stint fields', async () => {
      const stint = await createActiveStint(serviceClient, testProject.id, testUserId);

      const result = await updateStint(authenticatedClient, stint.id, {
        notes: 'Updated notes',
      });

      expect(result.error).toBeNull();
      expect(result.data!.notes).toBe('Updated notes');
    });

    it('should return error when stint not found', async () => {
      const result = await updateStint(authenticatedClient, '00000000-0000-0000-0000-000000000000', {
        notes: 'Test',
      });

      expect(result.error).not.toBeNull();
    });

    it('should return auth error when user is not authenticated', async () => {
      const stint = await createActiveStint(serviceClient, testProject.id, testUserId);

      const result = await updateStint(unauthenticatedClient, stint.id, {
        notes: 'Test',
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('deleteStint', () => {
    it('should delete stint successfully', async () => {
      const stint = await createActiveStint(serviceClient, testProject.id, testUserId);

      const result = await deleteStint(authenticatedClient, stint.id);

      expect(result.error).toBeNull();

      const checkResult = await getStintById(authenticatedClient, stint.id);
      expect(checkResult.data).toBeNull();
    });

    it('should return error when stint not found', async () => {
      const result = await deleteStint(authenticatedClient, '00000000-0000-0000-0000-000000000000');

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('not found');
    });

    it('should return auth error when user is not authenticated', async () => {
      const stint = await createActiveStint(serviceClient, testProject.id, testUserId);

      const result = await deleteStint(unauthenticatedClient, stint.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('getUserVersion', () => {
    it('should return user version number', async () => {
      const result = await getUserVersion(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('number');
    });

    it('should return auth error when user is not authenticated', async () => {
      const result = await getUserVersion(unauthenticatedClient);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('pauseStint', () => {
    it('should pause active stint and set paused_at and status', async () => {
      const stint = await createActiveStint(serviceClient, testProject.id, testUserId);

      const beforePause = new Date();
      const result = await pauseStint(authenticatedClient, stint.id);
      const afterPause = new Date();

      expect(result.error).toBeNull();
      expect(result.data!.status).toBe('paused');
      expect(result.data!.paused_at).not.toBeNull();

      const pausedAt = new Date(result.data!.paused_at!);
      expect(pausedAt.getTime()).toBeGreaterThanOrEqual(beforePause.getTime());
      expect(pausedAt.getTime()).toBeLessThanOrEqual(afterPause.getTime());
    });

    it('should return error when stint not active', async () => {
      const stint = await createPausedStint(serviceClient, testProject.id, testUserId);

      const result = await pauseStint(authenticatedClient, stint.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('not active');
    });

    it('should return error when stint is completed', async () => {
      const stint = await createCompletedStint(serviceClient, testProject.id, testUserId);

      const result = await pauseStint(authenticatedClient, stint.id);

      expect(result.error).not.toBeNull();
    });

    it('should return error when stint not found', async () => {
      const result = await pauseStint(authenticatedClient, '00000000-0000-0000-0000-000000000000');

      expect(result.error).not.toBeNull();
    });

    it('should return auth error when user is not authenticated', async () => {
      const stint = await createActiveStint(serviceClient, testProject.id, testUserId);

      const result = await pauseStint(unauthenticatedClient, stint.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });

    it('should return error when user already has a paused stint', async () => {
      // Create a paused stint on project A
      await createPausedStint(serviceClient, testProject.id, testUserId);

      // Create an active stint on project B
      const otherProject = await createTestProject(serviceClient, testUserId, {
        name: 'Other Project',
      });
      const activeStint = await createActiveStint(serviceClient, otherProject.id, testUserId);

      // Try to pause the active stint (should fail because we already have a paused stint)
      const result = await pauseStint(authenticatedClient, activeStint.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('already have a paused stint');
    });
  });

  describe('resumeStint', () => {
    it('should resume paused stint and accumulate paused_duration', async () => {
      const stint = await createPausedStint(serviceClient, testProject.id, testUserId, {
        paused_duration: 60,
        paused_at: new Date(Date.now() - 5000).toISOString(),
      });

      const result = await resumeStint(authenticatedClient, stint.id);

      expect(result.error).toBeNull();
      expect(result.data!.status).toBe('active');
      expect(result.data!.paused_at).toBeNull();
      expect(result.data!.paused_duration).toBeGreaterThanOrEqual(65);
    });

    it('should return error when stint not paused', async () => {
      const stint = await createActiveStint(serviceClient, testProject.id, testUserId);

      const result = await resumeStint(authenticatedClient, stint.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('not paused');
    });

    it('should return error when stint is completed', async () => {
      const stint = await createCompletedStint(serviceClient, testProject.id, testUserId);

      const result = await resumeStint(authenticatedClient, stint.id);

      expect(result.error).not.toBeNull();
    });

    it('should return error when stint not found', async () => {
      const result = await resumeStint(authenticatedClient, '00000000-0000-0000-0000-000000000000');

      expect(result.error).not.toBeNull();
    });

    it('should return auth error when user is not authenticated', async () => {
      const stint = await createPausedStint(serviceClient, testProject.id, testUserId);

      const result = await resumeStint(unauthenticatedClient, stint.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });

    it('should return error when trying to resume while another stint is active', async () => {
      // Create a paused stint on project A
      const pausedStint = await createPausedStint(serviceClient, testProject.id, testUserId);

      // Create an active stint on project B
      const otherProject = await createTestProject(serviceClient, testUserId, {
        name: 'Other Project',
      });
      await createActiveStint(serviceClient, otherProject.id, testUserId);

      // Try to resume the paused stint (should fail because there's already an active stint)
      const result = await resumeStint(authenticatedClient, pausedStint.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('Cannot resume while another stint is active');
    });
  });

  describe('completeStint', () => {
    it('should complete active stint with ended_at and actual_duration', async () => {
      const stint = await createActiveStint(serviceClient, testProject.id, testUserId);

      const result = await completeStint(authenticatedClient, stint.id, 'manual');

      expect(result.error).toBeNull();
      expect(result.data!.status).toBe('completed');
      expect(result.data!.ended_at).not.toBeNull();
      expect(result.data!.actual_duration).not.toBeNull();
      expect(result.data!.completion_type).toBe('manual');
    });

    it('should complete paused stint correctly', async () => {
      const stint = await createPausedStint(serviceClient, testProject.id, testUserId);

      const result = await completeStint(authenticatedClient, stint.id, 'manual');

      expect(result.error).toBeNull();
      expect(result.data!.status).toBe('completed');
      expect(result.data!.ended_at).not.toBeNull();
    });

    it('should set completion_type correctly for all types', async () => {
      const stint1 = await createActiveStint(serviceClient, testProject.id, testUserId);
      const result1 = await completeStint(authenticatedClient, stint1.id, 'manual');
      expect(result1.data!.completion_type).toBe('manual');

      await cleanupTestData(serviceClient, testUserId);
      testProject = await createTestProject(serviceClient, testUserId);

      const stint2 = await createActiveStint(serviceClient, testProject.id, testUserId);
      const result2 = await completeStint(authenticatedClient, stint2.id, 'auto');
      expect(result2.data!.completion_type).toBe('auto');

      await cleanupTestData(serviceClient, testUserId);
      testProject = await createTestProject(serviceClient, testUserId);

      const stint3 = await createActiveStint(serviceClient, testProject.id, testUserId);
      const result3 = await completeStint(authenticatedClient, stint3.id, 'interrupted');
      expect(result3.data!.completion_type).toBe('interrupted');
    });

    it('should accept notes up to 500 characters', async () => {
      const stint = await createActiveStint(serviceClient, testProject.id, testUserId);
      const notes = 'A'.repeat(500);

      const result = await completeStint(authenticatedClient, stint.id, 'manual', notes);

      expect(result.error).toBeNull();
      expect(result.data!.notes).toBe(notes);
    });

    it('should return error if notes exceed 500 characters', async () => {
      const stint = await createActiveStint(serviceClient, testProject.id, testUserId);
      const notes = 'A'.repeat(501);

      const result = await completeStint(authenticatedClient, stint.id, 'manual', notes);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('500');
    });

    it('should return error when stint already completed', async () => {
      const stint = await createCompletedStint(serviceClient, testProject.id, testUserId);

      const result = await completeStint(authenticatedClient, stint.id, 'manual');

      expect(result.error).not.toBeNull();
    });

    it('should return auth error when user is not authenticated', async () => {
      const stint = await createActiveStint(serviceClient, testProject.id, testUserId);

      const result = await completeStint(unauthenticatedClient, stint.id, 'manual');

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('startStint', () => {
    it('should start stint with explicit duration', async () => {
      const result = await startStint(authenticatedClient, testProject.id, 45);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data!.planned_duration).toBe(45);
      expect(result.data!.status).toBe('active');
    });

    it('should use project custom_stint_duration when param not provided', async () => {
      const projectWithCustomDuration = await createTestProject(serviceClient, testUserId, {
        name: 'Custom Duration Project',
        custom_stint_duration: 60,
      });

      const result = await startStint(authenticatedClient, projectWithCustomDuration.id);

      expect(result.error).toBeNull();
      expect(result.data!.planned_duration).toBe(60);
    });

    it('should use default 120 minutes when no project custom duration', async () => {
      const projectWithoutCustomDuration = await createTestProject(serviceClient, testUserId, {
        name: 'No Custom Duration',
        custom_stint_duration: null,
      });

      const result = await startStint(authenticatedClient, projectWithoutCustomDuration.id);

      expect(result.error).toBeNull();
      expect(result.data!.planned_duration).toBe(120);
    });

    it('should validate duration is at least 5 minutes', async () => {
      const result = await startStint(authenticatedClient, testProject.id, 4);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('5');
    });

    it('should validate duration is at most 480 minutes', async () => {
      const result = await startStint(authenticatedClient, testProject.id, 481);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('480');
    });

    it('should return CONFLICT error when active stint exists', async () => {
      await createActiveStint(serviceClient, testProject.id, testUserId);

      const otherProject = await createTestProject(serviceClient, testUserId, {
        name: 'Other Project',
      });

      const result = await startStint(authenticatedClient, otherProject.id);

      expect(result.error).not.toBeNull();
      expect('code' in result.error!).toBe(true);
      expect((result.error as { code: string }).code).toBe('CONFLICT');
    });

    it('should return error when project is archived', async () => {
      const archivedProject = await createTestProject(serviceClient, testUserId, {
        name: 'Archived Project',
        archived_at: new Date().toISOString(),
      });

      const result = await startStint(authenticatedClient, archivedProject.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('archived');
    });

    it('should return error when project not found', async () => {
      const result = await startStint(authenticatedClient, '00000000-0000-0000-0000-000000000000');

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('not found');
    });

    it('should accept optional notes', async () => {
      const result = await startStint(authenticatedClient, testProject.id, 25, 'Test notes');

      expect(result.error).toBeNull();
      expect(result.data!.notes).toBe('Test notes');
    });

    it('should return auth error when user is not authenticated', async () => {
      const result = await startStint(unauthenticatedClient, testProject.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('syncStintCheck', () => {
    it('should return correct remaining time for active stint', async () => {
      const stint = await createActiveStint(serviceClient, testProject.id, testUserId, {
        planned_duration: 30,
        started_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      });

      const result = await syncStintCheck(authenticatedClient, stint.id);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data!.status).toBe('active');
      expect(result.data!.remainingSeconds).toBeLessThanOrEqual(25 * 60);
      expect(result.data!.remainingSeconds).toBeGreaterThan(24 * 60);
    });

    it('should return correct remaining time for paused stint', async () => {
      const stint = await createPausedStint(serviceClient, testProject.id, testUserId, {
        planned_duration: 30,
        started_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        paused_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        paused_duration: 0,
      });

      const result = await syncStintCheck(authenticatedClient, stint.id);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data!.status).toBe('paused');
      expect(result.data!.remainingSeconds).toBeGreaterThan(0);
    });

    it('should return error when stint is completed', async () => {
      const stint = await createCompletedStint(serviceClient, testProject.id, testUserId);

      const result = await syncStintCheck(authenticatedClient, stint.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('completed');
    });

    it('should return error when stint not found', async () => {
      const result = await syncStintCheck(authenticatedClient, '00000000-0000-0000-0000-000000000000');

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('not found');
    });

    it('should return auth error when user is not authenticated', async () => {
      const stint = await createActiveStint(serviceClient, testProject.id, testUserId);

      const result = await syncStintCheck(unauthenticatedClient, stint.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('pause time calculations', () => {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    it('should accumulate paused_duration across multiple pause/resume cycles', async () => {
      const stint = await createActiveStint(serviceClient, testProject.id, testUserId);

      const pause1 = await pauseStint(authenticatedClient, stint.id);
      expect(pause1.error).toBeNull();
      await sleep(1000);

      const resume1 = await resumeStint(authenticatedClient, stint.id);
      expect(resume1.error).toBeNull();
      const firstPauseDuration = resume1.data!.paused_duration!;
      expect(firstPauseDuration).toBeGreaterThanOrEqual(1);

      const pause2 = await pauseStint(authenticatedClient, stint.id);
      expect(pause2.error).toBeNull();
      await sleep(1000);

      const resume2 = await resumeStint(authenticatedClient, stint.id);
      expect(resume2.error).toBeNull();
      const secondPauseDuration = resume2.data!.paused_duration!;

      expect(secondPauseDuration).toBeGreaterThanOrEqual(firstPauseDuration + 1);
    });

    it('should calculate remaining time correctly after being paused and resumed', async () => {
      const stint = await createActiveStint(serviceClient, testProject.id, testUserId, {
        planned_duration: 30,
        started_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      });

      await pauseStint(authenticatedClient, stint.id);
      await sleep(2000);
      await resumeStint(authenticatedClient, stint.id);

      const result = await syncStintCheck(authenticatedClient, stint.id);

      expect(result.error).toBeNull();
      expect(result.data!.remainingSeconds).toBeGreaterThanOrEqual(25 * 60);
    });

    it('should not decrease remaining time while stint is paused', async () => {
      const stint = await createActiveStint(serviceClient, testProject.id, testUserId, {
        planned_duration: 30,
        started_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      });

      await pauseStint(authenticatedClient, stint.id);

      const check1 = await syncStintCheck(authenticatedClient, stint.id);
      expect(check1.error).toBeNull();
      const remaining1 = check1.data!.remainingSeconds;

      await sleep(2000);

      const check2 = await syncStintCheck(authenticatedClient, stint.id);
      expect(check2.error).toBeNull();
      const remaining2 = check2.data!.remainingSeconds;

      expect(remaining2).toBe(remaining1);
    });

    it('should exclude paused time from actual_duration when completing', async () => {
      const startTime = new Date(Date.now() - 60 * 1000);
      const stint = await createActiveStint(serviceClient, testProject.id, testUserId, {
        planned_duration: 30,
        started_at: startTime.toISOString(),
      });

      await pauseStint(authenticatedClient, stint.id);
      await sleep(2000);

      const result = await completeStint(authenticatedClient, stint.id, 'manual');

      expect(result.error).toBeNull();
      expect(result.data!.actual_duration).toBeLessThan(63);
    });
  });

  describe('concurrent stint constraints', () => {
    it('should allow one active AND one paused stint simultaneously', async () => {
      // Create an active stint on project A
      await createActiveStint(serviceClient, testProject.id, testUserId);

      // Create a paused stint on project B (using service client to bypass RPC validation)
      const otherProject = await createTestProject(serviceClient, testUserId, {
        name: 'Other Project',
      });
      await createPausedStint(serviceClient, otherProject.id, testUserId);

      // Verify both exist via authenticated client queries
      const activeResult = await getActiveStint(authenticatedClient);
      const pausedResult = await getPausedStint(authenticatedClient);

      expect(activeResult.error).toBeNull();
      expect(activeResult.data).not.toBeNull();
      expect(activeResult.data!.status).toBe('active');

      expect(pausedResult.error).toBeNull();
      expect(pausedResult.data).not.toBeNull();
      expect(pausedResult.data!.status).toBe('paused');
    });

    it('should reject starting a stint when both active and paused exist (dual conflict)', async () => {
      // Create an active stint on project A
      await createActiveStint(serviceClient, testProject.id, testUserId);

      // Create a paused stint on project B
      const otherProject = await createTestProject(serviceClient, testUserId, {
        name: 'Other Project',
      });
      await createPausedStint(serviceClient, otherProject.id, testUserId);

      // Try to start a third stint on project C
      const thirdProject = await createTestProject(serviceClient, testUserId, {
        name: 'Third Project',
      });
      const result = await startStint(authenticatedClient, thirdProject.id);

      // Should get a CONFLICT error (active stint blocks new starts)
      expect(result.error).not.toBeNull();
      expect('code' in result.error!).toBe(true);
      expect((result.error as { code: string }).code).toBe('CONFLICT');
    });

    it('should allow starting a stint when only paused stint exists (not blocked by paused)', async () => {
      // Create only a paused stint
      await createPausedStint(serviceClient, testProject.id, testUserId);

      // Try to start a new stint on another project
      const otherProject = await createTestProject(serviceClient, testUserId, {
        name: 'Other Project',
      });
      const result = await startStint(authenticatedClient, otherProject.id);

      // Should succeed - paused stints don't block new starts
      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data!.status).toBe('active');

      // Verify we now have both active and paused
      const activeResult = await getActiveStint(authenticatedClient);
      const pausedResult = await getPausedStint(authenticatedClient);

      expect(activeResult.data).not.toBeNull();
      expect(pausedResult.data).not.toBeNull();
    });

    it('should reject creating a second active stint at database level', async () => {
      await createActiveStint(serviceClient, testProject.id, testUserId);
      const otherProject = await createTestProject(serviceClient, testUserId, { name: 'Other' });

      const { error } = await serviceClient
        .from('stints')
        .insert({
          user_id: testUserId,
          project_id: otherProject.id,
          status: 'active',
          started_at: new Date().toISOString(),
          planned_duration: 25,
        });

      expect(error).not.toBeNull();
      expect(error?.code).toBe('23505');
    });

    it('should reject creating a second paused stint at database level', async () => {
      await createPausedStint(serviceClient, testProject.id, testUserId);
      const otherProject = await createTestProject(serviceClient, testUserId, { name: 'Other' });

      const { error } = await serviceClient
        .from('stints')
        .insert({
          user_id: testUserId,
          project_id: otherProject.id,
          status: 'paused',
          started_at: new Date().toISOString(),
          paused_at: new Date().toISOString(),
          planned_duration: 25,
        });

      expect(error).not.toBeNull();
      expect(error?.code).toBe('23505');
    });
  });

  describe('cross-user access prevention', () => {
    let otherUserId: string;
    let otherUserEmail: string;
    let otherUserClient: TypedSupabaseClient;

    beforeAll(async () => {
      otherUserEmail = `test-stints-other-${Date.now()}@integration.test`;
      otherUserId = await createTestUser(serviceClient, otherUserEmail);
      otherUserClient = await getAuthenticatedClient(otherUserEmail);
    });

    afterAll(async () => {
      await cleanupTestData(serviceClient, otherUserId);
      await deleteTestUser(serviceClient, otherUserId);
    });

    it('should prevent User B from pausing User A stint', async () => {
      const stintA = await createActiveStint(serviceClient, testProject.id, testUserId);

      const result = await pauseStint(otherUserClient, stintA.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('do not have permission');
    });

    it('should prevent User B from resuming User A stint', async () => {
      const stintA = await createPausedStint(serviceClient, testProject.id, testUserId);

      const result = await resumeStint(otherUserClient, stintA.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('do not have permission');
    });

    it('should prevent User B from completing User A stint', async () => {
      const stintA = await createActiveStint(serviceClient, testProject.id, testUserId);

      const result = await completeStint(otherUserClient, stintA.id, 'manual');

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('do not have permission');
    });
  });

  describe('pause-and-switch workflow', () => {
    let projectA: ProjectRow;
    let projectB: ProjectRow;

    beforeEach(async () => {
      projectA = await createTestProject(serviceClient, testUserId, { name: 'Workflow Project A' });
      projectB = await createTestProject(serviceClient, testUserId, { name: 'Workflow Project B' });
    });

    afterEach(async () => {
      await serviceClient.from('stints').delete().eq('project_id', projectA.id);
      await serviceClient.from('stints').delete().eq('project_id', projectB.id);
      await serviceClient.from('projects').delete().eq('id', projectA.id);
      await serviceClient.from('projects').delete().eq('id', projectB.id);
    });

    it('should complete full pause-and-switch workflow', async () => {
      // Step 1: Start stint on Project A
      const startAResult = await startStint(authenticatedClient, projectA.id, 50);
      expect(startAResult.error).toBeNull();
      expect(startAResult.data?.status).toBe('active');
      const stintA = startAResult.data!;

      // Step 2: Pause stint A (add delay to accumulate pause time)
      await new Promise(resolve => setTimeout(resolve, 100));
      const pauseResult = await pauseStint(authenticatedClient, stintA.id);
      expect(pauseResult.error).toBeNull();
      expect(pauseResult.data?.status).toBe('paused');

      // Wait while paused to accumulate pause time
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Step 3: Start stint on Project B (alongside paused A)
      const startBResult = await startStint(authenticatedClient, projectB.id, 30);
      expect(startBResult.error).toBeNull();
      expect(startBResult.data?.status).toBe('active');
      const stintB = startBResult.data!;

      // Verify: Both stints coexist (A=paused, B=active)
      const activeResult = await getActiveStint(authenticatedClient);
      expect(activeResult.data?.id).toBe(stintB.id);

      const pausedResult = await getPausedStint(authenticatedClient);
      expect(pausedResult.data?.id).toBe(stintA.id);

      // Step 4: Complete stint B
      const completeBResult = await completeStint(authenticatedClient, stintB.id, 'manual');
      expect(completeBResult.error).toBeNull();
      expect(completeBResult.data?.status).toBe('completed');

      // Step 5: Resume stint A
      const resumeResult = await resumeStint(authenticatedClient, stintA.id);
      expect(resumeResult.error).toBeNull();
      expect(resumeResult.data?.status).toBe('active');
      expect(resumeResult.data?.paused_duration).toBeGreaterThanOrEqual(1);

      // Verify: A is now active again with preserved accumulated time
      const finalActiveResult = await getActiveStint(authenticatedClient);
      expect(finalActiveResult.data?.id).toBe(stintA.id);

      // Cleanup
      await completeStint(authenticatedClient, stintA.id, 'manual');
    });

    it('should reject starting third stint when both active and paused exist', async () => {
      // Create a third project for this test
      const projectC = await createTestProject(serviceClient, testUserId, { name: 'Workflow Project C' });

      try {
        // Step 1: Start and pause stint on Project A
        const startAResult = await startStint(authenticatedClient, projectA.id, 50);
        const stintA = startAResult.data!;
        await pauseStint(authenticatedClient, stintA.id);

        // Step 2: Start stint on Project B
        const startBResult = await startStint(authenticatedClient, projectB.id, 30);
        const stintB = startBResult.data!;

        // Step 3: Try to start third stint on Project C (should fail)
        // The error is "active stint already running" because validate_stint_start
        // checks for active stint first before checking paused stint
        const startCResult = await startStint(authenticatedClient, projectC.id, 25);

        expect(startCResult.error).not.toBeNull();
        expect(startCResult.error?.message).toContain('active stint is already running');

        // Cleanup
        await completeStint(authenticatedClient, stintB.id, 'manual');
        await completeStint(authenticatedClient, stintA.id, 'interrupted');
      }
      finally {
        await serviceClient.from('stints').delete().eq('project_id', projectC.id);
        await serviceClient.from('projects').delete().eq('id', projectC.id);
      }
    });

    it('should correctly preserve paused_duration after pause-switch-resume cycle', async () => {
      // Step 1: Start stint on Project A
      const startResult = await startStint(authenticatedClient, projectA.id, 50);
      const stintA = startResult.data!;

      // Wait briefly to accumulate some active time
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 2: Pause stint A
      await pauseStint(authenticatedClient, stintA.id);

      // Wait while paused to accumulate pause time
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Step 3: Start stint B (switch)
      const startBResult = await startStint(authenticatedClient, projectB.id, 30);
      const stintB = startBResult.data!;

      // Complete B quickly
      await completeStint(authenticatedClient, stintB.id, 'manual');

      // Step 4: Resume A
      const resumeResult = await resumeStint(authenticatedClient, stintA.id);

      // Verify paused_duration was preserved and accumulated
      expect(resumeResult.data?.paused_duration).toBeGreaterThanOrEqual(1);

      // Cleanup
      await completeStint(authenticatedClient, stintA.id, 'manual');
    });
  });
});
