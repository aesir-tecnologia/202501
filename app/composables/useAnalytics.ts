import { ref, computed, readonly } from 'vue'
import type { TypedSupabaseClient } from '~/utils/supabase'
import type { StintRow } from '~/lib/supabase/stints'

/**
 * Aggregated analytics data
 */
export interface AnalyticsData {
  totalStints: number
  totalFocusHours: number
  completionRate: number
  avgStintsPerDay: number
  dailyData: Array<{ date: string, stints: number, hours: number }>
  weeklyData: Array<{ week: string, stints: number, hours: number }>
  monthlyData: Array<{ month: string, stints: number, hours: number }>
  projectData: Array<{ projectId: string, projectName: string, stints: number, hours: number }>
}

/**
 * Composable for analytics data fetching and aggregation
 *
 * Provides computed analytics metrics from stint data with date range filtering.
 *
 * Usage:
 * ```ts
 * const { analyticsData, isLoading, fetchAnalytics } = useAnalytics()
 * await fetchAnalytics({ dateRange: 'last30days' })
 * ```
 */
export function useAnalytics(clientOverride?: TypedSupabaseClient) {
  const client: TypedSupabaseClient = clientOverride ?? (useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient)

  const stints = ref<StintRow[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * Fetch stints based on date range
   */
  async function fetchAnalytics(options: {
    dateRange?: 'last7days' | 'last30days' | 'last90days' | 'thisYear'
    projectId?: string
  } = {}): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      // Calculate date range
      const endDate = new Date()
      let startDate = new Date()

      switch (options.dateRange) {
        case 'last7days':
          startDate.setDate(endDate.getDate() - 7)
          break
        case 'last30days':
          startDate.setDate(endDate.getDate() - 30)
          break
        case 'last90days':
          startDate.setDate(endDate.getDate() - 90)
          break
        case 'thisYear':
          startDate = new Date(endDate.getFullYear(), 0, 1)
          break
        default:
          startDate.setDate(endDate.getDate() - 30)
      }

      // Fetch stints from Supabase
      let query = client
        .from('stints')
        .select('*')
        .gte('started_at', startDate.toISOString())
        .lte('started_at', endDate.toISOString())
        .order('started_at', { ascending: true })

      if (options.projectId) {
        query = query.eq('project_id', options.projectId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        error.value = fetchError
        return
      }

      stints.value = data || []
    }
    catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to fetch analytics')
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Compute analytics data from stints
   */
  const analyticsData = computed<AnalyticsData>(() => {
    const totalStints = stints.value.length
    const totalFocusMinutes = stints.value.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
    const totalFocusHours = Math.round((totalFocusMinutes / 60) * 10) / 10
    const completedStints = stints.value.filter(s => s.is_completed).length
    const completionRate = totalStints > 0 ? Math.round((completedStints / totalStints) * 100) : 0

    // Calculate date range for avg
    const dates = stints.value.map(s => new Date(s.started_at))
    const uniqueDays = new Set(dates.map(d => d.toDateString())).size
    const avgStintsPerDay = uniqueDays > 0 ? Math.round((totalStints / uniqueDays) * 10) / 10 : 0

    // Daily aggregation
    const dailyMap = new Map<string, { stints: number, minutes: number }>()
    stints.value.forEach((stint) => {
      const date = new Date(stint.started_at).toISOString().split('T')[0] || ''
      const existing = dailyMap.get(date) || { stints: 0, minutes: 0 }
      dailyMap.set(date, {
        stints: existing.stints + 1,
        minutes: existing.minutes + (stint.duration_minutes || 0),
      })
    })

    const dailyData = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      stints: data.stints,
      hours: Math.round((data.minutes / 60) * 10) / 10,
    }))

    // Weekly aggregation (simplified - by week number)
    const weeklyMap = new Map<string, { stints: number, minutes: number }>()
    stints.value.forEach((stint) => {
      const date = new Date(stint.started_at)
      const week = `Week ${getWeekNumber(date)}`
      const existing = weeklyMap.get(week) || { stints: 0, minutes: 0 }
      weeklyMap.set(week, {
        stints: existing.stints + 1,
        minutes: existing.minutes + (stint.duration_minutes || 0),
      })
    })

    const weeklyData = Array.from(weeklyMap.entries()).map(([week, data]) => ({
      week,
      stints: data.stints,
      hours: Math.round((data.minutes / 60) * 10) / 10,
    }))

    // Monthly aggregation
    const monthlyMap = new Map<string, { stints: number, minutes: number }>()
    stints.value.forEach((stint) => {
      const date = new Date(stint.started_at)
      const month = date.toLocaleString('default', { month: 'short', year: 'numeric' })
      const existing = monthlyMap.get(month) || { stints: 0, minutes: 0 }
      monthlyMap.set(month, {
        stints: existing.stints + 1,
        minutes: existing.minutes + (stint.duration_minutes || 0),
      })
    })

    const monthlyData = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      stints: data.stints,
      hours: Math.round((data.minutes / 60) * 10) / 10,
    }))

    // Project aggregation (simplified - no project names yet)
    const projectMap = new Map<string, { stints: number, minutes: number }>()
    stints.value.forEach((stint) => {
      const projectId = stint.project_id
      const existing = projectMap.get(projectId) || { stints: 0, minutes: 0 }
      projectMap.set(projectId, {
        stints: existing.stints + 1,
        minutes: existing.minutes + (stint.duration_minutes || 0),
      })
    })

    const projectData = Array.from(projectMap.entries()).map(([projectId, data]) => ({
      projectId,
      projectName: `Project ${projectId.slice(0, 8)}`,
      stints: data.stints,
      hours: Math.round((data.minutes / 60) * 10) / 10,
    }))

    return {
      totalStints,
      totalFocusHours,
      completionRate,
      avgStintsPerDay,
      dailyData,
      weeklyData,
      monthlyData,
      projectData,
    }
  })

  return {
    // State
    analyticsData: readonly(analyticsData),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Methods
    fetchAnalytics,
  }
}

/**
 * Helper to get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
