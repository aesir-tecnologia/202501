/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { TypedSupabaseClient } from '~/utils/supabase';
import type { ProjectRow } from './projects';
import { getStreak, updateStreakAfterCompletion } from './streaks';
import {
  getServiceClient,
  getUnauthenticatedClient,
  getAuthenticatedClient,
  createTestUser,
  deleteTestUser,
  cleanupTestData,
  createTestProject,
  createCompletedStintOnDate,
  getDateDaysAgoUTC,
} from './test-utils';

describe('streaks.ts - Integration Tests', () => {
  let serviceClient: TypedSupabaseClient;
  let unauthenticatedClient: TypedSupabaseClient;
  let authenticatedClient: TypedSupabaseClient;
  let testUserId: string;
  let testUserEmail: string;
  let testProject: ProjectRow;

  const TEST_TIMEZONE = 'UTC';

  beforeAll(async () => {
    testUserEmail = `test-streaks-${Date.now()}@integration.test`;
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

  describe('getStreak', () => {
    it('should return zero streak when user has no stints', async () => {
      const result = await getStreak(authenticatedClient, TEST_TIMEZONE);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data!.currentStreak).toBe(0);
      expect(result.data!.longestStreak).toBe(0);
      expect(result.data!.lastStintDate).toBeNull();
      expect(result.data!.isAtRisk).toBe(false);
    });

    it('should return 1-day streak when user completed stint today', async () => {
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(0),
      );

      const result = await getStreak(authenticatedClient, TEST_TIMEZONE);

      expect(result.error).toBeNull();
      expect(result.data!.currentStreak).toBe(1);
      expect(result.data!.isAtRisk).toBe(false);
    });

    it('should count consecutive days as streak', async () => {
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(0),
      );
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(1),
      );
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(2),
      );

      const result = await getStreak(authenticatedClient, TEST_TIMEZONE);

      expect(result.error).toBeNull();
      expect(result.data!.currentStreak).toBe(3);
    });

    it('should reset streak when there is a gap of 2+ days', async () => {
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(0),
      );
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(3),
      );

      const result = await getStreak(authenticatedClient, TEST_TIMEZONE);

      expect(result.error).toBeNull();
      expect(result.data!.currentStreak).toBe(1);
    });

    it('should break streak with exactly 2-day gap (edge case for 1-day grace period)', async () => {
      // Stint today and 2 days ago (no stint yesterday)
      // With 1-day grace period, this should NOT count as consecutive
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(0),
      );
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(2),
      );

      const result = await getStreak(authenticatedClient, TEST_TIMEZONE);

      expect(result.error).toBeNull();
      // Current streak should be 1 (only today counts, 2-day-old stint breaks the chain)
      expect(result.data!.currentStreak).toBe(1);
      // Both days should still contribute to longest_streak calculation separately
      expect(result.data!.longestStreak).toBe(1);
    });

    it('should mark as at-risk when last stint was yesterday and no stint today', async () => {
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(1),
      );
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(2),
      );

      const result = await getStreak(authenticatedClient, TEST_TIMEZONE);

      expect(result.error).toBeNull();
      expect(result.data!.currentStreak).toBe(2);
      expect(result.data!.isAtRisk).toBe(true);
    });

    it('should not be at-risk when stint completed today', async () => {
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(0),
      );
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(1),
      );

      const result = await getStreak(authenticatedClient, TEST_TIMEZONE);

      expect(result.error).toBeNull();
      expect(result.data!.isAtRisk).toBe(false);
    });

    it('should track longest streak separately from current', async () => {
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(10),
      );
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(11),
      );
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(12),
      );
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(13),
      );
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(14),
      );
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(0),
      );

      const result = await getStreak(authenticatedClient, TEST_TIMEZONE);

      expect(result.error).toBeNull();
      expect(result.data!.currentStreak).toBe(1);
      expect(result.data!.longestStreak).toBe(5);
    });

    it('should count multiple stints on same day as one day', async () => {
      const today = getDateDaysAgoUTC(0, 10);
      const todayLater = getDateDaysAgoUTC(0, 14);

      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        today,
      );
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        todayLater,
      );

      const result = await getStreak(authenticatedClient, TEST_TIMEZONE);

      expect(result.error).toBeNull();
      expect(result.data!.currentStreak).toBe(1);
    });

    it('should return lastStintDate correctly', async () => {
      const yesterday = getDateDaysAgoUTC(1);
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        yesterday,
      );

      const result = await getStreak(authenticatedClient, TEST_TIMEZONE);

      expect(result.error).toBeNull();
      expect(result.data!.lastStintDate).not.toBeNull();
      const lastDate = new Date(result.data!.lastStintDate!);
      expect(lastDate.getUTCDate()).toBe(yesterday.getUTCDate());
    });

    it('should return auth error when user is not authenticated', async () => {
      const result = await getStreak(unauthenticatedClient, TEST_TIMEZONE);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });

    it('should use UTC as default timezone', async () => {
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(0),
      );

      const resultDefault = await getStreak(authenticatedClient);
      const resultExplicit = await getStreak(authenticatedClient, 'UTC');

      expect(resultDefault.data!.currentStreak).toBe(resultExplicit.data!.currentStreak);
    });
  });

  describe('updateStreakAfterCompletion', () => {
    it('should update streak in user_streaks table', async () => {
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(0),
      );

      const result = await updateStreakAfterCompletion(authenticatedClient, TEST_TIMEZONE);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data!.currentStreak).toBe(1);
    });

    it('should return updated streak data after completion', async () => {
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(0),
      );
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(1),
      );

      const result = await updateStreakAfterCompletion(authenticatedClient, TEST_TIMEZONE);

      expect(result.error).toBeNull();
      expect(result.data!.currentStreak).toBe(2);
      expect(result.data!.longestStreak).toBeGreaterThanOrEqual(2);
    });

    it('should include isAtRisk status in response', async () => {
      await createCompletedStintOnDate(
        serviceClient,
        testProject.id,
        testUserId,
        getDateDaysAgoUTC(0),
      );

      const result = await updateStreakAfterCompletion(authenticatedClient, TEST_TIMEZONE);

      expect(result.error).toBeNull();
      expect(typeof result.data!.isAtRisk).toBe('boolean');
      expect(result.data!.isAtRisk).toBe(false);
    });

    it('should return auth error when user is not authenticated', async () => {
      const result = await updateStreakAfterCompletion(unauthenticatedClient, TEST_TIMEZONE);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('authenticated');
    });
  });
});
