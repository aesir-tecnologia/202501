# Tasks: Daily Reset Logic

**Input**: Design documents from `/specs/005-daily-reset/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Not explicitly requested in spec. Tests are omitted. Co-located tests can be added later if needed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

Following existing project structure from plan.md:
- **Frontend**: `app/` (Nuxt 4 SSG application)
- **Database**: `supabase/migrations/` (PostgreSQL migrations)
- **Types**: `app/types/` (auto-generated and manual TypeScript types)

---

## Phase 1: Setup (Database Infrastructure)

**Purpose**: Create the daily_summaries table and supporting database infrastructure

- [x] T001 Create daily_summaries table migration in `supabase/migrations/20251217012242_create_daily_summaries_table.sql`
- [x] T002 Add RLS policies for daily_summaries in same migration (users can read own summaries only)
- [x] T003 Add indexes for common query patterns (`user_id, date DESC` and `date DESC`)
- [x] T004 Run `supabase db reset` to apply migration and verify table creation
- [x] T005 Run `npm run supabase:types` to regenerate TypeScript types in `app/types/database.types.ts`

---

## Phase 2: Foundational (Core Database Functions)

**Purpose**: Implement the PL/pgSQL functions that power the daily reset system

**⚠️ CRITICAL**: User story implementation depends on these functions being complete

- [x] T006 Create `aggregate_daily_summary(p_user_id UUID, p_date DATE)` function in `supabase/migrations/20251217012243_create_daily_reset_functions.sql`
- [x] T007 Implement JSONB project_breakdown aggregation using `jsonb_agg()` and `jsonb_build_object()` within aggregate_daily_summary
- [x] T008 Create `process_daily_reset()` orchestrator function that finds midnight users and calls aggregate_daily_summary
- [x] T009 Add `update_user_streak()` call within process_daily_reset for each processed user
- [x] T010 Create `get_daily_summaries(p_user_id UUID, p_start_date DATE, p_end_date DATE)` RPC function
- [x] T011 Apply migration with `supabase db reset` and test functions manually via SQL
- [x] T012 Schedule hourly cron job in `supabase/migrations/20251217012244_schedule_daily_reset_cron.sql`
- [x] T013 Apply cron migration and verify job exists with `SELECT * FROM cron.job WHERE jobname = 'daily-reset-job'`

**Checkpoint**: Database layer complete - all SQL functions working and cron scheduled

---

## Phase 3: User Story 1 - Daily Progress Counter Resets at Midnight (Priority: P1) 🎯 MVP

**Goal**: Ensure users see fresh "0 of X stints" after their local midnight passes. The cron job aggregates yesterday's data and users see reset counters on next page load.

**Independent Test**:
1. Create test user with timezone America/New_York
2. Complete stints "yesterday" (in user's timezone)
3. Manually run `SELECT aggregate_daily_summary(user_id, yesterday_date)`
4. Verify daily_summaries record created
5. Query today's stints and confirm empty (fresh day)

### Three-Layer Implementation for User Story 1

#### Database Layer

- [x] T014 [P] [US1] Create `app/lib/supabase/daily-summaries.ts` with type exports (`DailySummaryRow`, `ProjectBreakdownItem`, `DailySummaryFilters`)
- [x] T015 [US1] Implement `listDailySummaries(client, filters)` function using `get_daily_summaries` RPC in `app/lib/supabase/daily-summaries.ts`
- [x] T016 [US1] Implement `getDailySummary(client, date)` function for single-day lookup in `app/lib/supabase/daily-summaries.ts`
- [x] T017 [US1] Add Result<T> pattern error handling with user-friendly error messages

#### Schema Layer

- [x] T018 [P] [US1] Create `app/schemas/daily-summaries.ts` with `DAILY_SUMMARY_SCHEMA_LIMITS` constants
- [x] T019 [US1] Implement `projectBreakdownItemSchema` Zod schema (camelCase: projectId, projectName, stintCount, focusSeconds)
- [x] T020 [US1] Implement `dailySummarySchema` Zod schema with date regex validation
- [x] T021 [US1] Implement `dailySummaryFiltersSchema` with start/end date refinement
- [x] T022 [US1] Export inferred TypeScript types (`DailySummary`, `ProjectBreakdownItem`, `DailySummaryFilters`)

#### Composable Layer

- [x] T023 [P] [US1] Create `app/composables/useDailySummaries.ts` with `dailySummaryKeys` query key factory
- [x] T024 [US1] Implement `useDailySummariesQuery(filters)` hook with TanStack Query in `app/composables/useDailySummaries.ts`
- [x] T025 [US1] Implement `useDailySummaryQuery(date)` hook for single-day queries
- [x] T026 [US1] Add `toDbPayload()` transformation for camelCase → snake_case conversion

**Checkpoint**: User Story 1 complete. Users can now see aggregated daily summaries. Dashboard shows reset counters after midnight pass.

---

## Phase 4: User Story 2 - Daily Summary Aggregation (Priority: P2)

**Goal**: Enable fast analytics page loading via pre-aggregated daily summaries with per-project breakdown.

**Independent Test**:
1. Complete stints across multiple projects on a test day
2. Trigger daily reset for that user
3. Query daily_summaries and verify project_breakdown JSONB contains correct per-project stats
4. Verify analytics queries using daily_summaries complete < 2 seconds

### Analytics Support Implementation

#### Database Layer Extensions

- [x] T027 [P] [US2] Add `getWeeklyStats(client)` function in `app/lib/supabase/daily-summaries.ts` that aggregates last 7 days
- [x] T028 [US2] Implement weekly stats query using `SUM()` aggregation over daily_summaries

#### Schema Layer Extensions

- [x] T029 [P] [US2] Add `weeklyStatsSchema` Zod schema in `app/schemas/daily-summaries.ts`
- [x] T030 [US2] Export `WeeklyStats` type with totalStints, totalFocusSeconds, totalPauseSeconds, daysTracked, projectBreakdown

#### Composable Layer Extensions

- [x] T031 [P] [US2] Add `weekly` key to `dailySummaryKeys` factory in `app/composables/useDailySummaries.ts`
- [x] T032 [US2] Implement `useWeeklyStatsQuery()` hook in `app/composables/useDailySummaries.ts`
- [x] T033 [US2] Add computed properties helper for `DailySummaryWithComputed` (focusHours, pauseHours)

#### Utility Functions

- [x] T034 [P] [US2] Create `app/utils/daily-summaries.ts` with `transformDailySummary()` and `transformProjectBreakdown()` helpers
- [x] T035 [US2] Implement `formatDuration(seconds)` utility (e.g., 7200 → "2h 0m")
- [x] T036 [US2] Implement `getDateRange(period)` utility for 'today', 'week', 'month', 'year' ranges

**Checkpoint**: User Story 2 complete. Analytics queries use pre-aggregated data. Weekly stats available.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, edge case handling, and documentation

- [x] T037 Verify zero-stint days create summary records with `total_stints=0` and empty `project_breakdown`
- [x] T038 Verify DST transitions and timezone edge cases: (a) test timezone with upcoming DST change, (b) test invalid timezone falls back to UTC gracefully
- [x] T038a Verify timezone change mid-day: simulate user changing timezone from UTC to America/New_York after their original midnight has passed, confirm reset occurs at next new-timezone midnight
- [x] T039 Verify idempotency: run `process_daily_reset()` multiple times and confirm no duplicate summaries
- [x] T039a Verify cron catch-up: skip one hourly run, then verify next run processes users whose midnight was 1-2 hours ago (NOTE: current impl only catches current midnight hour, not catch-up - this is a known limitation)
- [x] T040 Verify active stints are NOT affected by daily reset (check stint with status='active' persists through reset)
- [x] T041 Run `npm run lint:fix` and `npx nuxt typecheck` to verify code quality
- [x] T042 Validate against quickstart.md testing checklist
- [x] T043 Run full test suite with `npm run test:run` to catch regressions
- [x] T044 [SC-003] Verify analytics performance: seed 365 days of daily_summaries, confirm weekly/monthly queries complete under 2 seconds (all queries < 1ms)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - creates table infrastructure
- **Foundational (Phase 2)**: Depends on Phase 1 - creates SQL functions
- **User Story 1 (Phase 3)**: Depends on Phase 2 - implements three-layer TypeScript code
- **User Story 2 (Phase 4)**: Depends on Phase 3 - extends with analytics features
- **Polish (Phase 5)**: Depends on Phase 4 - final validation

### Task Dependencies Within Phases

**Phase 1**:
- T001 → T002 → T003 (same migration file, sequential)
- T004 (depends on T001-T003)
- T005 (depends on T004)

**Phase 2**:
- T006 → T007 (aggregate function needs breakdown logic)
- T008 → T009 (process function calls streak update)
- T010 (parallel with T006-T009)
- T011 (depends on T006-T010)
- T012 → T013 (cron scheduling)

**Phase 3 (US1)**:
- T014 || T018 || T023 (parallel - different files)
- T015 → T016 → T017 (database layer sequential)
- T019 → T020 → T021 → T022 (schema layer sequential)
- T024 → T025 → T026 (composable layer sequential)

**Phase 4 (US2)**:
- T027 || T029 || T031 || T034 (parallel - different files/functions)
- Remaining tasks depend on their layer's foundation

### Parallel Opportunities

```bash
# Phase 3: Launch all three layers' first tasks in parallel
Task: "Create app/lib/supabase/daily-summaries.ts with type exports"
Task: "Create app/schemas/daily-summaries.ts with DAILY_SUMMARY_SCHEMA_LIMITS"
Task: "Create app/composables/useDailySummaries.ts with dailySummaryKeys"

# Phase 4: Launch extensions in parallel across layers
Task: "Add getWeeklyStats function"
Task: "Add weeklyStatsSchema"
Task: "Add weekly key to dailySummaryKeys"
Task: "Create app/utils/daily-summaries.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup → Table and types ready
2. Complete Phase 2: Foundational → SQL functions working, cron scheduled
3. Complete Phase 3: User Story 1 → Three-layer TypeScript implementation
4. **STOP and VALIDATE**: Run `process_daily_reset()` manually, verify summaries created
5. Dashboard now shows accurate reset behavior

### Incremental Delivery

1. **Foundation** (Phase 1-2): Database infrastructure ready
2. **US1 MVP** (Phase 3): Basic daily summaries working, users see daily resets
3. **US2 Analytics** (Phase 4): Pre-aggregated data powers fast analytics
4. **Polish** (Phase 5): Edge cases validated, production-ready

### Deferred Work

User Story 3 (Real-time Dashboard Update) is explicitly deferred per spec clarification. Users will see reset state on next page load rather than via real-time broadcast.

---

## Summary

| Category | Count |
|----------|-------|
| Total Tasks | 46 |
| Phase 1 (Setup) | 5 |
| Phase 2 (Foundational) | 8 |
| Phase 3 (US1) | 13 |
| Phase 4 (US2) | 10 |
| Phase 5 (Polish) | 10 |
| Parallelizable Tasks | 10 |

**MVP Scope**: Phases 1-3 (26 tasks) deliver core daily reset functionality.
