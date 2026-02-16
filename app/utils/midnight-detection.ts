import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';
import type { StintRow } from '~/lib/supabase/stints';
import { createLogger } from '~/utils/logger';
import { formatDateYMD } from '~/utils/date-helpers';

const log = createLogger('midnight-detection');

export interface MidnightSpanInfo {
  spansMidnight: boolean
  startDate: string
  endDate: string
}

export function detectMidnightSpan(
  stint: StintRow,
  timezone: string,
  referenceTime: Date = new Date(),
): MidnightSpanInfo {
  if (!stint.started_at) {
    const today = formatDateYMD(referenceTime, timezone);
    return { spansMidnight: false, startDate: today, endDate: today };
  }

  const startedAt = new Date(stint.started_at);
  const endedAt = stint.ended_at ? new Date(stint.ended_at) : referenceTime;

  const startDate = formatDateYMD(startedAt, timezone);
  const endDate = formatDateYMD(endedAt, timezone);

  return {
    spansMidnight: startDate !== endDate,
    startDate,
    endDate,
  };
}

/** Formats the midnight span dates for display. */
export function formatAttributionDates(
  info: MidnightSpanInfo,
  timezone: string,
): { startLabel: string, endLabel: string } {
  const formatDate = (dateStr: string): string => {
    try {
      const date = new TZDate(new Date(dateStr + 'T12:00:00'), timezone);
      return format(date, 'EEE, MMM d');
    }
    catch (error) {
      if (!(error instanceof RangeError)) throw error;
      log.error('Failed to format attribution date, returning raw date', { timezone, dateStr, error });
      return dateStr;
    }
  };

  return {
    startLabel: formatDate(info.startDate),
    endLabel: formatDate(info.endDate),
  };
}
