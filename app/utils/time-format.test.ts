import { describe, it, expect } from 'vitest';
import { formatCountdown, formatDuration, formatClockTime, formatRelativeTime, formatTimestamp } from './time-format';

describe('time-format utils', () => {
  describe('formatCountdown', () => {
    it('formats 0 seconds as 00:00', () => {
      expect(formatCountdown(0)).toBe('00:00');
    });

    it('formats seconds with padding', () => {
      expect(formatCountdown(5)).toBe('00:05');
    });

    it('formats minutes and seconds', () => {
      expect(formatCountdown(65)).toBe('01:05');
    });

    it('formats 10 minutes', () => {
      expect(formatCountdown(600)).toBe('10:00');
    });

    it('formats 25 minutes (standard stint)', () => {
      expect(formatCountdown(25 * 60)).toBe('25:00');
    });

    it('formats over 60 minutes with hours', () => {
      expect(formatCountdown(3661)).toBe('1:01:01');
    });

    it('formats 90 minutes as 1:30:00', () => {
      expect(formatCountdown(90 * 60)).toBe('1:30:00');
    });

    it('returns --:-- for NaN', () => {
      expect(formatCountdown(NaN)).toBe('--:--');
    });

    it('returns --:-- for Infinity', () => {
      expect(formatCountdown(Infinity)).toBe('--:--');
    });

    it('returns --:-- for -Infinity', () => {
      expect(formatCountdown(-Infinity)).toBe('--:--');
    });

    it('prefixes - for negative seconds', () => {
      expect(formatCountdown(-330)).toBe('-05:30');
    });

    it('prefixes - for negative value with hours', () => {
      expect(formatCountdown(-3661)).toBe('-1:01:01');
    });
  });

  describe('formatDuration', () => {
    it('returns 0s for zero', () => {
      expect(formatDuration(0)).toBe('0s');
    });

    it('formats seconds under a minute', () => {
      expect(formatDuration(45)).toBe('45s');
    });

    it('formats exact minutes', () => {
      expect(formatDuration(300)).toBe('5m');
    });

    it('formats minutes with seconds', () => {
      expect(formatDuration(310)).toBe('5m 10s');
    });

    it('formats exact hours', () => {
      expect(formatDuration(3600)).toBe('1h');
    });

    it('formats hours with minutes, dropping seconds', () => {
      expect(formatDuration(3665)).toBe('1h 1m');
    });

    it('formats multi-hour durations', () => {
      expect(formatDuration(2 * 3600 + 15 * 60)).toBe('2h 15m');
    });

    it('returns 0s for NaN', () => {
      expect(formatDuration(NaN)).toBe('0s');
    });

    it('returns 0s for Infinity', () => {
      expect(formatDuration(Infinity)).toBe('0s');
    });

    describe('dash option', () => {
      it('returns dash for zero', () => {
        expect(formatDuration(0, { dash: true })).toBe('-');
      });

      it('returns dash for negative', () => {
        expect(formatDuration(-5, { dash: true })).toBe('-');
      });

      it('formats normally for non-zero', () => {
        expect(formatDuration(310, { dash: true })).toBe('5m 10s');
      });
    });

    describe('delta option', () => {
      it('returns empty string for zero', () => {
        expect(formatDuration(0, { delta: true })).toBe('');
      });

      it('returns empty string for negative', () => {
        expect(formatDuration(-10, { delta: true })).toBe('');
      });

      it('prefixes + for positive seconds', () => {
        expect(formatDuration(30, { delta: true })).toBe('+30s');
      });

      it('prefixes + for positive minutes', () => {
        expect(formatDuration(90, { delta: true })).toBe('+1m 30s');
      });

      it('prefixes + for hours', () => {
        expect(formatDuration(3600, { delta: true })).toBe('+1h');
      });
    });
  });

  describe('formatClockTime', () => {
    it('formats morning time', () => {
      const date = new Date(2026, 0, 15, 9, 30);
      expect(formatClockTime(date)).toBe('9:30 AM');
    });

    it('formats afternoon time', () => {
      const date = new Date(2026, 0, 15, 14, 5);
      expect(formatClockTime(date)).toBe('2:05 PM');
    });

    it('formats midnight as 12:00 AM', () => {
      const date = new Date(2026, 0, 15, 0, 0);
      expect(formatClockTime(date)).toBe('12:00 AM');
    });

    it('formats noon as 12:00 PM', () => {
      const date = new Date(2026, 0, 15, 12, 0);
      expect(formatClockTime(date)).toBe('12:00 PM');
    });

    it('formats 11:59 PM', () => {
      const date = new Date(2026, 0, 15, 23, 59);
      expect(formatClockTime(date)).toBe('11:59 PM');
    });
  });

  describe('formatRelativeTime', () => {
    const ref = new Date(2026, 0, 15, 12, 0, 0);

    it('returns just now for less than 1 minute', () => {
      const date = new Date(ref.getTime() - 30_000);
      expect(formatRelativeTime(date, ref)).toBe('just now');
    });

    it('returns minutes ago for less than 60 minutes', () => {
      const date = new Date(ref.getTime() - 5 * 60_000);
      expect(formatRelativeTime(date, ref)).toBe('5m ago');
    });

    it('returns hours ago for less than 24 hours', () => {
      const date = new Date(ref.getTime() - 3 * 3600_000);
      expect(formatRelativeTime(date, ref)).toBe('3h ago');
    });

    it('returns days ago for 24 hours or more', () => {
      const date = new Date(ref.getTime() - 2 * 24 * 3600_000);
      expect(formatRelativeTime(date, ref)).toBe('2d ago');
    });
  });

  describe('formatTimestamp', () => {
    it('returns em dash for null', () => {
      expect(formatTimestamp(null)).toBe('\u2014');
    });

    it('returns em dash for invalid ISO string', () => {
      expect(formatTimestamp('not-a-date')).toBe('\u2014');
    });

    it('formats a valid ISO string', () => {
      const result = formatTimestamp('2026-01-15T14:30:00Z');
      expect(result).toMatch(/Jan/);
      expect(result).toMatch(/15/);
    });
  });
});
