import { describe, it, expect } from 'vitest';
import {
  calculateStintTime,
  calculateRemainingSeconds,
  formatStintTime,
  formatStintTimeCompact,
} from './stint-time';
import type { StintRow } from '~/lib/supabase/stints';

// NOTE: planned_duration is in SECONDS (25 minutes = 1500 seconds)
function createMockStint(overrides: Partial<StintRow> = {}): StintRow {
  return {
    id: 'stint-1',
    user_id: 'user-1',
    project_id: 'project-1',
    status: 'active',
    planned_duration: 1500, // 25 minutes in seconds
    started_at: new Date('2025-01-01T10:00:00Z').toISOString(),
    paused_at: null,
    paused_duration: 0,
    ended_at: null,
    actual_duration: null,
    completion_type: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('stint-time utils', () => {
  describe('calculateStintTime', () => {
    it('calculates remaining time for active stint', () => {
      const stint = createMockStint();
      const referenceTime = new Date('2025-01-01T10:10:00Z');

      const result = calculateStintTime(stint, referenceTime);

      expect(result.remainingSeconds).toBe(15 * 60);
      expect(result.elapsedSeconds).toBe(10 * 60);
      expect(result.plannedDurationSeconds).toBe(25 * 60);
      expect(result.pausedDurationSeconds).toBe(0);
    });

    it('calculates remaining time for paused stint', () => {
      const stint = createMockStint({
        status: 'paused',
        paused_at: new Date('2025-01-01T10:10:00Z').toISOString(),
        paused_duration: 0,
      });
      const referenceTime = new Date('2025-01-01T10:20:00Z');

      const result = calculateStintTime(stint, referenceTime);

      expect(result.remainingSeconds).toBe(15 * 60);
      expect(result.elapsedSeconds).toBe(10 * 60);
    });

    it('accounts for accumulated paused duration in active stint', () => {
      const stint = createMockStint({
        paused_duration: 5 * 60,
      });
      const referenceTime = new Date('2025-01-01T10:15:00Z');

      const result = calculateStintTime(stint, referenceTime);

      expect(result.remainingSeconds).toBe(15 * 60);
      expect(result.pausedDurationSeconds).toBe(5 * 60);
    });

    it('accounts for accumulated paused duration in paused stint', () => {
      const stint = createMockStint({
        status: 'paused',
        paused_at: new Date('2025-01-01T10:20:00Z').toISOString(),
        paused_duration: 5 * 60,
      });
      const referenceTime = new Date('2025-01-01T10:30:00Z');

      const result = calculateStintTime(stint, referenceTime);

      expect(result.remainingSeconds).toBe(10 * 60);
    });

    it('returns 0 when timer has expired', () => {
      const stint = createMockStint();
      const referenceTime = new Date('2025-01-01T10:30:00Z');

      const result = calculateStintTime(stint, referenceTime);

      expect(result.remainingSeconds).toBe(0);
    });

    it('never returns negative remaining time', () => {
      const stint = createMockStint();
      const referenceTime = new Date('2025-01-01T11:00:00Z');

      const result = calculateStintTime(stint, referenceTime);

      expect(result.remainingSeconds).toBe(0);
    });

    it('handles missing started_at gracefully', () => {
      const stint = createMockStint({ started_at: null });

      const result = calculateStintTime(stint);

      expect(result.remainingSeconds).toBe(0);
      expect(result.elapsedSeconds).toBe(0);
    });

    it('handles missing planned_duration gracefully', () => {
      const stint = createMockStint({ planned_duration: undefined as unknown as number });

      const result = calculateStintTime(stint);

      expect(result.remainingSeconds).toBe(0);
    });

    it('calculates correct endTime for timer worker', () => {
      const stint = createMockStint();

      const result = calculateStintTime(stint);

      const startedAt = new Date(stint.started_at!).getTime();
      const expectedEndTime = startedAt + 25 * 60 * 1000;
      expect(result.endTime).toBe(expectedEndTime);
    });

    it('includes pausedDuration in endTime calculation', () => {
      const stint = createMockStint({ paused_duration: 5 * 60 });

      const result = calculateStintTime(stint);

      const startedAt = new Date(stint.started_at!).getTime();
      const expectedEndTime = startedAt + (25 + 5) * 60 * 1000;
      expect(result.endTime).toBe(expectedEndTime);
    });
  });

  describe('calculateRemainingSeconds', () => {
    it('returns remaining seconds for active stint', () => {
      const stint = createMockStint();
      const referenceTime = new Date('2025-01-01T10:10:00Z');

      const result = calculateRemainingSeconds(stint, referenceTime);

      expect(result).toBe(15 * 60);
    });

    it('returns 0 for expired stint', () => {
      const stint = createMockStint();
      const referenceTime = new Date('2025-01-01T11:00:00Z');

      const result = calculateRemainingSeconds(stint, referenceTime);

      expect(result).toBe(0);
    });
  });

  describe('formatStintTime', () => {
    it('formats 0 seconds as 00:00', () => {
      expect(formatStintTime(0)).toBe('00:00');
    });

    it('formats seconds with padding', () => {
      expect(formatStintTime(5)).toBe('00:05');
    });

    it('formats minutes and seconds', () => {
      expect(formatStintTime(65)).toBe('01:05');
    });

    it('formats 10 minutes', () => {
      expect(formatStintTime(600)).toBe('10:00');
    });

    it('formats over 60 minutes with hours', () => {
      expect(formatStintTime(3661)).toBe('1:01:01');
    });

    it('formats 25 minutes (standard stint)', () => {
      expect(formatStintTime(25 * 60)).toBe('25:00');
    });

    it('formats 90 minutes as 1:30:00', () => {
      expect(formatStintTime(90 * 60)).toBe('1:30:00');
    });
  });

  describe('formatStintTimeCompact', () => {
    it('delegates to formatStintTime', () => {
      expect(formatStintTimeCompact(0)).toBe('00:00');
      expect(formatStintTimeCompact(65)).toBe('01:05');
      expect(formatStintTimeCompact(3661)).toBe('1:01:01');
    });
  });
});
