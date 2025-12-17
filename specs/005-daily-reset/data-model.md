# Data Model: Daily Reset Logic

**Feature**: 005-daily-reset
**Date**: 2025-12-16

## Entity Overview

This feature introduces one new table (`daily_summaries`) and several new database functions. It does not modify existing tables but relies heavily on the existing `stints`, `users`, and `user_streaks` tables.

## New Table: daily_summaries

### Purpose
Pre-aggregated daily statistics for fast analytics page loading. Generated nightly by the daily reset cron job.

### Schema

```sql
CREATE TABLE daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_stints INTEGER NOT NULL DEFAULT 0,
  total_focus_seconds INTEGER NOT NULL DEFAULT 0,
  total_pause_seconds INTEGER NOT NULL DEFAULT 0,
  project_breakdown JSONB NOT NULL DEFAULT '[]',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);
```

### Fields

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | UUID | No | gen_random_uuid() | Primary key |
| `user_id` | UUID | No | - | Foreign key to users table |
| `date` | DATE | No | - | Calendar date in user's timezone |
| `total_stints` | INTEGER | No | 0 | Count of completed stints that day |
| `total_focus_seconds` | INTEGER | No | 0 | Sum of actual_duration from stints |
| `total_pause_seconds` | INTEGER | No | 0 | Sum of paused_duration from stints |
| `project_breakdown` | JSONB | No | '[]' | Array of per-project statistics |
| `completed_at` | TIMESTAMPTZ | No | now() | When this summary was generated |

### project_breakdown Structure

```typescript
interface ProjectBreakdown {
  project_id: string;      // UUID of the project
  project_name: string;    // Name at time of aggregation (denormalized)
  stint_count: number;     // Number of stints for this project
  focus_seconds: number;   // Total focus time for this project
}

// Example:
[
  {
    "project_id": "a1b2c3d4-...",
    "project_name": "Client Website",
    "stint_count": 3,
    "focus_seconds": 5400
  },
  {
    "project_id": "e5f6g7h8-...",
    "project_name": "Learning",
    "stint_count": 1,
    "focus_seconds": 1800
  }
]
```

### Indexes

```sql
-- Primary access pattern: Get summaries for a user within date range
CREATE INDEX idx_daily_summaries_user_date
  ON daily_summaries(user_id, date DESC);

-- For analytics queries by date range
CREATE INDEX idx_daily_summaries_date
  ON daily_summaries(date DESC);
```

### RLS Policies

```sql
-- Users can only read their own summaries
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own summaries"
  ON daily_summaries FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies for users
-- Summaries are created by cron job with service role (bypasses RLS)
```

### Validation Rules

| Rule | Constraint | Error Message |
|------|------------|---------------|
| Unique per user per date | UNIQUE(user_id, date) | "Summary already exists for this date" |
| Non-negative counts | CHECK(total_stints >= 0) | "Stint count cannot be negative" |
| Non-negative durations | CHECK(total_focus_seconds >= 0) | "Focus time cannot be negative" |
| Valid JSON structure | Application-level | "Invalid project breakdown format" |

## State Transitions

This feature doesn't introduce new entity states. However, it does define the lifecycle of daily_summaries:

```
No Summary ──(midnight reset)──> Summary Created
                                      │
                                      │ (if re-run)
                                      ▼
                                Summary Updated (via UPSERT)
```

## Relationships

```
┌─────────────────┐
│     users       │
│  (user_profiles)│
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐       ┌─────────────────┐
│ daily_summaries │       │   user_streaks  │
│  (new table)    │       │  (updated by    │
└─────────────────┘       │   daily reset)  │
         │                └─────────────────┘
         │
   Aggregates from
         │
         ▼
┌─────────────────┐       ┌─────────────────┐
│     stints      │◄──────│    projects     │
│ (source data)   │       │ (for breakdown) │
└─────────────────┘       └─────────────────┘
```

## TypeScript Types

### Database Types (auto-generated)

```typescript
// In app/types/database.types.ts (after npm run supabase:types)
interface DailySummary {
  id: string;
  user_id: string;
  date: string;  // ISO date string
  total_stints: number;
  total_focus_seconds: number;
  total_pause_seconds: number;
  project_breakdown: ProjectBreakdownItem[];
  completed_at: string;
}

interface ProjectBreakdownItem {
  project_id: string;
  project_name: string;
  stint_count: number;
  focus_seconds: number;
}
```

### Schema Types (Zod)

```typescript
// In app/schemas/daily-summaries.ts
import { z } from 'zod';

export const projectBreakdownItemSchema = z.object({
  projectId: z.string().uuid(),
  projectName: z.string(),
  stintCount: z.number().int().nonnegative(),
  focusSeconds: z.number().int().nonnegative(),
});

export const dailySummarySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),  // YYYY-MM-DD
  totalStints: z.number().int().nonnegative(),
  totalFocusSeconds: z.number().int().nonnegative(),
  totalPauseSeconds: z.number().int().nonnegative(),
  projectBreakdown: z.array(projectBreakdownItemSchema),
  completedAt: z.string().datetime(),
});

export type DailySummary = z.infer<typeof dailySummarySchema>;
export type ProjectBreakdownItem = z.infer<typeof projectBreakdownItemSchema>;
```

## Query Patterns

### Get summaries for date range
```sql
SELECT * FROM daily_summaries
WHERE user_id = $1
  AND date BETWEEN $2 AND $3
ORDER BY date DESC;
```

### Get weekly totals
```sql
SELECT
  SUM(total_stints) as week_stints,
  SUM(total_focus_seconds) as week_focus,
  COUNT(*) as days_tracked
FROM daily_summaries
WHERE user_id = $1
  AND date >= CURRENT_DATE - INTERVAL '7 days';
```

### Get project breakdown across range
```sql
SELECT
  elem->>'project_id' as project_id,
  elem->>'project_name' as project_name,
  SUM((elem->>'stint_count')::int) as total_stints,
  SUM((elem->>'focus_seconds')::int) as total_focus
FROM daily_summaries,
     jsonb_array_elements(project_breakdown) as elem
WHERE user_id = $1
  AND date BETWEEN $2 AND $3
GROUP BY project_id, project_name
ORDER BY total_focus DESC;
```

## Migration Notes

1. Create `daily_summaries` table with all constraints
2. Add indexes for common query patterns
3. Set up RLS policies (read-only for authenticated users)
4. Create aggregation function `aggregate_daily_summary()`
5. Create reset orchestrator function `process_daily_reset()`
6. Schedule hourly cron job

## Backward Compatibility

- No changes to existing tables
- New table is additive
- Analytics features will need to be updated to use daily_summaries
- During transition, analytics can fall back to direct stint queries
