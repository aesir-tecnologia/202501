import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  format,
} from 'date-fns';
import { usePeriodNavigation } from './usePeriodNavigation';

describe('usePeriodNavigation', () => {
  let mockNow: Date;

  beforeEach(() => {
    mockNow = new Date('2025-01-17T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should default to daily period type', () => {
      const { periodType } = usePeriodNavigation();
      expect(periodType.value).toBe('daily');
    });

    it('should accept initial period type', () => {
      const { periodType } = usePeriodNavigation('weekly');
      expect(periodType.value).toBe('weekly');
    });

    it('should start with current date', () => {
      const { currentDate } = usePeriodNavigation();
      expect(currentDate.value.toDateString()).toBe(mockNow.toDateString());
    });
  });

  describe('daily navigation', () => {
    it('should return today date range for daily', () => {
      const { dateRange } = usePeriodNavigation('daily');

      expect(dateRange.value.startDate).toBe('2025-01-17');
      expect(dateRange.value.endDate).toBe('2025-01-17');
    });

    it('should navigate to yesterday on previous()', () => {
      const { dateRange, previous } = usePeriodNavigation('daily');

      previous();

      expect(dateRange.value.startDate).toBe('2025-01-16');
      expect(dateRange.value.endDate).toBe('2025-01-16');
    });

    it('should disable next() when on current period', () => {
      const { dateRange, isCurrentPeriod, next } = usePeriodNavigation('daily');

      expect(isCurrentPeriod.value).toBe(true);
      next();
      expect(dateRange.value.startDate).toBe('2025-01-17');
    });

    it('should allow next() when on historical period', () => {
      const { dateRange, previous, next } = usePeriodNavigation('daily');

      previous();
      expect(dateRange.value.startDate).toBe('2025-01-16');

      next();
      expect(dateRange.value.startDate).toBe('2025-01-17');
    });
  });

  describe('weekly navigation', () => {
    it('should return current week range (Mon-Sun)', () => {
      const { dateRange } = usePeriodNavigation('weekly');

      const expectedStart = startOfWeek(mockNow, { weekStartsOn: 1 });
      const expectedEnd = endOfWeek(mockNow, { weekStartsOn: 1 });

      expect(dateRange.value.startDate).toBe(format(expectedStart, 'yyyy-MM-dd'));
      expect(dateRange.value.endDate).toBe(format(expectedEnd, 'yyyy-MM-dd'));
    });

    it('should navigate to previous week', () => {
      const { dateRange, previous } = usePeriodNavigation('weekly');

      previous();

      const lastWeek = subWeeks(mockNow, 1);
      const expectedStart = startOfWeek(lastWeek, { weekStartsOn: 1 });
      const expectedEnd = endOfWeek(lastWeek, { weekStartsOn: 1 });

      expect(dateRange.value.startDate).toBe(format(expectedStart, 'yyyy-MM-dd'));
      expect(dateRange.value.endDate).toBe(format(expectedEnd, 'yyyy-MM-dd'));
    });
  });

  describe('monthly navigation', () => {
    it('should return current month range', () => {
      const { dateRange } = usePeriodNavigation('monthly');

      const expectedStart = startOfMonth(mockNow);
      const expectedEnd = endOfMonth(mockNow);

      expect(dateRange.value.startDate).toBe(format(expectedStart, 'yyyy-MM-dd'));
      expect(dateRange.value.endDate).toBe(format(expectedEnd, 'yyyy-MM-dd'));
    });

    it('should navigate to previous month', () => {
      const { dateRange, previous } = usePeriodNavigation('monthly');

      previous();

      const lastMonth = subMonths(mockNow, 1);
      const expectedStart = startOfMonth(lastMonth);
      const expectedEnd = endOfMonth(lastMonth);

      expect(dateRange.value.startDate).toBe(format(expectedStart, 'yyyy-MM-dd'));
      expect(dateRange.value.endDate).toBe(format(expectedEnd, 'yyyy-MM-dd'));
    });

    it('should handle month length variations', () => {
      vi.setSystemTime(new Date('2025-03-15T12:00:00.000Z'));
      const { dateRange, previous } = usePeriodNavigation('monthly');

      previous();

      expect(dateRange.value.startDate).toBe('2025-02-01');
      expect(dateRange.value.endDate).toBe('2025-02-28');
    });
  });

  describe('label formatting', () => {
    it('should show "Today" for current day', () => {
      const { formattedLabel } = usePeriodNavigation('daily');
      expect(formattedLabel.value).toBe('Today');
    });

    it('should show "Yesterday" for previous day', () => {
      const { formattedLabel, previous } = usePeriodNavigation('daily');
      previous();
      expect(formattedLabel.value).toBe('Yesterday');
    });

    it('should show formatted date for older days', () => {
      const { formattedLabel, previous } = usePeriodNavigation('daily');
      previous();
      previous();
      expect(formattedLabel.value).toBe('Jan 15');
    });

    it('should show "This Week" for current week', () => {
      const { formattedLabel } = usePeriodNavigation('weekly');
      expect(formattedLabel.value).toBe('This Week');
    });

    it('should show "Last Week" for previous week', () => {
      const { formattedLabel, previous } = usePeriodNavigation('weekly');
      previous();
      expect(formattedLabel.value).toBe('Last Week');
    });

    it('should show date range for older weeks', () => {
      const { formattedLabel, previous } = usePeriodNavigation('weekly');
      previous();
      previous();
      expect(formattedLabel.value).toMatch(/^\w{3} \d+ - \w{3} \d+$/);
    });

    it('should show "This Month" for current month', () => {
      const { formattedLabel } = usePeriodNavigation('monthly');
      expect(formattedLabel.value).toBe('This Month');
    });

    it('should show "Last Month" for previous month', () => {
      const { formattedLabel, previous } = usePeriodNavigation('monthly');
      previous();
      expect(formattedLabel.value).toBe('Last Month');
    });

    it('should show month name for older months', () => {
      const { formattedLabel, previous } = usePeriodNavigation('monthly');
      previous();
      previous();
      expect(formattedLabel.value).toBe('November 2024');
    });
  });

  describe('period switching', () => {
    it('should reset to current period when changing type', () => {
      const { periodType, dateRange, previous, setPeriodType } = usePeriodNavigation('daily');

      previous();
      previous();
      expect(dateRange.value.startDate).toBe('2025-01-15');

      setPeriodType('weekly');
      expect(periodType.value).toBe('weekly');

      const expectedStart = startOfWeek(mockNow, { weekStartsOn: 1 });
      expect(dateRange.value.startDate).toBe(format(expectedStart, 'yyyy-MM-dd'));
    });
  });

  describe('goToToday', () => {
    it('should return to current period', () => {
      const { dateRange, isCurrentPeriod, previous, goToToday } = usePeriodNavigation('daily');

      previous();
      previous();
      previous();
      expect(isCurrentPeriod.value).toBe(false);

      goToToday();
      expect(isCurrentPeriod.value).toBe(true);
      expect(dateRange.value.startDate).toBe('2025-01-17');
    });
  });

  describe('edge cases', () => {
    it('should handle year boundaries for daily', () => {
      vi.setSystemTime(new Date('2025-01-01T12:00:00.000Z'));
      const { dateRange, previous } = usePeriodNavigation('daily');

      previous();
      expect(dateRange.value.startDate).toBe('2024-12-31');
    });

    it('should handle year boundaries for weekly', () => {
      vi.setSystemTime(new Date('2025-01-01T12:00:00.000Z'));
      const { dateRange, previous } = usePeriodNavigation('weekly');

      previous();

      const lastWeekStart = startOfWeek(subWeeks(new Date('2025-01-01'), 1), { weekStartsOn: 1 });
      expect(dateRange.value.startDate).toBe(format(lastWeekStart, 'yyyy-MM-dd'));
    });

    it('should handle year boundaries for monthly', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const { dateRange, previous } = usePeriodNavigation('monthly');

      previous();
      expect(dateRange.value.startDate).toBe('2024-12-01');
      expect(dateRange.value.endDate).toBe('2024-12-31');
    });

    it('should handle leap year February', () => {
      vi.setSystemTime(new Date('2024-03-15T12:00:00.000Z'));
      const { dateRange, previous } = usePeriodNavigation('monthly');

      previous();
      expect(dateRange.value.startDate).toBe('2024-02-01');
      expect(dateRange.value.endDate).toBe('2024-02-29');
    });
  });
});
