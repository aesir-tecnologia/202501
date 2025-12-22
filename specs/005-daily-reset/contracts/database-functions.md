# Database Function Contracts: Daily Reset Logic

**Feature**: 005-daily-reset
**Date**: 2025-12-16

This document defines the PostgreSQL function signatures and contracts for the daily reset feature.

## Functions Overview

| Function | Purpose | Trigger |
|----------|---------|---------|
| `aggregate_daily_summary` | Aggregate one user's daily data | Called by process_daily_reset |
| `process_daily_reset` | Orchestrate reset for all eligible users | Cron job (hourly) |
| `get_daily_summaries` | Query summaries for date range | Client query |

---

## aggregate_daily_summary

### Purpose
Aggregates a single user's completed stints from a specific date into a daily_summary record.

### Signature

```sql
CREATE OR REPLACE FUNCTION aggregate_daily_summary(
  p_user_id UUID,
  p_date DATE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `p_user_id` | UUID | Yes | The user whose data to aggregate |
| `p_date` | DATE | Yes | The calendar date to aggregate (in user's timezone) |

### Returns

```typescript
{
  success: boolean;
  summary_id: string | null;
  total_stints: number;
  total_focus_seconds: number;
  error: string | null;
}
```

### Behavior

1. Look up user's timezone from user_profiles table
2. Query completed stints where `DATE(ended_at AT TIME ZONE timezone) = p_date`
3. Calculate totals (stint count, focus seconds, pause seconds)
4. Build project_breakdown JSONB array
5. UPSERT into daily_summaries
6. Return result object

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| No stints for date | Creates summary with total_stints=0, empty breakdown |
| Summary already exists | Updates existing record (UPSERT) |
| User not found | Returns error: "User not found" |
| No timezone set | Logs warning and defaults to UTC |

### Example Usage

```sql
SELECT aggregate_daily_summary(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '2025-12-15'
);
-- Returns: {"success": true, "summary_id": "...", "total_stints": 5, "total_focus_seconds": 9000, "error": null}
```

---

## process_daily_reset

### Purpose
Orchestrates the daily reset for all users whose local midnight has passed in the last hour.

### Signature

```sql
CREATE OR REPLACE FUNCTION process_daily_reset()
RETURNS TABLE(
  users_processed INTEGER,
  summaries_created INTEGER,
  streaks_updated INTEGER,
  errors JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
```

### Parameters

None (operates on current time)

### Returns

| Column | Type | Description |
|--------|------|-------------|
| `users_processed` | INTEGER | Number of users checked |
| `summaries_created` | INTEGER | Number of summaries created/updated |
| `streaks_updated` | INTEGER | Number of streak records updated |
| `errors` | JSONB | Array of {user_id, error} for any failures |

### Behavior

1. Query users where local time is 00:00-00:59
2. For each user, check if summary already exists for yesterday (their time)
3. If not processed:
   a. Call `aggregate_daily_summary(user_id, yesterday_date)`
   b. Call `update_user_streak(user_id, timezone)`
4. Collect and return statistics

### Algorithm

```sql
-- Find users whose midnight was in the last hour
SELECT id, timezone
FROM users
WHERE EXTRACT(HOUR FROM now() AT TIME ZONE timezone) = 0
  AND NOT EXISTS (
    SELECT 1 FROM daily_summaries
    WHERE user_id = users.id
      AND date = (DATE(now() AT TIME ZONE users.timezone) - INTERVAL '1 day')::date
  );
```

### Scheduling

```sql
-- Cron job runs at the top of every hour
SELECT cron.schedule(
  'daily-reset-job',
  '0 * * * *',  -- Every hour at :00
  $$ SELECT process_daily_reset(); $$
);
```

### Example Output

```sql
SELECT * FROM process_daily_reset();
-- Returns:
-- users_processed | summaries_created | streaks_updated | errors
-- 15              | 15                | 15              | []
```

---

## get_daily_summaries

### Purpose
Retrieves daily summaries for a user within a date range. Client-facing query function.

### Signature

```sql
CREATE OR REPLACE FUNCTION get_daily_summaries(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE(
  id UUID,
  date DATE,
  total_stints INTEGER,
  total_focus_seconds INTEGER,
  total_pause_seconds INTEGER,
  project_breakdown JSONB,
  completed_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY INVOKER
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `p_user_id` | UUID | Yes | User to query |
| `p_start_date` | DATE | Yes | Start of date range (inclusive) |
| `p_end_date` | DATE | Yes | End of date range (inclusive) |

### Returns

Set of daily_summary rows (excluding user_id column for cleaner response).

### Behavior

1. Validates that requesting user matches p_user_id (via RLS)
2. Returns all summaries in date range, ordered by date descending
3. Returns empty set if no summaries exist

### Example Usage

```sql
SELECT * FROM get_daily_summaries(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '2025-12-01',
  '2025-12-15'
);
```

---

## Error Codes

| Code | Function | Description |
|------|----------|-------------|
| `USER_NOT_FOUND` | aggregate_daily_summary | User ID doesn't exist in user_profiles |
| `AGGREGATION_FAILED` | process_daily_reset | Database error during aggregation (includes SQLSTATE) |
| `STREAK_UPDATE_FAILED` | process_daily_reset | Error updating user streak (includes SQLSTATE) |

---

## Security Considerations

| Function | Security | Rationale |
|----------|----------|-----------|
| `aggregate_daily_summary` | SECURITY DEFINER | Runs with function owner's privileges; called by cron |
| `process_daily_reset` | SECURITY DEFINER | Cron job runs with elevated privileges |
| `get_daily_summaries` | SECURITY INVOKER | Runs with caller's privileges; RLS applies |

---

## Performance Considerations

### Indexes Used

- `idx_stints_user_date`: For aggregating stints by user and date
- `idx_daily_summaries_user_date`: For checking existing summaries
- `idx_users_timezone` (consider adding): For finding users by timezone

### Query Optimization

```sql
-- Consider adding for better cron performance
CREATE INDEX idx_users_local_hour ON users
  USING btree ((EXTRACT(HOUR FROM now() AT TIME ZONE timezone)));
```

### Expected Load

- Hourly job processes ~1/24 of users (users in timezones where it's midnight)
- Each user requires 1-2 queries + 1 upsert
- Target: Complete all processing within 5 minutes

---

## Monitoring

### Cron Job Monitoring

```sql
-- Check recent job runs
SELECT jobid, runid, status, return_message, start_time, end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-reset-job')
ORDER BY start_time DESC
LIMIT 10;
```

### Metrics to Track

- `daily_reset_users_processed` - Count of users processed per run
- `daily_reset_duration_ms` - Time taken for each run
- `daily_reset_errors` - Count of errors per run
