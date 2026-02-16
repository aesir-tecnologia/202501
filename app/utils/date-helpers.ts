import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';
import type { StintRow } from '~/lib/supabase/stints';
import { createLogger } from '~/utils/logger';

const log = createLogger('date-helpers');

export function parseSafeDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    log.warn(`Invalid date string: ${dateString}`);
    return null;
  }

  return date;
}

/** Formats a Date as YYYY-MM-DD in the given timezone, with UTC fallback for invalid timezones. */
export function formatDateYMD(date: Date, timezone: string): string {
  if (isNaN(date.getTime())) {
    log.error('formatDateYMD received invalid date, using current date in UTC', { timezone, date: String(date) });
    return format(new TZDate(new Date(), 'UTC'), 'yyyy-MM-dd');
  }

  try {
    const tzDate = new TZDate(date, timezone);
    if (isNaN(tzDate.getTime())) {
      log.error('TZDate produced NaN, falling back to UTC', { timezone, date: date.toISOString() });
      return format(new TZDate(date, 'UTC'), 'yyyy-MM-dd');
    }
    return format(tzDate, 'yyyy-MM-dd');
  }
  catch (error) {
    if (!(error instanceof RangeError)) throw error;
    log.error('Failed to format date in timezone, falling back to UTC', { timezone, date: date.toISOString(), error });
    return format(new TZDate(date, 'UTC'), 'yyyy-MM-dd');
  }
}

/** Gets today's date in YYYY-MM-DD format for a given timezone. */
export function getTodayInTimezone(timezone: string): string {
  return formatDateYMD(new Date(), timezone);
}

/** Returns the effective date a stint counts toward: attributed_date > ended_at in timezone > null. */
export function getStintEffectiveDate(stint: StintRow, timezone: string): string | null {
  if (stint.attributed_date) return stint.attributed_date;
  const endedAt = parseSafeDate(stint.ended_at);
  if (!endedAt) return null;
  return formatDateYMD(endedAt, timezone);
}
