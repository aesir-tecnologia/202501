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
