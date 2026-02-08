/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { TypedSupabaseClient } from '~/utils/supabase';
import { hasActiveStint, getDeletionStatus, requestAccountDeletion, cancelAccountDeletion } from './account-deletion';
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

describe('account-deletion.ts - Integration Tests', () => {
  let serviceClient: TypedSupabaseClient;
  let unauthenticatedClient: TypedSupabaseClient;
  let authenticatedClient: TypedSupabaseClient;
  let testUserId: string;
  let testUserEmail: string;

  beforeAll(async () => {
    testUserEmail = `test-account-deletion-${Date.now()}@integration.test`;
    serviceClient = getServiceClient();
    testUserId = await createTestUser(serviceClient, testUserEmail);
    unauthenticatedClient = getUnauthenticatedClient();
    authenticatedClient = await getAuthenticatedClient(testUserEmail);
  });

  beforeEach(async () => {
    await cleanupTestData(serviceClient, testUserId);
    await serviceClient
      .from('user_profiles')
      .update({ deletion_requested_at: null })
      .eq('id', testUserId);
  });

  afterAll(async () => {
    await cleanupTestData(serviceClient, testUserId);
    await serviceClient
      .from('user_profiles')
      .update({ deletion_requested_at: null })
      .eq('id', testUserId);
    await deleteTestUser(serviceClient, testUserId);
  });

  describe('hasActiveStint', () => {
    it('should return false when no stints exist', async () => {
      const result = await hasActiveStint(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data).toBe(false);
    });

    it('should return true when active stint exists', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'Active Project' });
      await createActiveStint(serviceClient, project.id, testUserId);

      const result = await hasActiveStint(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
    });

    it('should return true when paused stint exists', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'Paused Project' });
      await createPausedStint(serviceClient, project.id, testUserId);

      const result = await hasActiveStint(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
    });

    it('should return false when only completed stints exist', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'Completed Project' });
      await createCompletedStint(serviceClient, project.id, testUserId);

      const result = await hasActiveStint(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data).toBe(false);
    });

    it('should return auth error when user is not authenticated', async () => {
      const result = await hasActiveStint(unauthenticatedClient);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('getDeletionStatus', () => {
    it('should return isPending=false when no deletion requested', async () => {
      const result = await getDeletionStatus(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        isPending: false,
        requestedAt: null,
        expiresAt: null,
        daysRemaining: null,
      });
    });

    it('should return correct status when deletion is pending', async () => {
      const requestedAt = new Date().toISOString();
      await serviceClient
        .from('user_profiles')
        .update({ deletion_requested_at: requestedAt })
        .eq('id', testUserId);

      const result = await getDeletionStatus(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data!.isPending).toBe(true);
      expect(new Date(result.data!.requestedAt!).getTime()).toBe(new Date(requestedAt).getTime());
      expect(result.data!.expiresAt).not.toBeNull();
      expect(result.data!.daysRemaining).toBeGreaterThan(0);
      expect(result.data!.daysRemaining).toBeLessThanOrEqual(30);
    });

    it('should return daysRemaining=0 when grace period has expired', async () => {
      const pastDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
      await serviceClient
        .from('user_profiles')
        .update({ deletion_requested_at: pastDate })
        .eq('id', testUserId);

      const result = await getDeletionStatus(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data!.isPending).toBe(true);
      expect(result.data!.daysRemaining).toBe(0);
    });

    it('should return auth error when user is not authenticated', async () => {
      const result = await getDeletionStatus(unauthenticatedClient);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('requestAccountDeletion', () => {
    it('should successfully set deletion_requested_at and log event', async () => {
      const beforeRequest = new Date();

      const result = await requestAccountDeletion(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data!.isPending).toBe(true);
      expect(result.data!.requestedAt).not.toBeNull();
      expect(result.data!.daysRemaining).toBeGreaterThan(0);
      expect(result.data!.daysRemaining).toBeLessThanOrEqual(30);

      const requestedAt = new Date(result.data!.requestedAt!);
      expect(requestedAt.getTime()).toBeGreaterThanOrEqual(beforeRequest.getTime());

      const { data: profile } = await serviceClient
        .from('user_profiles')
        .select('deletion_requested_at')
        .eq('id', testUserId)
        .single();
      expect(profile!.deletion_requested_at).not.toBeNull();

      const { data: auditLogs } = await serviceClient
        .from('deletion_audit_log')
        .select('*')
        .eq('event_type', 'request')
        .order('event_timestamp', { ascending: false })
        .limit(1);
      expect(auditLogs).not.toBeNull();
      expect(auditLogs!).toHaveLength(1);

      const { data: expectedRef } = await serviceClient.rpc('generate_anonymized_user_ref', {
        user_id: testUserId,
      });
      expect(auditLogs![0]?.anonymized_user_ref).toBe(expectedRef);
    });

    it('should fail with error when user has active stint', async () => {
      const project = await createTestProject(serviceClient, testUserId, { name: 'Block Deletion' });
      await createActiveStint(serviceClient, project.id, testUserId);

      const result = await requestAccountDeletion(authenticatedClient);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('end your active stint');
      expect(result.data).toBeNull();
    });

    it('should fail with error when deletion already pending', async () => {
      await serviceClient
        .from('user_profiles')
        .update({ deletion_requested_at: new Date().toISOString() })
        .eq('id', testUserId);

      const result = await requestAccountDeletion(authenticatedClient);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('already scheduled');
      expect(result.data).toBeNull();
    });

    it('should return auth error when user is not authenticated', async () => {
      const result = await requestAccountDeletion(unauthenticatedClient);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('cancelAccountDeletion', () => {
    it('should successfully cancel a pending deletion and log event', async () => {
      await serviceClient
        .from('user_profiles')
        .update({ deletion_requested_at: new Date().toISOString() })
        .eq('id', testUserId);

      const result = await cancelAccountDeletion(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data!.isPending).toBe(false);
      expect(result.data!.requestedAt).toBeNull();
      expect(result.data!.expiresAt).toBeNull();
      expect(result.data!.daysRemaining).toBeNull();

      const { data: profile } = await serviceClient
        .from('user_profiles')
        .select('deletion_requested_at')
        .eq('id', testUserId)
        .single();
      expect(profile!.deletion_requested_at).toBeNull();

      const { data: auditLogs } = await serviceClient
        .from('deletion_audit_log')
        .select('*')
        .eq('event_type', 'cancel')
        .order('event_timestamp', { ascending: false })
        .limit(1);
      expect(auditLogs).not.toBeNull();
      expect(auditLogs!).toHaveLength(1);

      const { data: expectedRef } = await serviceClient.rpc('generate_anonymized_user_ref', {
        user_id: testUserId,
      });
      expect(auditLogs![0]?.anonymized_user_ref).toBe(expectedRef);
    });

    it('should fail when no pending deletion exists', async () => {
      const result = await cancelAccountDeletion(authenticatedClient);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('No pending deletion request to cancel');
      expect(result.data).toBeNull();
    });

    it('should return auth error when user is not authenticated', async () => {
      const result = await cancelAccountDeletion(unauthenticatedClient);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });
});
