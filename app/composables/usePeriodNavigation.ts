import { ref, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  isToday,
  isYesterday,
  isSameWeek,
  isSameMonth,
  format,
} from 'date-fns';

export type PeriodType = 'daily' | 'weekly' | 'monthly';

export interface DateRange {
  startDate: string
  endDate: string
}

export interface UsePeriodNavigationReturn {
  periodType: Ref<PeriodType>
  currentDate: Ref<Date>
  dateRange: ComputedRef<DateRange>
  formattedLabel: ComputedRef<string>
  isCurrentPeriod: ComputedRef<boolean>
  previous: () => void
  next: () => void
  goToToday: () => void
  setPeriodType: (type: PeriodType) => void
}

function formatDateForQuery(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function getPeriodStart(date: Date, periodType: PeriodType): Date {
  switch (periodType) {
    case 'daily':
      return startOfDay(date);
    case 'weekly':
      return startOfWeek(date, { weekStartsOn: 1 });
    case 'monthly':
      return startOfMonth(date);
  }
}

function getPeriodEnd(date: Date, periodType: PeriodType): Date {
  switch (periodType) {
    case 'daily':
      return endOfDay(date);
    case 'weekly':
      return endOfWeek(date, { weekStartsOn: 1 });
    case 'monthly':
      return endOfMonth(date);
  }
}

function movePeriod(date: Date, periodType: PeriodType, direction: 'forward' | 'backward'): Date {
  const forward = direction === 'forward';
  switch (periodType) {
    case 'daily':
      return forward ? addDays(date, 1) : subDays(date, 1);
    case 'weekly':
      return forward ? addWeeks(date, 1) : subWeeks(date, 1);
    case 'monthly':
      return forward ? addMonths(date, 1) : subMonths(date, 1);
  }
}

function formatPeriodLabel(date: Date, periodType: PeriodType): string {
  const now = new Date();

  switch (periodType) {
    case 'daily':
      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'MMM d');

    case 'weekly': {
      if (isSameWeek(date, now, { weekStartsOn: 1 })) return 'This Week';
      if (isSameWeek(subWeeks(now, 1), date, { weekStartsOn: 1 })) return 'Last Week';
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;
    }

    case 'monthly':
      if (isSameMonth(date, now)) return 'This Month';
      if (isSameMonth(subMonths(now, 1), date)) return 'Last Month';
      return format(date, 'MMMM yyyy');
  }
}

function isInCurrentPeriod(date: Date, periodType: PeriodType): boolean {
  const now = new Date();
  switch (periodType) {
    case 'daily':
      return isToday(date);
    case 'weekly':
      return isSameWeek(date, now, { weekStartsOn: 1 });
    case 'monthly':
      return isSameMonth(date, now);
  }
}

export function usePeriodNavigation(initialPeriodType: PeriodType = 'daily'): UsePeriodNavigationReturn {
  const periodType = ref<PeriodType>(initialPeriodType);
  const currentDate = ref<Date>(new Date());

  const dateRange = computed<DateRange>(() => {
    const start = getPeriodStart(currentDate.value, periodType.value);
    const end = getPeriodEnd(currentDate.value, periodType.value);
    return {
      startDate: formatDateForQuery(start),
      endDate: formatDateForQuery(end),
    };
  });

  const formattedLabel = computed(() => {
    return formatPeriodLabel(currentDate.value, periodType.value);
  });

  const isCurrentPeriod = computed(() => {
    return isInCurrentPeriod(currentDate.value, periodType.value);
  });

  function previous() {
    currentDate.value = movePeriod(currentDate.value, periodType.value, 'backward');
  }

  function next() {
    if (!isCurrentPeriod.value) {
      currentDate.value = movePeriod(currentDate.value, periodType.value, 'forward');
    }
  }

  function goToToday() {
    currentDate.value = new Date();
  }

  function setPeriodType(type: PeriodType) {
    periodType.value = type;
    currentDate.value = new Date();
  }

  return {
    periodType,
    currentDate,
    dateRange,
    formattedLabel,
    isCurrentPeriod,
    previous,
    next,
    goToToday,
    setPeriodType,
  };
}
