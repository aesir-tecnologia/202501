import { describe, it, expect } from 'vitest';
import { detectMidnightSpan, formatAttributionDates } from './midnight-detection';
import type { StintRow } from '~/lib/supabase/stints';

function createMockStint(overrides: Partial<StintRow> = {}): StintRow {
  return {
    id: 'stint-1',
    user_id: 'user-1',
    project_id: 'project-1',
    status: 'active',
    planned_duration: 25,
    started_at: new Date('2025-01-15T23:30:00Z').toISOString(),
    paused_at: null,
    paused_duration: 0,
    ended_at: null,
    actual_duration: null,
    completion_type: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    attributed_date: null,
    ...overrides,
  };
}

describe('midnight-detection utils', () => {
  describe('detectMidnightSpan', () => {
    it('detects same-day stint (no span)', () => {
      const stint = createMockStint({
        started_at: new Date('2025-01-15T10:00:00Z').toISOString(),
        ended_at: new Date('2025-01-15T10:30:00Z').toISOString(),
      });

      const result = detectMidnightSpan(stint, 'UTC');

      expect(result.spansMidnight).toBe(false);
      expect(result.startDate).toBe('2025-01-15');
      expect(result.endDate).toBe('2025-01-15');
    });

    it('detects cross-midnight stint', () => {
      const stint = createMockStint({
        started_at: new Date('2025-01-15T23:30:00Z').toISOString(),
        ended_at: new Date('2025-01-16T00:30:00Z').toISOString(),
      });

      const result = detectMidnightSpan(stint, 'UTC');

      expect(result.spansMidnight).toBe(true);
      expect(result.startDate).toBe('2025-01-15');
      expect(result.endDate).toBe('2025-01-16');
    });

    it('uses reference time for active stints without ended_at', () => {
      const stint = createMockStint({
        started_at: new Date('2025-01-15T23:30:00Z').toISOString(),
        ended_at: null,
      });
      const referenceTime = new Date('2025-01-16T00:30:00Z');

      const result = detectMidnightSpan(stint, 'UTC', referenceTime);

      expect(result.spansMidnight).toBe(true);
      expect(result.startDate).toBe('2025-01-15');
      expect(result.endDate).toBe('2025-01-16');
    });

    it('respects timezone for date calculation', () => {
      const stint = createMockStint({
        started_at: new Date('2025-01-15T22:00:00Z').toISOString(),
        ended_at: new Date('2025-01-16T01:00:00Z').toISOString(),
      });

      const resultUTC = detectMidnightSpan(stint, 'UTC');
      expect(resultUTC.spansMidnight).toBe(true);
      expect(resultUTC.startDate).toBe('2025-01-15');
      expect(resultUTC.endDate).toBe('2025-01-16');

      const resultNY = detectMidnightSpan(stint, 'America/New_York');
      expect(resultNY.spansMidnight).toBe(false);
      expect(resultNY.startDate).toBe('2025-01-15');
      expect(resultNY.endDate).toBe('2025-01-15');
    });

    it('falls back to UTC for invalid timezone string', () => {
      const stint = createMockStint({
        started_at: new Date('2025-01-15T23:30:00Z').toISOString(),
        ended_at: new Date('2025-01-16T00:30:00Z').toISOString(),
      });

      const result = detectMidnightSpan(stint, 'Invalid/Timezone');

      expect(result.spansMidnight).toBe(true);
      expect(result.startDate).toBe('2025-01-15');
      expect(result.endDate).toBe('2025-01-16');
    });

    it('handles missing started_at gracefully', () => {
      const stint = createMockStint({
        started_at: null,
      });
      const referenceTime = new Date('2025-01-15T12:00:00Z');

      const result = detectMidnightSpan(stint, 'UTC', referenceTime);

      expect(result.spansMidnight).toBe(false);
      expect(result.startDate).toBe('2025-01-15');
      expect(result.endDate).toBe('2025-01-15');
    });
  });

  describe('formatAttributionDates', () => {
    it('formats dates as readable labels', () => {
      const info = {
        spansMidnight: true,
        startDate: '2025-01-15',
        endDate: '2025-01-16',
      };

      const result = formatAttributionDates(info, 'UTC');

      expect(result.startLabel).toBe('Wed, Jan 15');
      expect(result.endLabel).toBe('Thu, Jan 16');
    });

    it('handles month boundaries', () => {
      const info = {
        spansMidnight: true,
        startDate: '2025-01-31',
        endDate: '2025-02-01',
      };

      const result = formatAttributionDates(info, 'UTC');

      expect(result.startLabel).toBe('Fri, Jan 31');
      expect(result.endLabel).toBe('Sat, Feb 1');
    });

    it('falls back to raw date string for invalid timezone', () => {
      const info = {
        spansMidnight: true,
        startDate: '2025-01-15',
        endDate: '2025-01-16',
      };

      const result = formatAttributionDates(info, 'Invalid/Timezone');

      expect(result.startLabel).toBe('2025-01-15');
      expect(result.endLabel).toBe('2025-01-16');
    });
  });
});
