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

/**
 * Gets today's date in YYYY-MM-DD format for a given timezone.
 * Uses TZDate from @date-fns/tz for timezone-aware date formatting.
 */
export function getTodayInTimezone(timezone: string): string {
  try {
    return format(new TZDate(new Date(), timezone), 'yyyy-MM-dd');
  }
  catch (error) {
    log.error('Failed to get today in timezone, falling back to UTC', { timezone, error });
    return format(new TZDate(new Date(), 'UTC'), 'yyyy-MM-dd');
  }
}

export function getStintEffectiveDate(stint: StintRow, timezone: string): string | null {
  if (stint.attributed_date) return stint.attributed_date;
  const endedAt = parseSafeDate(stint.ended_at);
  if (!endedAt) return null;

  try {
    return format(new TZDate(endedAt, timezone), 'yyyy-MM-dd');
  }
  catch (error) {
    const safeDate = isNaN(endedAt.getTime()) ? String(endedAt) : endedAt.toISOString();
    log.error('Failed to format ended_at in timezone, falling back to UTC', {
      timezone,
      date: safeDate,
      error,
    });
    return format(new TZDate(endedAt, 'UTC'), 'yyyy-MM-dd');
  }
}
