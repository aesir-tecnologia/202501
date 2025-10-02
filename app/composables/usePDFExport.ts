import jsPDF from 'jspdf'
import type { AnalyticsData } from './useAnalytics'

/**
 * Composable for exporting analytics data to PDF
 *
 * Usage:
 * ```ts
 * const { exportToPDF } = usePDFExport()
 * await exportToPDF(analyticsData, { dateRange: 'Last 30 Days' })
 * ```
 */
export function usePDFExport() {
  const isExporting = ref(false)
  const error = ref<Error | null>(null)

  /**
   * Export analytics data to PDF
   */
  async function exportToPDF(
    data: AnalyticsData,
    options: {
      dateRange?: string
      title?: string
    } = {},
  ): Promise<void> {
    isExporting.value = true
    error.value = null

    try {
      // Create PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      // Header
      doc.setFontSize(20)
      doc.text('Focus Ledger Report', 20, 20)

      if (options.title) {
        doc.setFontSize(14)
        doc.text(options.title, 20, 30)
      }

      if (options.dateRange) {
        doc.setFontSize(10)
        doc.text(`Period: ${options.dateRange}`, 20, 38)
      }

      // Summary stats
      doc.setFontSize(12)
      doc.text('Summary Statistics', 20, 50)

      doc.setFontSize(10)
      const stats = [
        `Total Stints: ${data.totalStints}`,
        `Total Focus Hours: ${data.totalFocusHours}h`,
        `Completion Rate: ${data.completionRate}%`,
        `Average Stints per Day: ${data.avgStintsPerDay}`,
      ]

      let yPos = 60
      stats.forEach((stat) => {
        doc.text(stat, 20, yPos)
        yPos += 8
      })

      // Daily data table
      if (data.dailyData.length > 0) {
        yPos += 10
        doc.setFontSize(12)
        doc.text('Daily Activity', 20, yPos)
        yPos += 8

        doc.setFontSize(9)
        doc.text('Date', 20, yPos)
        doc.text('Stints', 80, yPos)
        doc.text('Hours', 130, yPos)
        yPos += 6

        doc.setLineWidth(0.5)
        doc.line(20, yPos, 190, yPos)
        yPos += 6

        // Show first 20 days
        const displayData = data.dailyData.slice(0, 20)
        displayData.forEach((day) => {
          if (yPos > 270) {
            doc.addPage()
            yPos = 20
          }

          doc.text(day.date, 20, yPos)
          doc.text(String(day.stints), 80, yPos)
          doc.text(`${day.hours}h`, 130, yPos)
          yPos += 6
        })
      }

      // Project breakdown
      if (data.projectData.length > 0) {
        yPos += 10
        if (yPos > 240) {
          doc.addPage()
          yPos = 20
        }

        doc.setFontSize(12)
        doc.text('Project Breakdown', 20, yPos)
        yPos += 8

        doc.setFontSize(9)
        doc.text('Project', 20, yPos)
        doc.text('Stints', 100, yPos)
        doc.text('Hours', 150, yPos)
        yPos += 6

        doc.setLineWidth(0.5)
        doc.line(20, yPos, 190, yPos)
        yPos += 6

        data.projectData.forEach((project) => {
          if (yPos > 270) {
            doc.addPage()
            yPos = 20
          }

          doc.text(project.projectName, 20, yPos)
          doc.text(String(project.stints), 100, yPos)
          doc.text(`${project.hours}h`, 150, yPos)
          yPos += 6
        })
      }

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' },
        )
        doc.text(
          `Generated on ${new Date().toLocaleString()}`,
          20,
          doc.internal.pageSize.height - 10,
        )
      }

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `focus-ledger-report-${timestamp}.pdf`

      // Save PDF
      doc.save(filename)
    }
    catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to export PDF')
      throw error.value
    }
    finally {
      isExporting.value = false
    }
  }

  return {
    isExporting: readonly(isExporting),
    error: readonly(error),
    exportToPDF,
  }
}
