import { describe, expect, it } from 'vitest';
import type { StintRow } from '~/lib/supabase/stints';
import { getStintEffectiveDate, getTodayInTimezone, parseSafeDate } from './date-helpers';

function makeStint(overrides: Partial<StintRow> = {}): StintRow {
  return {
    id: 'test-stint',
    project_id: 'test-project',
    user_id: 'test-user',
    status: 'completed',
    started_at: '2026-02-11T10:00:00Z',
    ended_at: '2026-02-11T11:00:00Z',
    attributed_date: null,
    actual_duration: 3600,
    completion_type: 'manual',
    created_at: '2026-02-11T10:00:00Z',
    notes: null,
    paused_at: null,
    paused_duration: 0,
    planned_duration: 3600,
    updated_at: '2026-02-11T11:00:00Z',
    ...overrides,
  };
}

describe('parseSafeDate', () => {
  it('parses a valid ISO date string', () => {
    const result = parseSafeDate('2026-02-11T10:00:00Z');
    expect(result).toBeInstanceOf(Date);
    expect(result!.toISOString()).toBe('2026-02-11T10:00:00.000Z');
  });

  it('returns null for null input', () => {
    expect(parseSafeDate(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(parseSafeDate(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseSafeDate('')).toBeNull();
  });

  it('returns null for invalid date string', () => {
    expect(parseSafeDate('not-a-date')).toBeNull();
  });
});

describe('getStintEffectiveDate', () => {
  it('returns attributed_date when present', () => {
    const stint = makeStint({ attributed_date: '2026-02-10' });
    expect(getStintEffectiveDate(stint, 'UTC')).toBe('2026-02-10');
  });

  it('prefers attributed_date over ended_at', () => {
    const stint = makeStint({
      attributed_date: '2026-02-10',
      ended_at: '2026-02-11T11:00:00Z',
    });
    expect(getStintEffectiveDate(stint, 'UTC')).toBe('2026-02-10');
  });

  it('falls back to ended_at formatted as yyyy-MM-dd when no attributed_date', () => {
    const stint = makeStint({
      attributed_date: null,
      ended_at: '2026-02-11T15:30:00Z',
    });
    const result = getStintEffectiveDate(stint, 'UTC');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns null when neither attributed_date nor ended_at exist', () => {
    const stint = makeStint({
      attributed_date: null,
      ended_at: null,
    });
    expect(getStintEffectiveDate(stint, 'UTC')).toBeNull();
  });

  it('respects timezone parameter when formatting ended_at', () => {
    // UTC: 2026-02-15 23:30 → Feb 15
    // Asia/Tokyo (+9): 2026-02-16 08:30 → Feb 16
    const stint = makeStint({
      attributed_date: null,
      ended_at: '2026-02-15T23:30:00Z',
    });

    const dateInUTC = getStintEffectiveDate(stint, 'UTC');
    const dateInTokyo = getStintEffectiveDate(stint, 'Asia/Tokyo');

    expect(dateInUTC).toBe('2026-02-15');
    expect(dateInTokyo).toBe('2026-02-16');
  });
});

describe('getTodayInTimezone', () => {
  it('formats current date in given timezone', () => {
    const result = getTodayInTimezone('UTC');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('handles different timezones for the same instant', () => {
    // This test verifies the function runs without error
    // Exact dates depend on when test runs, so we only verify format
    const utc = getTodayInTimezone('UTC');
    const tokyo = getTodayInTimezone('Asia/Tokyo');

    expect(utc).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(tokyo).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Note: Dates *may* differ depending on when test runs
    // (e.g., midnight in Tokyo is still "yesterday" in UTC)
  });

  it('falls back to UTC for invalid timezone', () => {
    const result = getTodayInTimezone('Invalid/Timezone');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
