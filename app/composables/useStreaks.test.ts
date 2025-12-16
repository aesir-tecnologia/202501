import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBrowserTimezone, streakKeys } from './useStreaks';

describe('useStreaks', () => {
  describe('streakKeys', () => {
    it('should have correct base key', () => {
      expect(streakKeys.all).toEqual(['streaks']);
    });

    it('should generate current streak key correctly', () => {
      expect(streakKeys.current()).toEqual(['streaks', 'current']);
    });

    it('should return consistent keys on multiple calls', () => {
      const key1 = streakKeys.current();
      const key2 = streakKeys.current();

      expect(key1).toEqual(key2);
    });

    it('should return readonly arrays (as const)', () => {
      const baseKey = streakKeys.all;
      const currentKey = streakKeys.current();

      expect(Array.isArray(baseKey)).toBe(true);
      expect(Array.isArray(currentKey)).toBe(true);
    });
  });

  describe('getBrowserTimezone', () => {
    let originalIntl: typeof Intl;

    beforeEach(() => {
      originalIntl = global.Intl;
    });

    afterEach(() => {
      global.Intl = originalIntl;
    });

    it('should return browser timezone when available', () => {
      const timezone = getBrowserTimezone();

      expect(typeof timezone).toBe('string');
      expect(timezone.length).toBeGreaterThan(0);
    });

    it('should return UTC when timezone detection fails', () => {
      global.Intl = {
        ...originalIntl,
        DateTimeFormat: vi.fn(() => ({
          resolvedOptions: () => {
            throw new Error('Timezone not available');
          },
        })),
      } as unknown as typeof Intl;

      const timezone = getBrowserTimezone();

      expect(timezone).toBe('UTC');
    });

    it('should return UTC when DateTimeFormat is not available', () => {
      global.Intl = {
        ...originalIntl,
        DateTimeFormat: undefined as unknown as typeof Intl.DateTimeFormat,
      };

      const timezone = getBrowserTimezone();

      expect(timezone).toBe('UTC');
    });
  });
});
