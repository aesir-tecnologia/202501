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

export function getStintEffectiveDate(stint: StintRow): string | null {
  if (stint.attributed_date) return stint.attributed_date;
  const endedAt = parseSafeDate(stint.ended_at);
  if (endedAt) return format(endedAt, 'yyyy-MM-dd');
  return null;
}
