import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';
import type { StintRow } from '~/lib/supabase/stints';

export interface MidnightSpanInfo {
  spansMidnight: boolean
  startDate: string
  endDate: string
}

/**
 * Gets the date in YYYY-MM-DD format for a given timezone.
 * Uses TZDate from @date-fns/tz for timezone-aware date formatting.
 */
function getDateInTimezone(date: Date, timezone: string): string {
  try {
    return format(new TZDate(date, timezone), 'yyyy-MM-dd');
  }
  catch {
    return format(new TZDate(date, 'UTC'), 'yyyy-MM-dd');
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

/**
 * Formats the midnight span dates for display.
 * Uses TZDate from @date-fns/tz for timezone-aware formatting.
 */
export function formatAttributionDates(
  info: MidnightSpanInfo,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
): { startLabel: string, endLabel: string } {
  const formatDate = (dateStr: string): string => {
    // Add T12:00:00 to avoid timezone edge cases around midnight
    const date = new TZDate(new Date(dateStr + 'T12:00:00'), timezone);
    return format(date, 'EEE, MMM d');
  };

  return {
    startLabel: formatDate(info.startDate),
    endLabel: formatDate(info.endDate),
  };
}
