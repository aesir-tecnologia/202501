import type { StintRow } from '~/lib/supabase/stints';

export interface MidnightSpanInfo {
  spansMidnight: boolean
  startDate: string
  endDate: string
}

function getDateInTimezone(date: Date, timezone: string): string {
  try {
    return date.toLocaleDateString('en-CA', { timeZone: timezone });
  }
  catch {
    return date.toLocaleDateString('en-CA', { timeZone: 'UTC' });
  }
}

export function detectMidnightSpan(
  stint: StintRow,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
  referenceTime: Date = new Date(),
): MidnightSpanInfo {
  if (!stint.started_at) {
    const today = getDateInTimezone(referenceTime, timezone);
    return { spansMidnight: false, startDate: today, endDate: today };
  }

  const startedAt = new Date(stint.started_at);
  const endedAt = stint.ended_at ? new Date(stint.ended_at) : referenceTime;

  const startDate = getDateInTimezone(startedAt, timezone);
  const endDate = getDateInTimezone(endedAt, timezone);

  return {
    spansMidnight: startDate !== endDate,
    startDate,
    endDate,
  };
}

export function formatAttributionDates(
  info: MidnightSpanInfo,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
): { startLabel: string, endLabel: string } {
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: timezone,
    });
  };

  return {
    startLabel: formatDate(info.startDate),
    endLabel: formatDate(info.endDate),
  };
}
