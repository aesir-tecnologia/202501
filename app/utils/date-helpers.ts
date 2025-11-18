export function parseSafeDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    console.warn(`[Date Parse Error] Invalid date string: ${dateString}`);
    return null;
  }

  return date;
}
