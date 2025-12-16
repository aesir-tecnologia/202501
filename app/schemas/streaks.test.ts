import { describe, it, expect } from 'vitest';
import { streakDataSchema, timezoneSchema } from './streaks';

describe('streaks schema', () => {
  describe('streakDataSchema', () => {
    it('should validate valid streak data', () => {
      const validData = {
        currentStreak: 5,
        longestStreak: 10,
        lastStintDate: '2025-12-15',
        isAtRisk: false,
      };

      const result = streakDataSchema.safeParse(validData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should allow null lastStintDate', () => {
      const validData = {
        currentStreak: 0,
        longestStreak: 0,
        lastStintDate: null,
        isAtRisk: false,
      };

      const result = streakDataSchema.safeParse(validData);

      expect(result.success).toBe(true);
      expect(result.data!.lastStintDate).toBeNull();
    });

    it('should reject negative streak values', () => {
      const invalidData = {
        currentStreak: -1,
        longestStreak: 10,
        lastStintDate: null,
        isAtRisk: false,
      };

      const result = streakDataSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject non-integer streak values', () => {
      const invalidData = {
        currentStreak: 5.5,
        longestStreak: 10,
        lastStintDate: null,
        isAtRisk: false,
      };

      const result = streakDataSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should require isAtRisk to be boolean', () => {
      const invalidData = {
        currentStreak: 5,
        longestStreak: 10,
        lastStintDate: null,
        isAtRisk: 'yes',
      };

      const result = streakDataSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        currentStreak: 5,
        longestStreak: 10,
      };

      const result = streakDataSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('timezoneSchema', () => {
    it('should validate valid timezone strings', () => {
      const validTimezones = [
        'UTC',
        'America/Sao_Paulo',
        'Europe/London',
        'Asia/Tokyo',
        'America/New_York',
      ];

      validTimezones.forEach((tz) => {
        const result = timezoneSchema.safeParse(tz);
        expect(result.success).toBe(true);
        expect(result.data).toBe(tz);
      });
    });

    it('should reject empty timezone string', () => {
      const result = timezoneSchema.safeParse('');

      expect(result.success).toBe(false);
    });

    it('should reject non-string values', () => {
      const result = timezoneSchema.safeParse(123);

      expect(result.success).toBe(false);
    });
  });
});
