/**
 * Daily progress tracking types
 */

export interface DailyProgress {
  projectId: string
  completed: number
  expected: number
  percentage: number
  isOverAchieving: boolean
  isMet: boolean
}
