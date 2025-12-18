import { useQuery } from '@tanstack/vue-query';
import type { MaybeRef } from 'vue';
import type { TypedSupabaseClient } from '~/utils/supabase';
import {
  listDailySummaries,
  getDailySummary,
  getWeeklyStats,
} from '~/lib/supabase/daily-summaries';
import type {
  DailySummaryFilters as DbFilters,
  DailySummaryResult,
  ProjectBreakdownItem as DbProjectBreakdown,
} from '~/lib/supabase/daily-summaries';
import type {
  DailySummary,
  DailySummaryFilters,
  ProjectBreakdownItem,
  WeeklyStats,
} from '~/schemas/daily-summaries';

// ============================================================================
// Query Key Factory
// ============================================================================

export const dailySummaryKeys = {
  all: ['daily-summaries'] as const,
  lists: () => [...dailySummaryKeys.all, 'list'] as const,
  list: (filters: DailySummaryFilters) => [...dailySummaryKeys.lists(), filters] as const,
  detail: (date: string) => [...dailySummaryKeys.all, 'detail', date] as const,
  weekly: () => [...dailySummaryKeys.all, 'weekly'] as const,
} as const;

// ============================================================================
// Transformation Utilities
// ============================================================================

function isValidProjectBreakdownItem(item: unknown): item is DbProjectBreakdown {
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

function transformProjectBreakdown(breakdown: unknown): ProjectBreakdownItem[] {
  if (!breakdown || !Array.isArray(breakdown)) return [];

  return breakdown
    .filter(isValidProjectBreakdownItem)
    .map(item => ({
      projectId: item.project_id,
      projectName: item.project_name,
      stintCount: item.stint_count,
      focusSeconds: item.focus_seconds,
    }));
}

function transformDailySummary(row: DailySummaryResult): DailySummary {
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

export interface DailySummaryWithComputed extends DailySummary {
  focusHours: number
  pauseHours: number
}

function addComputedFields(summary: DailySummary): DailySummaryWithComputed {
  return {
    ...summary,
    focusHours: summary.totalFocusSeconds / 3600,
    pauseHours: summary.totalPauseSeconds / 3600,
  };
}

// ============================================================================
// Query Hooks
// ============================================================================

export function useDailySummariesQuery(filters: MaybeRef<DailySummaryFilters>) {
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient;

  return useQuery({
    queryKey: computed(() => dailySummaryKeys.list(toValue(filters))),
    queryFn: async () => {
      const filterValue = toValue(filters);
      const dbFilters: DbFilters = {
        startDate: filterValue.startDate,
        endDate: filterValue.endDate,
      };

      const { data, error } = await listDailySummaries(client, dbFilters);
      if (error) throw error;
      return (data || []).map(transformDailySummary).map(addComputedFields);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - summaries don't change once created
  });
}

export function useDailySummaryQuery(date: MaybeRef<string>) {
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient;

  return useQuery({
    queryKey: computed(() => dailySummaryKeys.detail(toValue(date))),
    queryFn: async () => {
      const { data, error } = await getDailySummary(client, toValue(date));
      if (error) throw error;
      return data ? addComputedFields(transformDailySummary(data)) : null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useWeeklyStatsQuery() {
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient;

  return useQuery({
    queryKey: dailySummaryKeys.weekly(),
    queryFn: async () => {
      const { data, error } = await getWeeklyStats(client);
      if (error) throw error;
      if (!data) return null;

      const transformedStats: WeeklyStats = {
        totalStints: data.totalStints,
        totalFocusSeconds: data.totalFocusSeconds,
        totalPauseSeconds: data.totalPauseSeconds,
        daysTracked: data.daysTracked,
        projectBreakdown: data.projectBreakdown.map(item => ({
          projectId: item.project_id,
          projectName: item.project_name,
          stintCount: item.stint_count,
          focusSeconds: item.focus_seconds,
        })),
      };
      return transformedStats;
    },
    staleTime: 5 * 60 * 1000,
  });
}
