import { z } from 'zod';

export const DAILY_SUMMARY_SCHEMA_LIMITS = {
  MAX_STINTS_PER_DAY: 50,
  MAX_FOCUS_SECONDS: 86400,
  MAX_PROJECTS_IN_BREAKDOWN: 25,
} as const;

export const projectBreakdownItemSchema = z.object({
  projectId: z.string().uuid(),
  projectName: z.string().min(1).max(100),
  stintCount: z.number().int().nonnegative(),
  focusSeconds: z.number().int().nonnegative(),
});

export const dailySummarySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (expected YYYY-MM-DD)'),
  totalStints: z.number().int().nonnegative(),
  totalFocusSeconds: z.number().int().nonnegative(),
  totalPauseSeconds: z.number().int().nonnegative(),
  projectBreakdown: z.array(projectBreakdownItemSchema),
  completedAt: z.string().datetime(),
});

export const dailySummaryFiltersSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date format'),
}).refine(
  data => data.startDate <= data.endDate,
  { message: 'Start date must be before or equal to end date' },
);

export const weeklyStatsSchema = z.object({
  totalStints: z.number().int().nonnegative(),
  totalFocusSeconds: z.number().int().nonnegative(),
  totalPauseSeconds: z.number().int().nonnegative(),
  daysTracked: z.number().int().nonnegative(),
  projectBreakdown: z.array(projectBreakdownItemSchema),
});

export type DailySummary = z.infer<typeof dailySummarySchema>;
export type ProjectBreakdownItem = z.infer<typeof projectBreakdownItemSchema>;
export type DailySummaryFilters = z.infer<typeof dailySummaryFiltersSchema>;
export type WeeklyStats = z.infer<typeof weeklyStatsSchema>;
