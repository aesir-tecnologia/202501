import { describe, it, expect } from 'vitest';
import { formatCountdown, formatDuration } from './time-format';

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
});
