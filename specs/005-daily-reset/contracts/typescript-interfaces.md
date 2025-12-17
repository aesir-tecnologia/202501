# TypeScript Interface Contracts: Daily Reset Logic

**Feature**: 005-daily-reset
**Date**: 2025-12-16

This document defines the TypeScript interfaces for the daily reset feature's client-side code.

## Database Layer Interfaces

### Location: `app/lib/supabase/daily-summaries.ts`

```typescript
import type { TypedSupabaseClient } from '@/utils/supabase';

// Row type (from generated database.types.ts)
export type DailySummaryRow = Database['public']['Tables']['daily_summaries']['Row'];

// Project breakdown item shape
export interface ProjectBreakdownItem {
  project_id: string;
  project_name: string;
  stint_count: number;
  focus_seconds: number;
}

// Query parameters
export interface DailySummaryFilters {
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
}

// Function signatures
export async function listDailySummaries(
  client: TypedSupabaseClient,
  filters: DailySummaryFilters
): Promise<Result<DailySummaryRow[]>>;

export async function getDailySummary(
  client: TypedSupabaseClient,
  date: string  // YYYY-MM-DD
): Promise<Result<DailySummaryRow | null>>;

export async function getWeeklyStats(
  client: TypedSupabaseClient
): Promise<Result<WeeklyStats>>;

// Result type pattern (per constitution)
export interface Result<T> {
  data: T | null;
  error: string | null;
}

// Aggregated weekly stats
export interface WeeklyStats {
  totalStints: number;
  totalFocusSeconds: number;
  totalPauseSeconds: number;
  daysTracked: number;
  projectBreakdown: ProjectBreakdownItem[];
}
```

## Schema Layer Interfaces

### Location: `app/schemas/daily-summaries.ts`

```typescript
import { z } from 'zod';

// Schema limits (per constitution pattern)
export const DAILY_SUMMARY_SCHEMA_LIMITS = {
  MAX_STINTS_PER_DAY: 50,  // Reasonable upper bound
  MAX_FOCUS_SECONDS: 86400,  // 24 hours
  MAX_PROJECTS_IN_BREAKDOWN: 25,  // Matches max active projects
} as const;

// Project breakdown item schema
export const projectBreakdownItemSchema = z.object({
  projectId: z.string().uuid(),
  projectName: z.string().min(1).max(100),
  stintCount: z.number().int().nonnegative(),
  focusSeconds: z.number().int().nonnegative(),
});

// Main daily summary schema (camelCase for API surface)
export const dailySummarySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  totalStints: z.number().int().nonnegative(),
  totalFocusSeconds: z.number().int().nonnegative(),
  totalPauseSeconds: z.number().int().nonnegative(),
  projectBreakdown: z.array(projectBreakdownItemSchema),
  completedAt: z.string().datetime(),
});

// Query filter schema
export const dailySummaryFiltersSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).refine(
  data => data.startDate <= data.endDate,
  { message: 'Start date must be before or equal to end date' }
);

// Inferred types
export type DailySummary = z.infer<typeof dailySummarySchema>;
export type ProjectBreakdownItem = z.infer<typeof projectBreakdownItemSchema>;
export type DailySummaryFilters = z.infer<typeof dailySummaryFiltersSchema>;
```

## Composable Layer Interfaces

### Location: `app/composables/useDailySummaries.ts`

```typescript
import type { UseQueryReturnType, UseMutationReturnType } from '@tanstack/vue-query';
import type { DailySummary, DailySummaryFilters } from '@/schemas/daily-summaries';

// Query key factory (per constitution pattern)
export const dailySummaryKeys = {
  all: ['daily-summaries'] as const,
  lists: () => [...dailySummaryKeys.all, 'list'] as const,
  list: (filters: DailySummaryFilters) => [...dailySummaryKeys.lists(), filters] as const,
  detail: (date: string) => [...dailySummaryKeys.all, 'detail', date] as const,
  weekly: () => [...dailySummaryKeys.all, 'weekly'] as const,
} as const;

// Query hooks
export function useDailySummariesQuery(
  filters: MaybeRef<DailySummaryFilters>
): UseQueryReturnType<DailySummary[], Error>;

export function useDailySummaryQuery(
  date: MaybeRef<string>
): UseQueryReturnType<DailySummary | null, Error>;

export function useWeeklyStatsQuery(): UseQueryReturnType<WeeklyStats, Error>;

// Transformed return type with computed values
export interface DailySummaryWithComputed extends DailySummary {
  focusHours: number;       // totalFocusSeconds / 3600
  pauseHours: number;       // totalPauseSeconds / 3600
  completionRate: number;   // (manual + auto) / total
}
```

## Utility Functions

### Location: `app/utils/daily-summaries.ts`

```typescript
// Transform database row (snake_case) to schema type (camelCase)
export function transformDailySummary(row: DailySummaryRow): DailySummary;

// Transform project breakdown from DB format to schema format
export function transformProjectBreakdown(
  breakdown: unknown
): ProjectBreakdownItem[];

// Format seconds to human-readable duration
export function formatDuration(seconds: number): string;
// Example: 7200 -> "2h 0m"

// Calculate date range for common periods
export function getDateRange(
  period: 'today' | 'week' | 'month' | 'year'
): DailySummaryFilters;

// Check if a date has a summary (for calendar views)
export function hasSummaryForDate(
  summaries: DailySummary[],
  date: string
): boolean;
```

## Component Props Interfaces

### DailySummaryCard

```typescript
export interface DailySummaryCardProps {
  summary: DailySummary;
  showProjectBreakdown?: boolean;
  compact?: boolean;
}
```

### WeeklyOverview

```typescript
export interface WeeklyOverviewProps {
  summaries: DailySummary[];
  loading?: boolean;
}
```

### ProjectBreakdownChart

```typescript
export interface ProjectBreakdownChartProps {
  breakdown: ProjectBreakdownItem[];
  metric: 'stints' | 'time';
}
```

## Event Emits

### Analytics Page Events

```typescript
export interface DailySummaryEvents {
  // When user selects a different date range
  'date-range-change': [filters: DailySummaryFilters];

  // When user clicks on a specific day
  'day-select': [date: string];

  // When user clicks on a project in breakdown
  'project-select': [projectId: string];
}
```

## API Response Types

### Supabase RPC Response

```typescript
// Response from get_daily_summaries RPC
export interface GetDailySummariesResponse {
  id: string;
  date: string;
  total_stints: number;
  total_focus_seconds: number;
  total_pause_seconds: number;
  project_breakdown: Array<{
    project_id: string;
    project_name: string;
    stint_count: number;
    focus_seconds: number;
  }>;
  completed_at: string;
}
```

## Error Types

```typescript
export type DailySummaryError =
  | { code: 'NOT_FOUND'; message: 'No summary found for this date' }
  | { code: 'INVALID_DATE_RANGE'; message: 'Invalid date range specified' }
  | { code: 'FETCH_FAILED'; message: string };

export function isDailySummaryError(error: unknown): error is DailySummaryError;
```
