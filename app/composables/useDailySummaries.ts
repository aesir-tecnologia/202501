import { useQuery } from '@tanstack/vue-query';
import type { MaybeRef } from 'vue';
import { useTypedSupabaseClient } from '~/utils/supabase';
import {
  listDailySummaries,
  getDailySummary,
  getWeeklyStats,
} from '~/lib/supabase/daily-summaries';
import type {
  DailySummaryFilters as DbFilters,
} from '~/lib/supabase/daily-summaries';
import type {
  DailySummary,
  DailySummaryFilters,
  WeeklyStats,
} from '~/schemas/daily-summaries';
import { transformDailySummary, transformProjectBreakdown } from '~/utils/daily-summaries';

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
// Computed Types
// ============================================================================

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
  const client = useTypedSupabaseClient();

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
  const client = useTypedSupabaseClient();

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
  const client = useTypedSupabaseClient();

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
        projectBreakdown: transformProjectBreakdown(data.projectBreakdown),
      };
      return transformedStats;
    },
    staleTime: 5 * 60 * 1000,
  });
}
