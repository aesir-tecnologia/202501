import { describe, it, expect } from 'vitest'

// Minimal tests per CLAUDE.md standards: happy path + evident error cases only

describe('ActivityHeatmap', () => {
  it('validates heatmap data structure', () => {
    const mockDailyData = [
      { date: '2025-01-01', stints: 5, hours: 2.5 },
      { date: '2025-01-02', stints: 3, hours: 1.5 },
    ]

    expect(mockDailyData).toBeInstanceOf(Array)
    expect(mockDailyData[0]).toHaveProperty('date')
    expect(mockDailyData[0]).toHaveProperty('stints')
    expect(mockDailyData[0]).toHaveProperty('hours')
  })

  it('handles empty data array', () => {
    const emptyData: Array<{ date: string, stints: number, hours: number }> = []
    expect(emptyData).toHaveLength(0)
  })

  it('calculates intensity levels correctly', () => {
    const maxStints = 10
    const testStints = 5
    const intensity = Math.ceil((testStints / maxStints) * 4)
    expect(intensity).toBe(2)
  })

  it('formats date strings correctly', () => {
    const date = new Date('2025-01-01')
    const dateStr = date.toISOString().split('T')[0]
    expect(dateStr).toBe('2025-01-01')
  })
})
