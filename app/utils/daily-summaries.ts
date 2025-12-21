import type { DailySummaryResult, ProjectBreakdownItem as DbProjectBreakdown } from '~/lib/supabase/daily-summaries';
import type { DailySummary, ProjectBreakdownItem, DailySummaryFilters } from '~/schemas/daily-summaries';

export function isValidDbProjectBreakdownItem(item: unknown): item is DbProjectBreakdown {
  return (
    item !== null
    && typeof item === 'object'
    && 'project_id' in item
    && typeof (item as DbProjectBreakdown).project_id === 'string'
    && 'project_name' in item
    && typeof (item as DbProjectBreakdown).project_name === 'string'
    && 'stint_count' in item
    && typeof (item as DbProjectBreakdown).stint_count === 'number'
    && 'focus_seconds' in item
    && typeof (item as DbProjectBreakdown).focus_seconds === 'number'
  );
}

export function transformProjectBreakdown(
  breakdown: unknown,
): ProjectBreakdownItem[] {
  if (!breakdown || !Array.isArray(breakdown)) {
    if (breakdown !== null && breakdown !== undefined) {
      console.warn('[daily-summaries] project_breakdown is not an array:', typeof breakdown);
    }
    return [];
  }

  const validItems: ProjectBreakdownItem[] = [];
  const invalidItems: unknown[] = [];

  for (const item of breakdown) {
    if (isValidDbProjectBreakdownItem(item)) {
      validItems.push({
        projectId: item.project_id,
        projectName: item.project_name,
        stintCount: item.stint_count,
        focusSeconds: item.focus_seconds,
      });
    }
    else {
      invalidItems.push(item);
    }
  }

  if (invalidItems.length > 0) {
    console.error('[daily-summaries] Filtered invalid project breakdown items:', invalidItems);
  }

  return validItems;
}

export function transformDailySummary(row: DailySummaryResult): DailySummary {
  return {
    id: row.id,
    userId: row.user_id || '',
    date: row.date,
    totalStints: row.total_stints,
    totalFocusSeconds: row.total_focus_seconds,
    totalPauseSeconds: row.total_pause_seconds,
    projectBreakdown: transformProjectBreakdown(row.project_breakdown),
    completedAt: row.completed_at,
  };
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export function getDateRange(
  period: 'today' | 'week' | 'month' | 'year',
): DailySummaryFilters {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0]!;
  let startDate: string;

  switch (period) {
    case 'today':
      startDate = endDate;
      break;
    case 'week': {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo.toISOString().split('T')[0]!;
      break;
    }
    case 'month': {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      startDate = monthAgo.toISOString().split('T')[0]!;
      break;
    }
    case 'year': {
      const yearAgo = new Date(today);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      startDate = yearAgo.toISOString().split('T')[0]!;
      break;
    }
  }

  return { startDate, endDate };
}

export function hasSummaryForDate(
  summaries: DailySummary[],
  date: string,
): boolean {
  return summaries.some(s => s.date === date);
}
