# Tasks: Pause and Switch

**Input**: Design documents from `/specs/006-suspend-switch/`
**Prerequisites**: plan.md ✓, spec.md ✓, data-model.md ✓, contracts/ ✓, research.md ✓, quickstart.md ✓

**Tests**: Tests are included as the quickstart.md provides comprehensive test scenarios.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

This is a Nuxt 4 SSG application with the following structure:
- **App code**: `app/` (components, composables, lib, pages, schemas)
- **Migrations**: `supabase/migrations/`
- **Tests**: Co-located with source files (e.g., `stints.test.ts` alongside `stints.ts`)

---

## Phase 1: Setup (Database Infrastructure)

**Purpose**: Database schema changes that enable the pause-and-switch functionality

- [X] T001 Create migration file `supabase/migrations/YYYYMMDDHHMMSS_pause_and_switch.sql`
- [X] T002 Drop existing combined unique index `idx_stints_single_active_per_user`
- [X] T003 [P] Create separate active stint unique index per `data-model.md` in migration
- [X] T004 [P] Create separate paused stint unique index per `data-model.md` in migration
- [X] T005 Update `pause_stint` function to check for existing paused stint per `contracts/database-functions.sql`
- [X] T006 Update `resume_stint` function to check for existing active stint per `contracts/database-functions.sql`
- [X] T007 Update `validate_stint_start` function to return paused stint info per `contracts/database-functions.sql`
- [X] T008 Apply migration and regenerate types with `supabase db reset && npm run supabase:types`

**Checkpoint**: Database layer ready - constraint now allows 1 active + 1 paused stint per user ✅

---

## Phase 2: Foundational (Core Query Infrastructure)

**Purpose**: Database layer and composable changes that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Modify `getActiveStint()` in `app/lib/supabase/stints.ts` to filter by `status = 'active'` only
- [X] T010 [P] Add `getPausedStint()` function in `app/lib/supabase/stints.ts` per `quickstart.md`
- [X] T011 Add `stintKeys.paused()` query key factory in `app/composables/useStints.ts`
- [X] T012 Add `usePausedStintQuery()` hook in `app/composables/useStints.ts` per `quickstart.md`
- [X] T013 Add TypeScript interfaces from `contracts/stint-operations.ts` to `app/composables/useStints.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel ✅

---

## Phase 3: User Story 1 - Switch to Different Project (Priority: P1) 🎯 MVP

**Goal**: Enable users to pause current stint and start a new one on a different project

**Independent Test**: Start a stint, pause it, start stint on different project → verify new stint starts while original remains paused

### Tests for User Story 1

- [X] T014 [P] [US1] Add test for `getActiveStint()` returning only active stints in `app/lib/supabase/stints.test.ts`
- [X] T015 [P] [US1] Add test for `getPausedStint()` returning paused stint in `app/lib/supabase/stints.test.ts`
- [X] T016 [P] [US1] Add test for allowing 1 active + 1 paused simultaneously in `app/lib/supabase/stints.test.ts`

### Implementation for User Story 1

- [X] T017 [US1] Create `StintConflictDialog.vue` component in `app/components/` per `quickstart.md`
- [X] T018 [US1] Add conflict resolution action handler in dashboard that handles `pause-and-switch` action
- [X] T019 [US1] Update stint start flow in `app/components/ProjectList.vue` to show conflict dialog when active stint exists
- [X] T020 [US1] Add cache invalidation for both `stintKeys.active()` and `stintKeys.paused()` after pause operations

**Checkpoint**: User Story 1 complete - users can pause and switch to a different project ✅

---

## Phase 4: User Story 2 - Return to Paused Stint (Priority: P1)

**Goal**: Enable users to resume a paused stint after completing or stopping the interrupting stint

**Independent Test**: Have paused stint, complete active stint, click resume on paused stint → verify it resumes as active

### Tests for User Story 2

- [X] T021 [P] [US2] Add test for `resume_stint` blocking when active stint exists in `app/lib/supabase/stints.test.ts`
- [X] T022 [P] [US2] Add test for successful resume after stopping active stint in `app/lib/supabase/stints.test.ts`

### Implementation for User Story 2

- [X] T023 [US2] Add paused stint display section in `app/components/ProjectListCard.vue` showing project name, remaining time, and actions
- [X] T024 [US2] Add resume button handler for paused stint in dashboard
- [X] T025 [US2] Update conflict dialog to show "Resume paused" option when user has paused stint
- [X] T026 [US2] Add cache invalidation for `stintKeys.paused()` after resume operations

**Checkpoint**: User Stories 1 AND 2 complete - users can pause, switch, and return to paused stints ✅

---

## Phase 5: User Story 3 - Abandon Paused Stint (Priority: P2)

**Goal**: Enable users to stop a paused stint without it counting toward daily totals

**Independent Test**: Have paused stint, click stop button, confirm → verify stint marked as interrupted and excluded from totals

### Tests for User Story 3

- [X] T027 [P] [US3] Add test for stopping paused stint with `interrupted` completion type in `app/lib/supabase/stints.test.ts`
- [X] T028 [P] [US3] Add test for interrupted stint being excluded from daily totals query in `app/lib/supabase/stints.test.ts`

### Implementation for User Story 3

- [X] T029 [US3] Abandon functionality integrated into ProjectListCard (simplified, no separate dialog)
- [X] T030 [US3] Add abandon button to paused stint display in ProjectListCard
- [X] T031 [US3] Wire abandon handler to `completeStint()` with `interrupted` completion type

**Checkpoint**: User Stories 1, 2, AND 3 complete - full pause-switch-resume-abandon flow works ✅

---

## Phase 6: User Story 4 - Conflict Resolution Dialog (Priority: P2)

**Goal**: Provide clear options in conflict dialog when user tries to start new stint

**Independent Test**: Have paused stint, click "Start Stint" on different project → verify dialog shows appropriate options

### Tests for User Story 4

- [X] T032 [P] [US4] Add test for conflict dialog showing correct options for ACTIVE existing stint
- [X] T033 [P] [US4] Add test for conflict dialog showing correct options for PAUSED existing stint

### Implementation for User Story 4

- [X] T034 [US4] Add `complete-active-and-start` action handler to conflict resolution in dashboard
- [X] T035 [US4] Add `start-alongside` action handler (starts new stint without affecting paused) in dashboard
- [X] T036 [US4] Add `complete-paused-and-start` action handler in dashboard
- [X] T037 [US4] Add contextual UI styling to conflict dialog based on existing stint status per `quickstart.md`

**Checkpoint**: All user stories complete - full feature functionality implemented ✅

---

## Phase 7: Edge Cases & Polish

**Purpose**: Handle edge cases and cross-cutting concerns

### Edge Case Tests

- [X] T038 [P] Add test for preventing double-pause (pause when paused stint already exists) in `app/lib/supabase/stints.test.ts`
- [X] T039 [P] Add test for database constraint rejecting 2 active stints in `app/lib/supabase/stints.test.ts`
- [X] T040 [P] Add test for database constraint rejecting 2 paused stints in `app/lib/supabase/stints.test.ts`

### Integration Tests

- [ ] T041 Add integration test for pause-and-switch flow in `app/composables/useStints.test.ts`
- [ ] T042 Add integration test for resume-after-stop flow in `app/composables/useStints.test.ts`

### Verification

- [X] T043 Run lint: `npm run lint`
- [X] T044 Run tests: `npm run test:run`
- [X] T045 Run build: `npm run generate`
- [ ] T046 Manual verification per `quickstart.md` verification checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion - BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 - Core feature, enables switching
- **Phase 4 (US2)**: Depends on Phase 2 - Can run in parallel with US1
- **Phase 5 (US3)**: Depends on Phase 2 - Can run in parallel with US1/US2
- **Phase 6 (US4)**: Depends on Phase 3 (needs conflict dialog) - Enhances dialog options
- **Phase 7 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Depends On | Can Run With |
|-------|------------|--------------|
| US1 (Switch) | Phase 2 only | US2, US3, US4 |
| US2 (Return) | Phase 2 only | US1, US3 |
| US3 (Abandon) | Phase 2 only | US1, US2 |
| US4 (Dialog) | Phase 2 + US1 | US2, US3 |

### Within Each User Story

1. Write tests first (marked [P] = parallelizable)
2. Implement features
3. Verify tests pass
4. Mark story complete

### Parallel Opportunities

**Phase 1 (Setup)**:
```
T003 [P] Create active stint index || T004 [P] Create paused stint index
```

**Phase 2 (Foundational)**:
```
T009 Modify getActiveStint || T010 [P] Add getPausedStint
```

**User Story Tests** (all [P] within same story):
```
T014 [P] || T015 [P] || T016 [P]  # US1 tests
T021 [P] || T022 [P]              # US2 tests
T027 [P] || T028 [P]              # US3 tests
T032 [P] || T033 [P]              # US4 tests
```

**Edge Case Tests**:
```
T038 [P] || T039 [P] || T040 [P]  # All edge case tests
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (database changes)
2. Complete Phase 2: Foundational (queries)
3. Complete Phase 3: User Story 1 (pause and switch)
4. **STOP and VALIDATE**: Test switching flow independently
5. Deploy/demo if ready - users can now pause and switch!

### Incremental Delivery

1. Setup + Foundational → Database ready
2. Add US1 (Switch) → Test independently → Deploy (MVP!)
3. Add US2 (Return) → Test independently → Deploy
4. Add US3 (Abandon) → Test independently → Deploy
5. Add US4 (Dialog Polish) → Test independently → Deploy
6. Each story adds value without breaking previous stories

### Suggested Commit Points

- After T008: "feat(db): add pause-and-switch constraints"
- After T013: "feat(stints): add paused stint query infrastructure"
- After T020: "feat(stints): implement pause and switch (US1)"
- After T026: "feat(stints): implement resume from paused (US2)"
- After T031: "feat(stints): implement abandon paused stint (US3)"
- After T037: "feat(stints): enhance conflict dialog options (US4)"
- After T046: "test(stints): add edge case and integration tests"

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 46 |
| **Phase 1 (Setup)** | 8 |
| **Phase 2 (Foundational)** | 5 |
| **User Story 1 (P1)** | 7 |
| **User Story 2 (P1)** | 6 |
| **User Story 3 (P2)** | 5 |
| **User Story 4 (P2)** | 6 |
| **Phase 7 (Polish)** | 9 |
| **Parallel Opportunities** | 15 tasks marked [P] |
| **MVP Scope** | Phases 1-3 (20 tasks) |

### Key Files Modified

| File | Phase | Changes |
|------|-------|---------|
| `supabase/migrations/*_pause_and_switch.sql` | 1 | New migration |
| `app/lib/supabase/stints.ts` | 2 | Modify `getActiveStint`, add `getPausedStint` |
| `app/composables/useStints.ts` | 2 | Add `usePausedStintQuery`, update cache keys |
| `app/components/StintConflictDialog.vue` | 3 | New component |
| `app/components/StintAbandonDialog.vue` | 5 | New component |
| `app/pages/dashboard.vue` | 3-6 | Integrate dialogs, display paused stint |
| `app/lib/supabase/stints.test.ts` | 3-7 | Add tests |
| `app/composables/useStints.test.ts` | 7 | Add integration tests |

### Independent Test Criteria per Story

| Story | How to Verify Independently |
|-------|----------------------------|
| US1 | Start stint → Pause → Start on different project → Both stints exist |
| US2 | Pause stint → Start new → Stop new → Resume paused → Works |
| US3 | Pause stint → Click stop → Confirm → Marked interrupted |
| US4 | Pause stint → Start new → Dialog shows correct options |
