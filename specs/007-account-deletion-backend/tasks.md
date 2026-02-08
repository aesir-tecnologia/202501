# Tasks: Account Deletion Backend

**Input**: Design documents from `/specs/007-account-deletion-backend/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/account-deletion-api.yaml ✅, quickstart.md ✅

**Tests**: Co-located tests are INCLUDED as per the Testing Approach in plan.md and the established project convention.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a Nuxt 4 web application with:
- **Frontend/Composables**: `app/` at repository root
- **Database/Migrations**: `supabase/migrations/`
- **Edge Functions**: `supabase/functions/`
- **Generated Types**: `app/types/database.types.ts`

---

## Phase 0: Prerequisites (Infrastructure)

**Purpose**: External service setup that MUST complete before Edge Function development (T015) and US1 acceptance testing

- [ ] T000 Configure Resend email infrastructure — create Resend account, verify sending domain (or use sandbox for dev), set `RESEND_API_KEY` as Supabase Edge Function secret via `supabase secrets set RESEND_API_KEY=re_...`, verify setup by sending a test email from a scratch Edge Function

---

## Phase 1: Setup (Database Schema)

**Purpose**: Database migrations and type generation - MUST complete before any TypeScript implementation

- [ ] T001 Create migration for deletion_requested_at column in `supabase/migrations/[timestamp]_add_deletion_requested_at.sql` — add nullable `deletion_requested_at TIMESTAMPTZ` to `user_profiles` with partial index per data-model.md Migration 1
- [ ] T002 Create migration for deletion_audit_log table and helper functions in `supabase/migrations/[timestamp]_create_deletion_audit_log.sql` — create table, indexes, `generate_anonymized_user_ref()`, `log_deletion_event()` SECURITY DEFINER function per data-model.md Migrations 2-3
- [ ] T003 Apply migrations and regenerate TypeScript types — run `supabase db reset && npm run supabase:types`, verify `deletion_requested_at` and `deletion_audit_log` appear in `app/types/database.types.ts`

---

## Phase 2: Foundational (Core Infrastructure)

**Purpose**: Zod schemas and query key factory that ALL user stories depend on - MUST complete before user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 [P] Create requestDeletionSchema in `app/schemas/account-deletion.ts` — email (required, valid format) + password (required, min 1) per data-model.md Validation Rules; export `RequestDeletionPayload` type and `ACCOUNT_DELETION_SCHEMA_LIMITS` constant (PASSWORD_MIN_LENGTH: 1, EMAIL_MAX_LENGTH: 255)
- [ ] T005 [P] Create deletionStatusSchema in `app/schemas/account-deletion.ts` — isPending (boolean), requestedAt (string|null), expiresAt (string|null), daysRemaining (number|null) per data-model.md; export `DeletionStatus` type
- [ ] T006 [P] Create co-located schema tests in `app/schemas/account-deletion.test.ts` — test valid/invalid email, empty password, null fields in status schema
- [ ] T007 Create accountDeletionKeys query key factory in `app/composables/useAccountDeletion.ts` — follow Query Key Factory pattern from constitution (all, status)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Request Account Deletion (Priority: P1) 🎯 MVP

**Goal**: Users can request account deletion with password confirmation, triggering a 30-day grace period

**Independent Test**: User clicks "Delete Account" in settings, confirms via email and password entry, and verifies the confirmation email is received and account is marked for deletion.

**FR Coverage**: FR-001, FR-002, FR-003, FR-003a, FR-004, FR-006, FR-011

### Database Layer for User Story 1

- [ ] T008 [US1] Implement hasActiveStint() function in `app/lib/supabase/account-deletion.ts` — query stints where started_at IS NOT NULL AND completed_at IS NULL AND paused_at IS NULL per BR-001; return Result<boolean>
- [ ] T009 [US1] Implement getDeletionStatus() function in `app/lib/supabase/account-deletion.ts` — read deletion_requested_at from user_profiles, calculate expiresAt (+30 days) and daysRemaining; return Result<DeletionStatus>
- [ ] T010 [US1] Implement requestAccountDeletion() function in `app/lib/supabase/account-deletion.ts` — enforce preconditions (BR-001 active stint, BR-004 already pending), set deletion_requested_at = NOW(), call log_deletion_event('request'); return Result<DeletionStatus>
- [ ] T011 [P] [US1] Create co-located database layer tests in `app/lib/supabase/account-deletion.test.ts` — test hasActiveStint, getDeletionStatus (no pending, pending with days calc), requestAccountDeletion (success, active stint block, already pending block)

### Composable Layer for User Story 1

- [ ] T012 [US1] Implement useDeletionStatusQuery() hook in `app/composables/useAccountDeletion.ts` — use accountDeletionKeys.status(), call getDeletionStatus(), handle loading/error states
- [ ] T013 [US1] Implement useRequestDeletion() mutation in `app/composables/useAccountDeletion.ts` — validate with requestDeletionSchema, verify password via signInWithPassword (BR-003), verify email matches session (BR-002), call requestAccountDeletion() (no toDbPayload needed: database layer handles deletion_requested_at directly), update cache after server confirms (server-first optimistic: password verification must succeed before cache update), invalidate status query on success
- [ ] T014 [P] [US1] Create co-located composable tests in `app/composables/useAccountDeletion.test.ts` — test useDeletionStatusQuery (loading, success, error), useRequestDeletion (validation failure, password incorrect, email mismatch, success with cache update)

### Edge Function for User Story 1 (Email Notification)

- [ ] T015 [P] [US1] Create send-deletion-email Edge Function in `supabase/functions/send-deletion-email/index.ts` — accept `type` (deletion_confirmation | deletion_reminder) and `userId`; fetch user email from DB; send via Resend API. For deletion_confirmation: include user_id, request timestamp, scheduled deletion date, cancel instructions (FR-003, FR-003a). For deletion_reminder: warn permanent deletion in 7 days, include cancel instructions (FR-014). Both types use service role auth.
- [ ] T016 [P] [US1] Create co-located test for send-deletion-email Edge Function in `supabase/functions/send-deletion-email/index.test.ts` — test payload validation (missing type/userId), email type handling (confirmation vs reminder), Resend API error responses; use Deno.test with mocked Resend client

### UI Layer for User Story 1

- [ ] T017 [US1] Update Settings page to include "Delete Account" danger section with trigger button in `app/pages/settings.vue` — follow existing Settings layout pattern; button opens confirmation modal (FR-001); verify dark mode rendering and use docs/DESIGN_SYSTEM.md danger section color tokens
- [ ] T018 [US1] Implement deletion confirmation modal with email and password fields in `app/pages/settings.vue` — UModal with email input, password input, confirm/cancel buttons; call useRequestDeletion on confirm; show toast success/error; close modal on success (FR-002); consult Nuxt UI 4 docs via Context7 for UModal and form input APIs
- [ ] T019 [P] [US1] Display deletion status banner with days remaining when deletion is pending in `app/pages/settings.vue` — show prominent warning banner when useDeletionStatusQuery returns isPending=true; display daysRemaining countdown (FR-006); verify dark mode rendering and use docs/DESIGN_SYSTEM.md warning color tokens

**Checkpoint**: User Story 1 complete - users can request deletion with password confirmation, receive confirmation email, and see deletion status

---

## Phase 4: User Story 2 - Cancel Account Deletion (Priority: P2)

**Goal**: Users can cancel pending deletion during the 30-day grace period, restoring their account to normal status

**Independent Test**: User with pending deletion navigates to Settings, clicks "Cancel Deletion", and verifies account functions normally afterward.

**FR Coverage**: FR-005, FR-006, FR-012

### Database Layer for User Story 2

- [ ] T020 [US2] Implement cancelAccountDeletion() function in `app/lib/supabase/account-deletion.ts` — enforce BR-005 (must have pending deletion), set deletion_requested_at = NULL, call log_deletion_event('cancel'); return Result<DeletionStatus>
- [ ] T021 [P] [US2] Add cancellation tests to `app/lib/supabase/account-deletion.test.ts` — test cancelAccountDeletion (success clears timestamp, no-pending-request error)

### Composable Layer for User Story 2

- [ ] T022 [US2] Implement useCancelDeletion() mutation with optimistic update in `app/composables/useAccountDeletion.ts` — immediate optimistic update (set isPending=false in cache), call cancelAccountDeletion(), rollback on error per constitution Principle VI, invalidate status query on success
- [ ] T023 [P] [US2] Add cancellation tests to `app/composables/useAccountDeletion.test.ts` — test useCancelDeletion (optimistic update, rollback on error, success invalidates cache)

### UI Layer for User Story 2

- [ ] T024 [US2] Add "Cancel Deletion" button to deletion status banner in `app/pages/settings.vue` — button inside the pending-deletion banner from T019; call useCancelDeletion on click; show toast confirmation; banner disappears when deletion is canceled (FR-005); verify dark mode rendering and use docs/DESIGN_SYSTEM.md action button color tokens; consult Nuxt UI 4 docs for UButton API; add explicit test verifying auth middleware does not restrict users with deletion_requested_at during grace period (FR-012 validation)

**Checkpoint**: User Stories 1 AND 2 complete - users can request deletion and cancel it during grace period

**FR-012 Verification**: Full access during grace period is validated explicitly via test in T024 - verify auth middleware does not restrict users with `deletion_requested_at` set. Users can continue using all features (full CRUD operations via existing composables) during the grace period.

---

## Phase 5: User Story 3 - Automatic Permanent Deletion (Priority: P3)

**Goal**: System automatically and permanently deletes all user data after the 30-day grace period expires, sends 7-day reminder emails, via scheduled Edge Function

**Independent Test**: In test environment, fast-forward time past 30-day window and verify all user data is permanently removed and authentication fails. Verify users at day 23 receive reminder emails.

**FR Coverage**: FR-007, FR-008, FR-009, FR-010, FR-014

### Edge Function for User Story 3

- [ ] T025 [US3] Create process-account-deletions Edge Function scaffold in `supabase/functions/process-account-deletions/index.ts` — Deno Edge Function with service role auth, two-phase architecture per research.md Decision 6
- [ ] T026 [US3] Implement Phase 1 (Deletion): query users where `deletion_requested_at + INTERVAL '30 days' < NOW()` in process-account-deletions — for each: generate anonymized ref, call log_deletion_event('complete'), call `auth.admin.deleteUser()` (CASCADE deletes all data per FR-008, FR-009); return processedCount + errors (FR-007, FR-010: audit logs retained with anonymized refs)
- [ ] T027 [US3] Implement Phase 2 (Reminders): query users where `deletion_requested_at + INTERVAL '23 days' < NOW() AND deletion_requested_at + INTERVAL '24 days' > NOW()` in process-account-deletions — for each: call send-deletion-email Edge Function with type `deletion_reminder`; log failures but do NOT affect Phase 1 results (FR-014: failures must not block/delay deletions)
- [ ] T028 [P] [US3] Add idempotency test for process-account-deletions in `supabase/functions/process-account-deletions/index.test.ts`: verify Edge Function handles partial failures gracefully (re-run skips already-deleted users, no duplicate audit entries)
- [ ] T029 [P] [US3] Add PII verification test: (1) after permanent deletion, query all tables (user_profiles, projects, stints, user_streaks, daily_summaries) for deleted user_id and confirm zero rows exist (validates SC-005 GDPR compliance); (2) verify same email can re-register successfully and is treated as new user with no residual data (edge case: re-registration after deletion); (3) add integration test verifying full deletion lifecycle (request → cancel → re-request → complete) logs all four event types correctly with proper anonymization

### Scheduled Job for User Story 3

- [ ] T030 [US3] Create pg_cron migration in `supabase/migrations/[timestamp]_schedule_deletion_cleanup_cron.sql` — verify pg_net extension is enabled (⚠️ prerequisite from research.md), schedule daily cron job `process-account-deletions` to call Edge Function via pg_net HTTP POST
- [ ] T031 [US3] Configure pg_net HTTP POST payload and auth headers in the cron migration — include service role key from vault/env, target Edge Function URL, verify job is scheduled via `SELECT * FROM cron.job`

**Checkpoint**: All user stories complete - full deletion lifecycle works automatically with 7-day reminder emails

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and quality gates

- [ ] T032 Verify final PR description includes "Closes #43" to link implementation to tracking issue
- [ ] T033 Update quickstart.md File Checklist to include Edge Function test files: `supabase/functions/send-deletion-email/index.test.ts` and `supabase/functions/process-account-deletions/index.test.ts`
- [ ] T034 Run full test suite via `npm run test:run` and verify all tests pass
- [ ] T035 Run type check via `npm run type-check` and verify no errors
- [ ] T036 Run lint via `npm run lint` and verify no errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Prerequisites (Phase 0)**: No dependencies - can start immediately; MUST complete before T015 (send-deletion-email Edge Function)
- **Setup (Phase 1)**: No dependencies - can start in parallel with Phase 0
- **Foundational (Phase 2)**: Depends on Phase 1 (T003 type generation) - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion; T015 depends on Phase 0 (T000 Resend setup)
- **User Story 2 (Phase 4)**: Depends on Phase 2 completion (can run parallel to US1 if staffed)
- **User Story 3 (Phase 5)**: Depends on Phase 2 completion (can run parallel to US1/US2 if staffed); T027 (reminders) depends on T015 (send-deletion-email Edge Function from US1)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories - can be completed and deployed as MVP
- **User Story 2 (P2)**: Logically depends on US1 (need a deletion to cancel), but code implementation is independent
- **User Story 3 (P3)**: Logically depends on US1 (need deletions to process), but Edge Function implementation is independent. T027 (reminder sending) reuses `send-deletion-email` from T015 — implement T015 first if building stories sequentially.

### Within Each User Story

- Database layer MUST complete before composable layer (composables call database functions)
- Composable layer MUST complete before UI layer (UI uses composable hooks)
- Tests can run in parallel [P] after their implementation dependencies are met
- Edge Functions can be developed in parallel [P] with database/composable layers

### Parallel Opportunities

**Phase 1 (Sequential - migrations must be in order)**:
- T001 → T002 → T003

**Phase 2 (Mostly Parallel)**:
```
T004 ─┬─► T007 (query keys depend on schemas being defined)
T005 ─┤
T006 ─┘
```

**Phase 3 - User Story 1**:
```
T008 ─┬─► T012 ─► T013 ─┬─► T017 ─► T018 (UI depends on composables)
T009 ─┤                  │
T010 ─┤                  └─► T019 (status banner - parallel)
T011 ─┴─────────────────────  (tests can run in parallel)
T014 ──────────────────────►  (composable tests)
T015 ──────────────────────►  (Edge Function - fully parallel)
T016 ──────────────────────►  (Edge Function test - fully parallel)
```

**Phase 4 - User Story 2**:
```
T020 ─► T022 ─► T024 (UI depends on composable)
T021 ──────────►      (tests parallel)
T023 ──────────►      (tests parallel)
```

**Phase 5 - User Story 3**:
```
T025 ─► T026 ─► T027 (sequential within Edge Function phases)
T028 ──────────►     (idempotency test - parallel)
T029 ──────────►     (PII + lifecycle test - parallel)
T030 ─► T031         (cron setup - depends on T026 Edge Function existing)
```

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch all schema definitions in parallel:
Task: "Create requestDeletionSchema in app/schemas/account-deletion.ts"
Task: "Create deletionStatusSchema in app/schemas/account-deletion.ts"
Task: "Create co-located schema tests in app/schemas/account-deletion.test.ts"

# After schemas complete:
Task: "Create accountDeletionKeys query key factory in app/composables/useAccountDeletion.ts"
```

## Parallel Example: User Story 1 Database Layer

```bash
# Launch all database functions in parallel (same file, different functions):
Task: "Implement hasActiveStint() function"
Task: "Implement getDeletionStatus() function"
Task: "Implement requestAccountDeletion() function"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only) - RECOMMENDED

1. Complete Phase 1: Setup (migrations + type generation)
2. Complete Phase 2: Foundational (schemas + query keys)
3. Complete Phase 3: User Story 1 (request deletion with password confirmation)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - User can request deletion with correct email + password
   - Active stint blocks deletion request
   - Incorrect password is rejected
   - Deletion status is displayed correctly
   - Confirmation email is sent (or logged if Resend not configured)
5. Deploy/demo if ready - manual cleanup possible via Supabase admin console

### Incremental Delivery

1. **Phase 1-3 Complete** → MVP with request functionality (manual cleanup)
2. **Add User Story 2** → Users can cancel deletion (still manual cleanup)
3. **Add User Story 3** → Full automation with pg_cron cleanup job + 7-day reminder emails

### Risk Notes

Per research.md HIGH severity risks:
- **R1 (Service Role Key)**: T024-T026 must use Edge Function environment variables, NEVER expose to client
- **R2 (Orphaned Data)**: CASCADE constraints handle this - verify in T028 PII test
- **R3 (Accidental Deletion)**: T010/T013 requires password verification before setting deletion_requested_at

---

## Environment Variables Required

| Variable | Location | Task | Purpose |
|----------|----------|------|---------|
| `RESEND_API_KEY` | Supabase Edge Function secrets | T000, T015 | Email delivery (confirmation + reminder) |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected in Edge Functions | T024-T026 | Admin user deletion + reminder queries |

---

## Task Summary

| Phase | Task Count | User Story |
|-------|------------|------------|
| Phase 0: Prerequisites | 1 | - |
| Phase 1: Setup | 3 | - |
| Phase 2: Foundational | 4 | - |
| Phase 3: User Story 1 | 12 | US1 (Request Deletion) |
| Phase 4: User Story 2 | 5 | US2 (Cancel Deletion) |
| Phase 5: User Story 3 | 7 | US3 (Auto Permanent Deletion + Reminders) |
| Phase 6: Polish | 5 | - |
| **Total** | **37** | |

### Parallel Opportunities Identified

- Phase 2: 3 schema tasks can run in parallel
- User Story 1: Database functions, tests, Edge Function, and UI can run in parallel after composables complete
- User Story 2: Tests and UI can run in parallel with implementation
- User Story 3: Tests can run in parallel; Edge Function + cron setup are mostly sequential

### MVP Scope

**Recommended MVP**: Phases 0-4 (25 tasks - T000 through T024)
- Delivers: Request deletion with password confirmation, cancellation flow, email notification (confirmation + reminder types ready), status display, full UI
- Cleanup: Manual via Supabase admin console until User Story 3 is implemented

### Format Validation

✅ All 37 tasks follow the checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
✅ All user story tasks include [US1], [US2], or [US3] labels
✅ Setup, Prerequisites, and Foundational phases have NO story labels
✅ All tasks include specific file paths or explicit verification steps
✅ Clean sequential numbering (T000-T036, no sub-task IDs)
