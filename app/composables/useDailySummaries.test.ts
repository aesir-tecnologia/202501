import { describe, it, expect } from 'vitest';
import { dailySummaryKeys } from './useDailySummaries';
import type { DailySummaryFilters } from '~/schemas/daily-summaries';

describe('useDailySummaries', () => {
  describe('dailySummaryKeys', () => {
    it('should have correct base key', () => {
      expect(dailySummaryKeys.all).toEqual(['daily-summaries']);
    });

    it('should generate lists key correctly', () => {
      expect(dailySummaryKeys.lists()).toEqual(['daily-summaries', 'list']);
    });

    it('should generate list key with filters', () => {
      const filters: DailySummaryFilters = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      expect(dailySummaryKeys.list(filters)).toEqual(['daily-summaries', 'list', filters]);
    });

    it('should generate detail key with date', () => {
      const date = '2024-01-15';
      expect(dailySummaryKeys.detail(date)).toEqual(['daily-summaries', 'detail', date]);
    });

    it('should generate weekly key correctly', () => {
      expect(dailySummaryKeys.weekly()).toEqual(['daily-summaries', 'weekly']);
    });

    it('should return consistent keys on multiple calls', () => {
      const lists1 = dailySummaryKeys.lists();
      const lists2 = dailySummaryKeys.lists();
      expect(lists1).toEqual(lists2);

      const weekly1 = dailySummaryKeys.weekly();
      const weekly2 = dailySummaryKeys.weekly();
      expect(weekly1).toEqual(weekly2);
    });

    it('should return readonly arrays (as const)', () => {
      expect(Array.isArray(dailySummaryKeys.all)).toBe(true);
      expect(Array.isArray(dailySummaryKeys.lists())).toBe(true);
      expect(Array.isArray(dailySummaryKeys.weekly())).toBe(true);
    });

    it('should have distinct keys for list, detail, and weekly queries', () => {
      const listKey = dailySummaryKeys.lists();
      const detailKey = dailySummaryKeys.detail('2024-01-15');
      const weeklyKey = dailySummaryKeys.weekly();

      expect(listKey[1]).toBe('list');
      expect(detailKey[1]).toBe('detail');
      expect(weeklyKey[1]).toBe('weekly');

      expect(listKey).not.toEqual(weeklyKey);
      expect(detailKey).not.toEqual(weeklyKey);
    });

    it('should maintain hierarchical key structure for cache invalidation', () => {
      const baseKey = dailySummaryKeys.all;
      const listsKey = dailySummaryKeys.lists();
      const detailKey = dailySummaryKeys.detail('2024-01-15');
      const weeklyKey = dailySummaryKeys.weekly();

      expect(listsKey[0]).toBe(baseKey[0]);
      expect(detailKey[0]).toBe(baseKey[0]);
      expect(weeklyKey[0]).toBe(baseKey[0]);
    });

    it('should preserve filter reference in list key', () => {
      const filters: DailySummaryFilters = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      const key = dailySummaryKeys.list(filters);

      expect(key[2]).toBe(filters);
    });

    it('should differentiate between list keys with different date ranges', () => {
      const januaryFilters: DailySummaryFilters = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      const februaryFilters: DailySummaryFilters = {
        startDate: '2024-02-01',
        endDate: '2024-02-29',
      };

      const januaryKey = dailySummaryKeys.list(januaryFilters);
      const februaryKey = dailySummaryKeys.list(februaryFilters);

      expect(januaryKey).not.toEqual(februaryKey);
    });

    it('should differentiate between detail keys for different dates', () => {
      const key1 = dailySummaryKeys.detail('2024-01-15');
      const key2 = dailySummaryKeys.detail('2024-01-16');

      expect(key1).not.toEqual(key2);
      expect(key1[2]).toBe('2024-01-15');
      expect(key2[2]).toBe('2024-01-16');
    });
  });
});
