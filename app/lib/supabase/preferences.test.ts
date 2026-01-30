/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { TypedSupabaseClient } from '~/utils/supabase';
import { getPreferences, updatePreferences } from './preferences';
import {
  getServiceClient,
  getUnauthenticatedClient,
  getAuthenticatedClient,
  createTestUser,
  deleteTestUser,
} from './test-utils';

describe('preferences.ts - Integration Tests', () => {
  let serviceClient: TypedSupabaseClient;
  let unauthenticatedClient: TypedSupabaseClient;
  let authenticatedClient: TypedSupabaseClient;
  let testUserId: string;
  let testUserEmail: string;

  beforeAll(async () => {
    testUserEmail = `test-preferences-${Date.now()}@integration.test`;
    serviceClient = getServiceClient();
    testUserId = await createTestUser(serviceClient, testUserEmail);
    unauthenticatedClient = getUnauthenticatedClient();
    authenticatedClient = await getAuthenticatedClient(testUserEmail);
  });

  afterAll(async () => {
    await deleteTestUser(serviceClient, testUserId);
  });

  describe('getPreferences', () => {
    it('should return default preferences for new user', async () => {
      const result = await getPreferences(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        defaultStintDuration: null,
        celebrationAnimation: true,
        desktopNotifications: false,
        stintDayAttribution: 'ask',
      });
    });

    it('should require authentication', async () => {
      const result = await getPreferences(unauthenticatedClient);

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });

  describe('updatePreferences', () => {
    it('should update defaultStintDuration', async () => {
      const result = await updatePreferences(authenticatedClient, {
        defaultStintDuration: 45,
      });

      expect(result.error).toBeNull();
      expect(result.data?.defaultStintDuration).toBe(45);
      expect(result.data?.celebrationAnimation).toBe(true);
      expect(result.data?.desktopNotifications).toBe(false);
    });

    it('should update celebrationAnimation', async () => {
      const result = await updatePreferences(authenticatedClient, {
        celebrationAnimation: false,
      });

      expect(result.error).toBeNull();
      expect(result.data?.celebrationAnimation).toBe(false);
    });

    it('should update desktopNotifications', async () => {
      const result = await updatePreferences(authenticatedClient, {
        desktopNotifications: true,
      });

      expect(result.error).toBeNull();
      expect(result.data?.desktopNotifications).toBe(true);
    });

    it('should allow null for defaultStintDuration (use system default)', async () => {
      await updatePreferences(authenticatedClient, { defaultStintDuration: 60 });

      const result = await updatePreferences(authenticatedClient, {
        defaultStintDuration: null,
      });

      expect(result.error).toBeNull();
      expect(result.data?.defaultStintDuration).toBeNull();
    });

    it('should update multiple preferences at once', async () => {
      const result = await updatePreferences(authenticatedClient, {
        defaultStintDuration: 90,
        celebrationAnimation: true,
        desktopNotifications: true,
      });

      expect(result.error).toBeNull();
      expect(result.data?.defaultStintDuration).toBe(90);
      expect(result.data?.celebrationAnimation).toBe(true);
      expect(result.data?.desktopNotifications).toBe(true);
      expect(result.data?.stintDayAttribution).toBeDefined();
    });

    it('should require authentication', async () => {
      const result = await updatePreferences(unauthenticatedClient, {
        defaultStintDuration: 30,
      });

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });

    it('should update stintDayAttribution to start_date', async () => {
      const result = await updatePreferences(authenticatedClient, {
        stintDayAttribution: 'start_date',
      });

      expect(result.error).toBeNull();
      expect(result.data?.stintDayAttribution).toBe('start_date');
    });

    it('should update stintDayAttribution to end_date', async () => {
      const result = await updatePreferences(authenticatedClient, {
        stintDayAttribution: 'end_date',
      });

      expect(result.error).toBeNull();
      expect(result.data?.stintDayAttribution).toBe('end_date');
    });

    it('should update stintDayAttribution to ask', async () => {
      await updatePreferences(authenticatedClient, { stintDayAttribution: 'start_date' });

      const result = await updatePreferences(authenticatedClient, {
        stintDayAttribution: 'ask',
      });

      expect(result.error).toBeNull();
      expect(result.data?.stintDayAttribution).toBe('ask');
    });

    it('should enforce minimum duration constraint', async () => {
      const result = await updatePreferences(authenticatedClient, {
        defaultStintDuration: 3,
      });

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
    });

    it('should enforce maximum duration constraint', async () => {
      const result = await updatePreferences(authenticatedClient, {
        defaultStintDuration: 500,
      });

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
    });

    it('should persist changes across reads', async () => {
      await updatePreferences(authenticatedClient, {
        defaultStintDuration: 75,
        celebrationAnimation: false,
        desktopNotifications: true,
      });

      const result = await getPreferences(authenticatedClient);

      expect(result.error).toBeNull();
      expect(result.data?.defaultStintDuration).toBe(75);
      expect(result.data?.celebrationAnimation).toBe(false);
      expect(result.data?.desktopNotifications).toBe(true);
      expect(result.data?.stintDayAttribution).toBeDefined();
    });
  });
});
