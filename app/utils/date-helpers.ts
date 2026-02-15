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

/** Gets today's date in YYYY-MM-DD format for a given timezone. */
export function getTodayInTimezone(timezone: string): string {
  try {
    return format(new TZDate(new Date(), timezone), 'yyyy-MM-dd');
  }
  catch (error) {
    log.error('Failed to get today in timezone, falling back to UTC', { timezone, error });
    return format(new TZDate(new Date(), 'UTC'), 'yyyy-MM-dd');
  }
}

/** Returns the effective date a stint counts toward: attributed_date > ended_at in timezone > null. */
export function getStintEffectiveDate(stint: StintRow, timezone: string): string | null {
  if (stint.attributed_date) return stint.attributed_date;
  const endedAt = parseSafeDate(stint.ended_at);
  if (!endedAt) return null;

  try {
    return format(new TZDate(endedAt, timezone), 'yyyy-MM-dd');
  }
  catch (error) {
    log.error('Failed to format ended_at in timezone, falling back to UTC', {
      timezone,
      date: endedAt.toISOString(),
      error,
    });
    return format(new TZDate(endedAt, 'UTC'), 'yyyy-MM-dd');
  }
}
