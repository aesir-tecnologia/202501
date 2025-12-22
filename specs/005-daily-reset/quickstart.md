# Quickstart: Daily Reset Logic

**Feature**: 005-daily-reset
**Date**: 2025-12-16

This guide provides a quick overview for developers implementing the daily reset feature.

## What This Feature Does

1. **Hourly Cron Job**: Runs at :00 every hour to detect users whose local midnight passed
2. **Daily Aggregation**: Creates `daily_summaries` records with per-project breakdown
3. **Streak Updates**: Calls existing `update_user_streak()` for each processed user
4. **No Counter Reset**: Daily progress is calculated dynamically—no stored counters to reset

## Key Files to Create

```
supabase/migrations/
├── 20251216XXXXXX_create_daily_summaries_table.sql  # Table + indexes + RLS
├── 20251216XXXXXX_create_daily_reset_functions.sql  # PL/pgSQL functions
└── 20251216XXXXXX_schedule_daily_reset_cron.sql     # pg_cron job

app/lib/supabase/
└── daily-summaries.ts        # Database layer

app/schemas/
└── daily-summaries.ts        # Zod validation

app/composables/
└── useDailySummaries.ts      # TanStack Query hooks
```

## Critical Implementation Details

### 1. Detecting Midnight Users

```sql
-- Users whose local time is 00:00-00:59
SELECT id, timezone FROM users
WHERE EXTRACT(HOUR FROM now() AT TIME ZONE timezone) = 0
```

### 2. Aggregating Stints

```sql
-- Stints are counted by ended_at (not started_at)
SELECT ... FROM stints
WHERE user_id = p_user_id
  AND status = 'completed'
  AND DATE(ended_at AT TIME ZONE v_timezone) = p_date
```

### 3. Project Breakdown Format

```json
[
  {"project_id": "uuid", "project_name": "Work", "stint_count": 3, "focus_seconds": 5400}
]
```

### 4. Zero-Stint Days

Create a summary even for days with no stints:
```sql
INSERT INTO daily_summaries (user_id, date, total_stints, project_breakdown)
VALUES (p_user_id, p_date, 0, '[]'::jsonb);
```

## Development Workflow

### Step 1: Apply Migrations

```bash
# Apply migrations to local Supabase
supabase db reset

# Regenerate types
npm run supabase:types
```

### Step 2: Test Cron Manually

```sql
-- Run the reset function manually
SELECT * FROM process_daily_reset();

-- Check results
SELECT * FROM daily_summaries ORDER BY completed_at DESC LIMIT 5;
```

### Step 3: Verify Cron Scheduling

```sql
-- Check cron job exists
SELECT jobid, jobname, schedule FROM cron.job
WHERE jobname = 'daily-reset-job';

-- Check recent runs
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC LIMIT 5;
```

## Testing Checklist

- [ ] Summary created for user after their midnight
- [ ] Zero-stint day creates summary with total_stints=0
- [ ] Project breakdown includes all projects worked
- [ ] Streak updated after summary creation
- [ ] No duplicate summaries (UNIQUE constraint works)
- [ ] DST transition handled correctly
- [ ] Active stints NOT affected by reset

## Common Gotchas

### 1. Timezone Confusion
Always use `AT TIME ZONE` for date calculations. Never assume UTC.

### 2. Stint Day Assignment
Stints count towards the day they **end**, not start:
```sql
-- CORRECT: Use ended_at
DATE(ended_at AT TIME ZONE v_timezone) = p_date

-- WRONG: Don't use started_at for daily counting
DATE(started_at AT TIME ZONE v_timezone) = p_date
```

### 3. Cron Timing
The cron runs at :00 UTC, but users are processed based on their local time. A user in UTC+5 has midnight at 19:00 UTC.

### 4. Idempotency
The function should be safe to run multiple times:
- Check if summary exists before creating
- Use UPSERT with ON CONFLICT

## Quick Reference: Key Functions

| Function | Purpose |
|----------|---------|
| `aggregate_daily_summary(user_id, date)` | Create summary for one user/date |
| `process_daily_reset()` | Orchestrate reset for all eligible users |
| `get_daily_summaries(user_id, start, end)` | Query summaries (client-facing) |
| `update_user_streak(user_id, timezone)` | Update streak (existing function) |

## Dependencies

This feature depends on:
- `users` table with `timezone` column
- `stints` table with `status` and `ended_at`
- `user_streaks` table and `update_user_streak()` function
- `pg_cron` extension (already enabled for auto-complete)

## Next Steps After Implementation

1. Update analytics page to use `daily_summaries` instead of raw stint queries
2. Add weekly/monthly rollup views if needed
3. Consider backfilling historical summaries for existing users
