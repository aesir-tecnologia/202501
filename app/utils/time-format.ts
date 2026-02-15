interface FormatDurationOptions {
  dash?: boolean
  delta?: boolean
}

export function formatCountdown(seconds: number): string {
  if (!Number.isFinite(seconds)) return '--:--';

  const negative = seconds < 0;
  const abs = Math.abs(Math.floor(seconds));
  const hours = Math.floor(abs / 3600);
  const mins = Math.floor((abs % 3600) / 60);
  const secs = abs % 60;

  const prefix = negative ? '-' : '';

  if (hours > 0) {
    return `${prefix}${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${prefix}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDuration(seconds: number, options?: FormatDurationOptions): string {
  if (!Number.isFinite(seconds)) return options?.dash ? '-' : '0s';
  if (options?.delta && seconds <= 0) return '';
  if (seconds <= 0) return options?.dash ? '-' : '0s';

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  let result: string;

  if (hours > 0) {
    result = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  else if (mins > 0) {
    result = secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  else {
    result = `${secs}s`;
  }

  return options?.delta ? `+${result}` : result;
}

export function formatClockTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatRelativeTime(date: Date, referenceDate: Date): string {
  const diffMs = referenceDate.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function formatTimestamp(isoString: string | null): string {
  if (!isoString) return '\u2014';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '\u2014';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
