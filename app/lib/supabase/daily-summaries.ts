import type { Database, Json } from '~/types/database.types';
import type { TypedSupabaseClient } from '~/utils/supabase';

export type DailySummaryRow = Database['public']['Tables']['daily_summaries']['Row'];

export type DailySummaryRpcResult = Database['public']['Functions']['get_daily_summaries']['Returns'][number];

export interface DailySummaryResult {
  id: string
  date: string
  total_stints: number
  total_focus_seconds: number
  total_pause_seconds: number
  project_breakdown: Json
  completed_at: string
  user_id?: string // Optional since RPC doesn't return it
}

export interface ProjectBreakdownItem {
  project_id: string
  project_name: string
  stint_count: number
  focus_seconds: number
}

export interface DailySummaryFilters {
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
}

export interface WeeklyStats {
  totalStints: number
  totalFocusSeconds: number
  totalPauseSeconds: number
  daysTracked: number
  projectBreakdown: ProjectBreakdownItem[]
}

export type Result<T> = {
  data: T | null
  error: Error | null
};

async function requireUserId(client: TypedSupabaseClient): Promise<Result<string>> {
  const { data, error } = await client.auth.getUser();

  if (error || !data?.user) {
    return { data: null, error: new Error('User must be authenticated to view daily summaries') };
  }

  return { data: data.user.id, error: null };
}

export async function listDailySummaries(
  client: TypedSupabaseClient,
  filters: DailySummaryFilters,
): Promise<Result<DailySummaryResult[]>> {
  const userResult = await requireUserId(client);
  if (userResult.error || !userResult.data) {
    return { data: null, error: userResult.error || new Error('User ID unavailable') };
  }
  const userId = userResult.data;

  const { data, error } = await client.rpc('get_daily_summaries', {
    p_user_id: userId,
    p_start_date: filters.startDate,
    p_end_date: filters.endDate,
  });

  if (error) {
    return {
      data: null,
      error: new Error(error.message || 'Failed to fetch daily summaries'),
    };
  }

  return { data: data || [], error: null };
}

export async function getDailySummary(
  client: TypedSupabaseClient,
  date: string,
): Promise<Result<DailySummaryResult | null>> {
  const result = await listDailySummaries(client, { startDate: date, endDate: date });

  if (result.error) {
    return { data: null, error: result.error };
  }

  return { data: result.data?.[0] || null, error: null };
}

export async function getWeeklyStats(
  client: TypedSupabaseClient,
): Promise<Result<WeeklyStats>> {
  const userResult = await requireUserId(client);
  if (userResult.error || !userResult.data) {
    return { data: null, error: userResult.error || new Error('User ID unavailable') };
  }
  const userId = userResult.data;

  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const startDate = weekAgo.toISOString().split('T')[0]!;
  const endDate = today.toISOString().split('T')[0]!;

  const { data, error } = await client.rpc('get_daily_summaries', {
    p_user_id: userId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    return {
      data: null,
      error: new Error(error.message || 'Failed to fetch weekly stats'),
    };
  }

  const summaries = data || [];

  let totalStints = 0;
  let totalFocusSeconds = 0;
  let totalPauseSeconds = 0;
  const projectTotals: Map<string, ProjectBreakdownItem> = new Map();

  for (const summary of summaries) {
    totalStints += summary.total_stints;
    totalFocusSeconds += summary.total_focus_seconds;
    totalPauseSeconds += summary.total_pause_seconds;

    const breakdown = summary.project_breakdown as ProjectBreakdownItem[] | null;
    if (breakdown) {
      for (const project of breakdown) {
        const existing = projectTotals.get(project.project_id);
        if (existing) {
          existing.stint_count += project.stint_count;
          existing.focus_seconds += project.focus_seconds;
        }
        else {
          projectTotals.set(project.project_id, { ...project });
        }
      }
    }
  }

  const projectBreakdown = Array.from(projectTotals.values())
    .sort((a, b) => b.focus_seconds - a.focus_seconds);

  return {
    data: {
      totalStints,
      totalFocusSeconds,
      totalPauseSeconds,
      daysTracked: summaries.length,
      projectBreakdown,
    },
    error: null,
  };
}
