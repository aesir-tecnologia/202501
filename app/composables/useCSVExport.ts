import type { AnalyticsData } from './useAnalytics'

/**
 * Composable for exporting analytics data to CSV
 *
 * Usage:
 * ```ts
 * const { exportToCSV } = useCSVExport()
 * await exportToCSV(analyticsData)
 * ```
 */
export function useCSVExport() {
  const isExporting = ref(false)
  const error = ref<Error | null>(null)

  /**
   * Convert data to CSV format
   */
  function convertToCSV(headers: string[], rows: string[][]): string {
    const csvRows = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ]
    return csvRows.join('\n')
  }

  /**
   * Export analytics data to CSV
   */
  async function exportToCSV(
    data: AnalyticsData,
    options: {
      includeDaily?: boolean
      includeWeekly?: boolean
      includeMonthly?: boolean
      includeProjects?: boolean
    } = {},
  ): Promise<void> {
    isExporting.value = true
    error.value = null

    try {
      const {
        includeDaily = true,
        includeWeekly = true,
        includeMonthly = true,
        includeProjects = true,
      } = options

      let csvContent = ''

      // Summary section
      csvContent += 'FOCUS LEDGER SUMMARY\n'
      csvContent += `Generated,${new Date().toISOString()}\n`
      csvContent += `Total Stints,${data.totalStints}\n`
      csvContent += `Total Focus Hours,${data.totalFocusHours}\n`
      csvContent += `Completion Rate,${data.completionRate}%\n`
      csvContent += `Average Stints per Day,${data.avgStintsPerDay}\n`
      csvContent += '\n'

      // Daily data
      if (includeDaily && data.dailyData.length > 0) {
        csvContent += 'DAILY ACTIVITY\n'
        csvContent += convertToCSV(
          ['Date', 'Stints', 'Hours'],
          data.dailyData.map(d => [d.date, String(d.stints), String(d.hours)]),
        )
        csvContent += '\n\n'
      }

      // Weekly data
      if (includeWeekly && data.weeklyData.length > 0) {
        csvContent += 'WEEKLY ACTIVITY\n'
        csvContent += convertToCSV(
          ['Week', 'Stints', 'Hours'],
          data.weeklyData.map(w => [w.week, String(w.stints), String(w.hours)]),
        )
        csvContent += '\n\n'
      }

      // Monthly data
      if (includeMonthly && data.monthlyData.length > 0) {
        csvContent += 'MONTHLY ACTIVITY\n'
        csvContent += convertToCSV(
          ['Month', 'Stints', 'Hours'],
          data.monthlyData.map(m => [m.month, String(m.stints), String(m.hours)]),
        )
        csvContent += '\n\n'
      }

      // Project data
      if (includeProjects && data.projectData.length > 0) {
        csvContent += 'PROJECT BREAKDOWN\n'
        csvContent += convertToCSV(
          ['Project ID', 'Project Name', 'Stints', 'Hours'],
          data.projectData.map(p => [p.projectId, p.projectName, String(p.stints), String(p.hours)]),
        )
      }

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0]
      link.download = `focus-ledger-data-${timestamp}.csv`

      // Trigger download
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
    catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to export CSV')
      throw error.value
    }
    finally {
      isExporting.value = false
    }
  }

  return {
    isExporting: readonly(isExporting),
    error: readonly(error),
    exportToCSV,
  }
}
