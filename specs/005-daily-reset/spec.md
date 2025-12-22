# Feature Specification: Daily Reset Logic

**Feature Branch**: `005-daily-reset`
**Created**: 2025-12-16
**Status**: Draft
**Input**: User description: "Implement Daily Reset Logic according to the roadmap"

## Clarifications

### Session 2025-12-16

- Q: How should per-project breakdown be stored in daily_summaries? → A: JSONB column with project breakdown array
- Q: Should a daily_summary be created for days with zero completed stints? → A: Yes, create summary with total_stints=0
- Q: What mechanism for real-time reset broadcast (FR-009)? → A: Deferred to future work; users see reset on next page load

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Daily Progress Counter Resets at Midnight (Priority: P1)

A freelance consultant opens LifeStint after midnight in their local timezone (e.g., America/New_York). They expect to see their daily progress counters reset to "0 of X stints" for all active projects, representing a fresh start for the new day. The previous day's progress is preserved in analytics for historical review.

**Why this priority**: This is the core functionality that defines a "day" boundary for users. Without accurate daily resets, the fundamental promise of daily progress tracking breaks down. Users cannot trust the "X of Y stints today" display.

**Independent Test**: Can be fully tested by simulating a user whose local midnight has just passed and verifying their dashboard shows reset progress counters while their analytics preserves yesterday's data.

**Acceptance Scenarios**:

1. **Given** a user in timezone "America/New_York" with 3 completed stints today, **When** the clock reaches midnight (00:00) in their timezone, **Then** their daily progress for all projects resets to "0 of Y stints today"
2. **Given** a user with completed stints from the previous day, **When** they view their dashboard after the daily reset, **Then** yesterday's stints are preserved in analytics and streak calculations
3. **Given** two users in different timezones (one in Tokyo, one in London), **When** both users' local midnights occur at different UTC times, **Then** each user's reset happens independently at their own midnight

---

### User Story 2 - Daily Summary Aggregation (Priority: P2)

After the daily reset occurs, the system aggregates the previous day's stint data into a pre-calculated summary. This enables fast loading of analytics pages and provides accurate historical data for weekly/monthly views.

**Why this priority**: Pre-aggregation is essential for performance at scale. Without it, analytics queries would need to scan large tables every time, degrading user experience as data grows.

**Independent Test**: Can be tested by completing stints during a day, triggering the daily reset, and verifying a daily_summaries record is created with correct totals.

**Acceptance Scenarios**:

1. **Given** a user completed 5 stints totaling 4 hours yesterday, **When** the daily reset runs, **Then** a daily_summaries record is created with total_stints=5 and accurate focus time
2. **Given** a user worked on 3 different projects yesterday, **When** the daily reset runs, **Then** the summary includes breakdown by project with stint counts for each
3. **Given** a user had no completed stints yesterday (only interrupted ones), **When** the daily reset runs, **Then** a summary record is created with total_stints=0 and an empty project_breakdown array

---

### User Story 3 - Real-Time Dashboard Update on Reset (Priority: P3) *(DEFERRED)*

> **Status**: Deferred to future work. Users will see reset state on next page load/refresh.

When a user is actively viewing the dashboard at the moment of their local midnight, the UI updates in real-time to reflect the reset progress counters without requiring a page refresh.

**Why this priority**: This is a polish feature for users who happen to be working at midnight. Most users will simply see the reset state on their next visit, making this enhancement rather than core functionality.

**Independent Test**: Can be tested by having a user view the dashboard, simulating the reset event, and verifying the UI updates automatically.

**Acceptance Scenarios** *(deferred)*:

1. **Given** a user viewing the dashboard at 23:59 with 3 of 4 stints completed, **When** the clock reaches midnight, **Then** the progress badge updates to "0 of 4 stints today" within 60 seconds without page refresh
2. **Given** a user with an active stint in progress at midnight, **When** the daily reset occurs, **Then** the active stint continues uninterrupted (timer keeps running) but the daily counter resets

---

### Edge Cases

- What happens if a user changes their timezone mid-day?
  - The daily reset recalculates based on the new timezone immediately. If new timezone's midnight has already passed, reset happens on next midnight cycle.

- What happens if a user is in a timezone that doesn't exist or is invalid?
  - System falls back to UTC. Users are prompted to update their timezone in settings.

- What happens during DST (Daylight Saving Time) transitions?
  - PostgreSQL's `AT TIME ZONE` handles DST automatically. A 23-hour or 25-hour day is handled correctly.

- What happens if the cron job fails to run at the scheduled time?
  - The hourly job catches up on the next run. Users whose midnight was 1-2 hours ago are still processed correctly.

- What happens if a stint spans midnight (started at 23:30, running at 00:30)?
  - The active stint continues uninterrupted. When completed, it will be counted in the day it was completed (based on ended_at timestamp), not when it was started. The daily counter resets at midnight, but the stint remains active and will count towards the new day's progress when finished.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST detect when each user's local midnight has passed based on their stored timezone preference
- **FR-002**: System MUST reset daily progress counters to zero for all active projects at the user's local midnight
- **FR-003**: System MUST preserve all stint records from the previous day for analytics and export functionality
- **FR-004**: System MUST generate a daily summary record aggregating the previous day's statistics (total stints, focus time, pause time, projects worked)
- **FR-005**: System MUST handle users across all IANA timezones correctly
- **FR-006**: System MUST continue active stints uninterrupted when daily reset occurs (an active stint at midnight keeps running)
- **FR-007**: System MUST run the reset check on a scheduled basis (hourly) to catch all timezone boundaries
- **FR-008**: System MUST update streaks after daily reset based on whether the user completed at least one stint the previous day
- **FR-009**: *(DEFERRED)* System SHOULD broadcast a reset event so that connected clients can update their UI in real-time
- **FR-010**: System MUST handle DST transitions correctly without creating duplicate resets or missing resets

### Key Entities

- **User Timezone**: The IANA timezone string (e.g., "America/New_York") stored in user profile. Determines when midnight occurs for that user.
- **Daily Progress**: The count of completed stints for each project "today" as determined by the user's timezone and the stint's ended_at timestamp. Stints count towards the day they are completed, not started. This is calculated dynamically, not stored.
- **Daily Summary**: Pre-aggregated statistics for a completed day, stored in `daily_summaries` table with total_stints, total_focus_seconds, total_pause_seconds, and a `project_breakdown` JSONB column containing an array of objects with `{ project_id, project_name, stint_count, focus_seconds }` for each project worked that day.
- **Streak State**: The `user_streaks` table tracking current_streak, longest_streak, and last_stint_date. Updated during daily reset processing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Daily progress counters reset accurately for 100% of users within 1 hour of their local midnight
- **SC-002**: *(DEFERRED)* Users viewing the dashboard see updated (reset) progress within 60 seconds of their local midnight without manual refresh
- **SC-003**: Analytics page loads in under 2 seconds regardless of how many days of history the user has (due to pre-aggregated summaries)
- **SC-004**: Zero duplicate daily summaries are created (each user has at most one summary per date)
- **SC-005**: Streak calculations remain accurate across timezone changes and DST transitions
- **SC-006**: Active stints continue uninterrupted through midnight with 0% data loss or premature completion

## Assumptions

The following reasonable defaults and assumptions have been made:

1. **Timezone Source**: User timezone is already stored in `users.timezone` field (detected during registration from browser)
2. **Scheduled Task Infrastructure**: The system already supports pg_cron for scheduled database operations (used for stint auto-completion)
3. **Real-time Infrastructure**: Supabase Realtime is available for broadcasting events to connected clients
4. **Daily Progress Calculation**: Daily progress is calculated dynamically from stints table filtered by date in user's timezone, not stored as a counter
5. **Summary Generation Timing**: Daily summaries are generated after midnight, not at midnight, to ensure all stints for the day are captured
6. **Grace Period**: The streak grace period (1 day) is already documented and should be maintained - users can miss one day without breaking their streak
7. **Stint Day Assignment**: Stints are counted towards the calendar day they are completed (ended_at), not when they started. A stint that spans midnight counts towards the new day.
