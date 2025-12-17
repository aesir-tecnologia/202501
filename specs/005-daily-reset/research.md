# Research: Daily Reset Logic

**Feature**: 005-daily-reset
**Date**: 2025-12-16

## Research Questions & Decisions

### 1. How to detect when a user's local midnight has passed?

**Decision**: Query users where current time in their timezone is between 00:00 and 00:59

**Rationale**: The hourly cron job at :00 catches users whose midnight occurred in the last hour. Using a time window (< 60 minutes past midnight) ensures we don't miss users and handles edge cases where the cron job is slightly delayed.

**Alternatives Considered**:
- Per-user scheduled jobs: Rejected due to complexity and resource overhead
- Real-time event triggers: Deferred per spec clarification
- Daily batch at fixed UTC time: Rejected; would miss timezones or process too early

**Implementation**:
```sql
SELECT id, timezone FROM users
WHERE EXTRACT(HOUR FROM now() AT TIME ZONE timezone) = 0
  AND NOT EXISTS (
    SELECT 1 FROM daily_summaries
    WHERE user_id = users.id
      AND date = (now() AT TIME ZONE timezone)::date - INTERVAL '1 day'
  )
```

### 2. How to store per-project breakdown in daily_summaries?

**Decision**: JSONB column `project_breakdown` with array of objects

**Rationale**: Per spec clarification, the breakdown should be stored as a JSONB array containing `{ project_id, project_name, stint_count, focus_seconds }` for each project worked that day. JSONB provides flexibility, efficient querying, and native PostgreSQL support.

**Alternatives Considered**:
- Separate `daily_summary_projects` join table: More normalized but adds query complexity
- Denormalized columns: Inflexible for varying project counts
- Array of project_ids only: Loses valuable aggregated data

**Schema**:
```sql
project_breakdown JSONB NOT NULL DEFAULT '[]'
-- Example: [
--   {"project_id": "uuid", "project_name": "Client Work", "stint_count": 3, "focus_seconds": 5400},
--   {"project_id": "uuid", "project_name": "Learning", "stint_count": 1, "focus_seconds": 1800}
-- ]
```

### 3. Should daily_summary be created for days with zero stints?

**Decision**: Yes, create summary with total_stints=0 and empty project_breakdown

**Rationale**: Per spec clarification, zero-stint days should still generate a summary record. This provides a complete historical record, simplifies analytics queries (no need to check for missing days), and enables accurate "days tracked" metrics.

**Implementation**:
```sql
-- Insert zero-stint summary when user had no completed stints
INSERT INTO daily_summaries (user_id, date, total_stints, total_focus_seconds, total_pause_seconds, project_breakdown)
VALUES (p_user_id, p_date, 0, 0, 0, '[]'::jsonb)
ON CONFLICT (user_id, date) DO NOTHING;
```

### 4. How to handle streak updates during daily reset?

**Decision**: Call existing `update_user_streak()` function after processing each user's reset

**Rationale**: The streak calculation logic already exists and is timezone-aware. Reusing it maintains consistency and leverages tested code. The daily reset is the natural trigger point since it marks the boundary between days.

**Alternatives Considered**:
- Duplicate streak logic in reset function: Violates DRY principle
- Separate streak cron job: Adds complexity without benefit
- Real-time streak updates only: Misses edge cases (user doesn't log in)

### 5. How to handle DST transitions?

**Decision**: Rely on PostgreSQL's `AT TIME ZONE` operator which handles DST automatically

**Rationale**: PostgreSQL's timezone handling is robust and handles DST transitions correctly. A 23-hour or 25-hour day is handled naturally—the reset still occurs exactly at local midnight regardless of DST shifts.

**Implementation Notes**:
- Use `AT TIME ZONE` for all date calculations
- Never store local times; always use timestamptz
- The cron job runs at fixed UTC intervals, but calculates user-local time correctly

### 6. What if the cron job fails or is delayed?

**Decision**: Idempotent design with "already processed" check

**Rationale**: Per spec edge case, the hourly job should catch up on missed users. By checking if a summary already exists for the target date, the job can safely re-run without creating duplicates or processing users twice.

**Implementation**:
- Query excludes users who already have a summary for yesterday (their time)
- UPSERT pattern with `ON CONFLICT DO NOTHING` prevents duplicates
- Missed users are caught in the next hourly run

### 7. Should active stints be affected by the daily reset?

**Decision**: No—active stints continue uninterrupted

**Rationale**: Per FR-006, active stints must continue running through midnight. The daily reset only processes completed stints from the previous day. A stint started at 23:30 that completes at 00:30 will count towards the new day (based on ended_at).

**Implementation**:
- Only query stints with `status = 'completed'`
- Filter by `ended_at` timestamp (not started_at)
- Active/paused stints are excluded from aggregation

### 8. How to ensure no duplicate summaries?

**Decision**: Unique constraint on (user_id, date) + UPSERT pattern

**Rationale**: SC-004 requires zero duplicate summaries. Database-level unique constraint is the most reliable safeguard, combined with application-level checks before insertion.

**Implementation**:
```sql
CREATE TABLE daily_summaries (
  ...
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- In aggregation function
INSERT INTO daily_summaries ...
ON CONFLICT (user_id, date) DO UPDATE SET
  total_stints = EXCLUDED.total_stints,
  ...
```

## Best Practices Applied

### pg_cron Patterns (from existing auto_complete job)
- Schedule with named job for easy identification
- Check for existing job before creating
- Include idempotency guards in the function
- Return execution stats for monitoring

### Timezone Handling (from existing streak functions)
- Always use `AT TIME ZONE` for user-local calculations
- Store times in UTC (timestamptz)
- Look up user timezone from user_profiles table

### JSONB Aggregation
- Use `jsonb_agg()` for building arrays
- Use `jsonb_build_object()` for structured objects
- Handle empty results with COALESCE to '[]'::jsonb

## Dependencies

| Dependency | Purpose | Status |
|------------|---------|--------|
| pg_cron extension | Scheduled job execution | Already enabled |
| users.timezone column | User timezone lookup | Exists in schema |
| user_streaks table | Streak tracking | Exists (migration 20251108) |
| update_user_streak() | Streak calculation | Exists (migration 20251215) |
| stints table | Source data for aggregation | Exists |

## Unknowns Resolved

All NEEDS CLARIFICATION items have been resolved:
- ✅ Per-project breakdown storage: JSONB array
- ✅ Zero-stint day handling: Create summary with 0 values
- ✅ Real-time broadcast: Deferred to future work
