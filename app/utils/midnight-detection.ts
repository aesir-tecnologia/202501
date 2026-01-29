import { format } from 'date-fns';
import type { StintRow } from '~/lib/supabase/stints';

export interface MidnightSpanInfo {
  spansMidnight: boolean
  startDate: string
  endDate: string
}

/**
 * Gets the date in YYYY-MM-DD format for a given timezone.
 * Uses Intl.DateTimeFormat for timezone conversion since date-fns doesn't support timezones natively.
 */
function getDateInTimezone(date: Date, timezone: string): string {
  try {
    // Use Intl.DateTimeFormat to get the date parts in the target timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // en-CA locale returns YYYY-MM-DD format
  }
  catch {
    // Fallback to UTC if timezone conversion fails
    return format(date, 'yyyy-MM-dd');
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
 * Uses Intl.DateTimeFormat for timezone-aware formatting since date-fns doesn't support timezones natively.
 */
export function formatAttributionDates(
  info: MidnightSpanInfo,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
): { startLabel: string, endLabel: string } {
  const formatDate = (dateStr: string): string => {
    // Add T12:00:00 to avoid timezone edge cases around midnight
    const date = new Date(dateStr + 'T12:00:00');
    try {
      // Use Intl.DateTimeFormat for timezone-aware formatting
      const formatter = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: timezone,
      });
      return formatter.format(date);
    }
    catch {
      // Fallback to date-fns if timezone conversion fails
      return format(date, 'EEE, MMM d');
    }
  };

  return {
    startLabel: formatDate(info.startDate),
    endLabel: formatDate(info.endDate),
  };
}
