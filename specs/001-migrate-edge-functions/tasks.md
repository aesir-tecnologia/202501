# Tasks: Migrate Supabase Edge Functions to Nuxt Client

**Input**: Design documents from `/specs/001-migrate-edge-functions/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Tests are OPTIONAL in this migration - they are NOT explicitly requested in the feature specification. Test tasks are included only where existing tests need updates.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a Nuxt 4 SSG single project structure:
- Source code: `app/` (composables, lib/supabase, schemas, types)
- Tests: `tests/` (lib, composables, schemas)
- Database migrations: `supabase/migrations/`
- Edge functions (to be removed): `supabase/functions/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add validation schemas and constants needed across all user stories

- [ ] T001 Update `app/schemas/stints.ts` with STINT_SCHEMA_LIMITS constants from research.md
- [ ] T002 [P] Add startStintSchema validation to `app/schemas/stints.ts`
- [ ] T003 [P] Add completeStintSchema validation to `app/schemas/stints.ts`
- [ ] T004 [P] Add stintIdSchema validation to `app/schemas/stints.ts`
- [ ] T005 [P] Export StartStintInput, CompleteStintInput, StintIdInput types from `app/schemas/stints.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database layer updates and auto-completion infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Update existing `app/lib/supabase/stints.ts` requireUserId() helper if needed
- [ ] T007 Create PostgreSQL migration `supabase/migrations/[timestamp]_add_auto_complete_function.sql` with auto_complete_expired_stints() function
- [ ] T008 Apply migration to local database with `supabase db reset`
- [ ] T009 Test auto_complete_expired_stints() function manually via SQL
- [ ] T010 Set up pg_cron job or document alternative cron scheduling for auto-completion
- [ ] T011 Regenerate TypeScript types from Supabase schema with `npm run supabase:types`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Start Work Sessions (Priority: P1) 🎯 MVP

**Goal**: Users can start timed work sessions for their projects with automatic conflict detection and validation happening entirely on the client side

**Independent Test**: Attempt to start a stint for a project and verify the stint is created with correct duration, or receive appropriate error messages for conflicts (already active stint) or validation failures (invalid duration)

**Why P1**: Starting stints is the core functionality of the application. Without this, users cannot track their work sessions at all.

### Implementation for User Story 1

- [ ] T012 [US1] Implement startStint() function in `app/lib/supabase/stints.ts` replacing edge function with direct database operations
- [ ] T013 [US1] Add user version retrieval for optimistic locking in startStint()
- [ ] T014 [US1] Add project query with custom_stint_duration and archived check in startStint()
- [ ] T015 [US1] Implement planned duration resolution logic (param → project custom → default 120) in startStint()
- [ ] T016 [US1] Add validate_stint_start RPC call with conflict detection in startStint()
- [ ] T017 [US1] Implement ConflictError handling with existing stint details in startStint()
- [ ] T018 [US1] Add stint INSERT with race condition handling (23505 error) in startStint()
- [ ] T019 [US1] Create useStartStint() mutation hook in `app/composables/useStints.ts`
- [ ] T020 [US1] Add Zod validation with startStintSchema in useStartStint()
- [ ] T021 [US1] Implement optimistic updates with snapshot/rollback pattern in useStartStint()
- [ ] T022 [US1] Add cache invalidation for stintKeys.all on success in useStartStint()
- [ ] T023 [US1] Update existing tests in `tests/lib/supabase/stints.test.ts` for startStint()
- [ ] T024 [US1] Update existing tests in `tests/composables/useStints.test.ts` for useStartStint()

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently - users can start stints with full validation and conflict detection

---

## Phase 4: User Story 2 - Control Active Sessions (Priority: P1)

**Goal**: Users can pause, resume, and stop their active work sessions with state transitions validated on the client

**Independent Test**: Start a stint, then perform pause/resume/stop operations and verify correct state transitions and time tracking

**Why P1**: These are critical operations for managing work sessions. Without these, the application is unusable for real-world work patterns.

### Implementation for User Story 2

- [ ] T025 [P] [US2] Update pauseStint() in `app/lib/supabase/stints.ts` to call pause_stint RPC directly
- [ ] T026 [P] [US2] Update resumeStint() in `app/lib/supabase/stints.ts` to call resume_stint RPC directly
- [ ] T027 [P] [US2] Update completeStint() in `app/lib/supabase/stints.ts` to call complete_stint RPC with completion_type='manual'
- [ ] T028 [P] [US2] Add notes parameter validation (max 500 chars) to completeStint()
- [ ] T029 [P] [US2] Translate database errors to user-friendly messages in pauseStint(), resumeStint(), completeStint()
- [ ] T030 [US2] Create usePauseStint() mutation hook in `app/composables/useStints.ts`
- [ ] T031 [US2] Create useResumeStint() mutation hook in `app/composables/useStints.ts`
- [ ] T032 [US2] Create useCompleteStint() mutation hook in `app/composables/useStints.ts`
- [ ] T033 [US2] Implement optimistic updates with cache invalidation for stintKeys.detail(id) and stintKeys.active() in all three mutation hooks
- [ ] T034 [US2] Add Zod validation with stintIdSchema for pause/resume and completeStintSchema for complete
- [ ] T035 [US2] Update existing tests in `tests/lib/supabase/stints.test.ts` for pause/resume/complete
- [ ] T036 [US2] Update existing tests in `tests/composables/useStints.test.ts` for all three mutation hooks

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - complete stint lifecycle (start → pause → resume → complete) is functional

---

## Phase 5: User Story 3 - View Active Session (Priority: P2)

**Goal**: Users can quickly check if they have an active or paused work session across different pages and devices

**Independent Test**: Start a stint, then query for active stint and verify correct stint is returned, or null when no active stint exists

**Why P2**: While important for user experience, this is informational only. Users can work around its temporary absence by checking their stint list.

### Implementation for User Story 3

- [ ] T037 [US3] Update getActiveStint() in `app/lib/supabase/stints.ts` to query stints table directly (remove edge function call)
- [ ] T038 [US3] Add query filter for status IN ['active', 'paused'] with maybeSingle() in getActiveStint()
- [ ] T039 [US3] Ensure getActiveStint() returns null (not error) when no active stint exists
- [ ] T040 [US3] Create useActiveStintQuery() query hook in `app/composables/useStints.ts`
- [ ] T041 [US3] Configure caching strategy (60 second TTL) in useActiveStintQuery()
- [ ] T042 [US3] Add stintKeys.active() to query key factory
- [ ] T043 [US3] Update existing tests in `tests/lib/supabase/stints.test.ts` for getActiveStint()
- [ ] T044 [US3] Update existing tests in `tests/composables/useStints.test.ts` for useActiveStintQuery()

**Checkpoint**: All critical user stories (US1, US2, US3) are now independently functional - core stint operations complete

---

## Phase 6: User Story 4 - Automatic Session Completion (Priority: P2)

**Goal**: Active work sessions automatically complete when their planned duration expires, without requiring manual intervention

**Independent Test**: Start a stint with short duration (5 minutes), wait for duration to expire, and verify stint automatically completes with correct completion type

**Why P2**: Provides convenience and ensures data accuracy, but users can manually stop stints if needed. The system remains functional without this automation.

### Implementation for User Story 4

- [ ] T045 [US4] Verify auto_complete_expired_stints() function is working from Phase 2
- [ ] T046 [US4] Test auto-completion with manually created expired stints
- [ ] T047 [US4] Monitor cron job execution logs for 24 hours
- [ ] T048 [US4] Verify completion_type='auto' is set correctly by auto-completion
- [ ] T049 [US4] Document cron job scheduling in deployment documentation

**Checkpoint**: Auto-completion is now fully operational - stints complete automatically at planned end time

---

## Phase 7: User Story 5 - Timer Synchronization (Priority: P3)

**Goal**: Client-side timers can periodically synchronize with server-calculated remaining time to correct any drift from sleep mode, time zone changes, or clock adjustments

**Independent Test**: Start a stint, simulate clock drift on client, call sync check, and verify server returns correct remaining time

**Why P3**: Nice to have for accuracy, but not critical. Minor timer drift is acceptable, and manual stop/restart can work around issues.

### Implementation for User Story 5

- [ ] T050 [US5] Implement syncStintCheck() function in `app/lib/supabase/stints.ts`
- [ ] T051 [US5] Add validation for stint status (must be active or paused, not completed) in syncStintCheck()
- [ ] T052 [US5] Calculate server-side remaining time for active stints: planned_duration - (now - started_at) - paused_duration
- [ ] T053 [US5] Calculate server-side remaining time for paused stints: planned_duration - (paused_at - started_at) - paused_duration
- [ ] T054 [US5] Return SyncCheckOutput with remainingSeconds, serverTimestamp, and optional driftSeconds
- [ ] T055 [US5] Create useSyncStintCheck() mutation hook in `app/composables/useStints.ts`
- [ ] T056 [US5] Add Zod validation with stintIdSchema in useSyncStintCheck()
- [ ] T057 [US5] Add debounce logic (max 1 call per minute) to prevent excessive sync requests
- [ ] T058 [US5] Create tests for syncStintCheck() in `tests/lib/supabase/stints.test.ts`
- [ ] T059 [US5] Create tests for useSyncStintCheck() in `tests/composables/useStints.test.ts`

**Checkpoint**: All user stories (1-5) are now complete - full stint operation suite is functional

---

## Phase 8: Component Integration

**Purpose**: Update UI components to use new client-side composables instead of edge functions

- [ ] T060 Search for edge function invocations with `grep -r "functions.invoke('stints-" app/`
- [ ] T061 Replace stints-start edge function calls with useStartStint() composable in components
- [ ] T062 Replace stints-stop edge function calls with useCompleteStint() composable in components
- [ ] T063 [P] Replace stints-pause edge function calls with usePauseStint() composable in components
- [ ] T064 [P] Replace stints-resume edge function calls with useResumeStint() composable in components
- [ ] T065 [P] Replace stints-active edge function calls with useActiveStintQuery() composable in components
- [ ] T066 [P] Replace stint-sync-check edge function calls with useSyncStintCheck() composable in components
- [ ] T067 Add toast notifications for all operations (success and error) using error.message for detailed feedback
- [ ] T068 Test all stint operations in UI (start, pause, resume, complete, active query, sync)
- [ ] T069 Test conflict detection by attempting to start stint when one is active
- [ ] T070 Verify optimistic updates provide instant UI feedback with automatic rollback on error

**Checkpoint**: All components now use client-side composables - edge functions are no longer called

---

## Phase 9: Verification & Cleanup

**Purpose**: Final verification and removal of edge function code

- [ ] T071 Run full test suite with `npm run test:run` and verify all tests pass
- [ ] T072 Test SSG build with `npm run generate` and verify no build errors
- [ ] T073 Test static preview with `npm run serve` and verify all stint operations work
- [ ] T074 Monitor production/staging for 24-48 hours (error rates, auto-completion logs, user reports)
- [ ] T075 Verify auto-completion runs every 2 minutes with <1% error rate
- [ ] T076 Verify no errors in browser console during stint operations
- [ ] T077 Verify no errors in Supabase logs for stint operations
- [ ] T078 Remove `supabase/functions/stints-start/` directory
- [ ] T079 [P] Remove `supabase/functions/stints-stop/` directory
- [ ] T080 [P] Remove `supabase/functions/stints-pause/` directory
- [ ] T081 [P] Remove `supabase/functions/stints-resume/` directory
- [ ] T082 [P] Remove `supabase/functions/stints-active/` directory
- [ ] T083 [P] Remove `supabase/functions/stint-auto-complete/` directory
- [ ] T084 [P] Remove `supabase/functions/stint-sync-check/` directory
- [ ] T085 Remove `supabase/functions/_shared/` directory if no other edge functions use it
- [ ] T086 Update deployment configuration to remove edge function deployment steps
- [ ] T087 Run `npm run lint:fix` to ensure code style compliance
- [ ] T088 Create git commit with migration changes
- [ ] T089 Update quickstart.md validation if needed

**Checkpoint**: Migration complete - all edge functions removed, client-side implementation verified

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P1 → P2 → P2 → P3)
- **Component Integration (Phase 8)**: Depends on all user stories being complete
- **Verification & Cleanup (Phase 9)**: Depends on Component Integration completion

### User Story Dependencies

- **User Story 1 (P1) - Start Sessions**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1) - Control Sessions**: Can start after Foundational (Phase 2) - Independent but integrates with US1 for full lifecycle
- **User Story 3 (P2) - View Active**: Can start after Foundational (Phase 2) - Independent of US1/US2
- **User Story 4 (P2) - Auto-Complete**: Depends on Foundational (Phase 2) only - runs independently via cron
- **User Story 5 (P3) - Timer Sync**: Can start after Foundational (Phase 2) - Independent of other stories

### Within Each User Story

**User Story 1 (Start Sessions)**:
1. Database layer (T012-T018) - Sequential implementation of startStint()
2. Composable layer (T019-T022) - Sequential implementation of useStartStint()
3. Tests (T023-T024) - Can run in parallel after implementation

**User Story 2 (Control Sessions)**:
1. Database layer (T025-T029) - All 5 tasks can run in parallel (different functions)
2. Composable layer (T030-T034) - Sequential implementation of mutation hooks
3. Tests (T035-T036) - Can run in parallel after implementation

**User Story 3 (View Active)**:
1. Database layer (T037-T039) - Sequential implementation
2. Composable layer (T040-T042) - Sequential implementation
3. Tests (T043-T044) - Can run in parallel after implementation

**User Story 4 (Auto-Complete)**:
1. All tasks (T045-T049) are sequential verification steps

**User Story 5 (Timer Sync)**:
1. Database layer (T050-T054) - Sequential implementation
2. Composable layer (T055-T057) - Sequential implementation
3. Tests (T058-T059) - Can run in parallel after implementation

### Parallel Opportunities

**Phase 1 (Setup)**: Tasks T002, T003, T004, T005 can run in parallel (different schemas)

**Phase 2 (Foundational)**:
- T007-T011 are sequential (migration → apply → test → schedule → types)

**Phase 3 (User Story 1)**:
- T023-T024 can run in parallel (different test files)

**Phase 4 (User Story 2)**:
- T025-T029 can run in parallel (different database functions)
- T035-T036 can run in parallel (different test files)

**Phase 5 (User Story 3)**:
- T043-T044 can run in parallel (different test files)

**Phase 7 (User Story 5)**:
- T058-T059 can run in parallel (different test files)

**Phase 8 (Component Integration)**:
- T063-T066 can run in parallel (different edge function replacements)

**Phase 9 (Cleanup)**:
- T079-T084 can run in parallel (different edge function directories)

---

## Parallel Example: User Story 2

```bash
# Launch all database layer functions together:
Task: "Update pauseStint() in app/lib/supabase/stints.ts"
Task: "Update resumeStint() in app/lib/supabase/stints.ts"
Task: "Update completeStint() in app/lib/supabase/stints.ts"
Task: "Add notes parameter validation to completeStint()"
Task: "Translate database errors to user-friendly messages"

# Launch all tests together after implementation:
Task: "Update tests in tests/lib/supabase/stints.test.ts"
Task: "Update tests in tests/composables/useStints.test.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup ✅
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories) ✅
3. Complete Phase 3: User Story 1 (Start Sessions) ✅
4. Complete Phase 4: User Story 2 (Control Sessions) ✅
5. **STOP and VALIDATE**: Test US1 & US2 independently - Full stint lifecycle working
6. Deploy/demo if ready

**Rationale**: User Stories 1 and 2 are both P1 and together provide complete stint lifecycle (start → pause → resume → complete). This is the minimal viable product.

### Incremental Delivery

1. **Foundation** (Phases 1-2) → Database ready, schemas ready, auto-completion ready
2. **+ User Story 1** → Users can start stints with conflict detection
3. **+ User Story 2** → Users can control stints (pause/resume/stop) → **MVP COMPLETE** 🎯
4. **+ User Story 3** → Users can view active stint status
5. **+ User Story 4** → Stints auto-complete at end time
6. **+ User Story 5** → Timer sync corrects drift
7. **+ Component Integration** → UI fully migrated
8. **+ Cleanup** → Edge functions removed

Each increment adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers:

1. **Together**: Complete Setup + Foundational (Phases 1-2)
2. **Once Foundational is done**:
   - Developer A: User Story 1 (Phase 3)
   - Developer B: User Story 2 (Phase 4)
   - Developer C: User Story 3 (Phase 5)
3. **After user stories complete**:
   - All developers: Component Integration (Phase 8)
   - Developer A: Verification & Cleanup (Phase 9)

---

## Notes

- **[P] tasks** = different files, no dependencies - can run in parallel
- **[Story] label** maps task to specific user story for traceability (US1, US2, US3, US4, US5)
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **No new tests required** - only update existing tests in `tests/lib/` and `tests/composables/`
- All PostgreSQL RPC functions remain unchanged (except new auto_complete_expired_stints)
- Edge functions removed ONLY after complete verification (Phase 9)
- Rollback plan: Revert component changes (Phase 8) to restore edge function calls

---

## Success Criteria

- ✅ All 7 edge functions replaced with client-side equivalents
- ✅ No change in user-facing behavior (same success/error cases)
- ✅ <1s stint start operation (from click to confirmation)
- ✅ Auto-completion runs every 2 minutes with <1% error rate
- ✅ Zero security vulnerabilities introduced (RLS policies unchanged)
- ✅ All existing tests continue to pass
- ✅ Optimistic updates provide instant UI feedback
- ✅ Automatic rollback on errors works correctly
- ✅ Edge function code completely removed
- ✅ No CORS or authentication issues
