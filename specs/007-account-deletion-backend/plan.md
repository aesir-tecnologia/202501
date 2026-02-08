# Implementation Plan: Account Deletion Backend

**Branch**: `007-account-deletion-backend` | **Date**: 2026-02-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-account-deletion-backend/spec.md`

## Summary

Implement GDPR-compliant account deletion backend with 30-day grace period, password re-authentication, audit logging, 7-day reminder emails, and automatic cleanup via scheduled Edge Function. Uses existing CASCADE foreign key constraints for data removal and Supabase Auth admin API for permanent user deletion.

## Technical Context

**Language/Version**: TypeScript 5.x (Nuxt 4 / Vue 3)
**Primary Dependencies**: @supabase/supabase-js, TanStack Query (Vue Query), Zod, Resend
**Storage**: PostgreSQL via Supabase (local dev + production)
**Testing**: Vitest with Happy DOM, co-located tests
**Target Platform**: Vercel (SSG) + Supabase Edge Functions
**Project Type**: Web application (Nuxt 4 SSG with client-side auth)
**Performance Goals**: Deletion HTTP request responds in <500ms (SC-001 measures full user flow at <60s); cleanup job processes 100+ accounts/run
**Constraints**: SERVICE_ROLE key must never be exposed client-side; email delivery non-blocking; reminder failures must not block deletions
**Scale/Scope**: Single-tenant, user-initiated, ~100 deletions/day max (per SC-006)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| Three-Layer Data Access | ⚠️ DEVIATION | Database → Schema → Composable for data; Auth calls exempt. See §Complexity Tracking. |
| Test-Driven Development | ✅ PASS | Co-located tests for all layers |
| SSG + Client-Side Auth | ✅ PASS | Settings page uses ssr: false, no SSG changes |
| Type Safety | ✅ PASS | Generated types from migrations |
| Error Handling | ✅ PASS | Result<T> → Zod → Toast pattern |
| Optimistic Updates | ⚠️ DEVIATION | Server-first for request (justified: security); immediate for cancel. See §Complexity Tracking. |
| Query Key Factory | ⚠️ DEVIATION | Simplified all/status keys (justified: singleton resource). See §Complexity Tracking. |

**Post-Design Re-Check**: Two pattern deviations and one layer exemption documented in §Complexity Tracking with justifications.

## Project Structure

### Documentation (this feature)

```text
specs/007-account-deletion-backend/
├── plan.md              # This file
├── research.md          # Phase 0 output (complete)
├── data-model.md        # Phase 1 output (complete)
├── quickstart.md        # Phase 1 output (complete)
├── contracts/           # Phase 1 output (complete)
│   └── account-deletion-api.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
app/
├── lib/supabase/
│   ├── account-deletion.ts       # Database layer (NEW)
│   └── account-deletion.test.ts  # Co-located tests (NEW)
├── schemas/
│   ├── account-deletion.ts       # Zod validation (NEW)
│   └── account-deletion.test.ts  # Co-located tests (NEW)
├── composables/
│   ├── useAccountDeletion.ts     # TanStack Query hooks (NEW)
│   └── useAccountDeletion.test.ts # Co-located tests (NEW)
└── types/
    └── database.types.ts         # Regenerated with new columns

supabase/
├── migrations/
│   ├── [timestamp]_add_deletion_requested_at.sql    # NEW
│   ├── [timestamp]_create_deletion_audit_log.sql    # NEW
│   └── [timestamp]_schedule_deletion_cleanup_cron.sql # NEW
└── functions/
    ├── process-account-deletions/
    │   └── index.ts              # Cleanup + Reminder Edge Function (NEW)
    └── send-deletion-email/
        └── index.ts              # Email Edge Function (NEW)
```

**Structure Decision**: Web application pattern - backend logic in app/lib/supabase + composables, server-side processing via Supabase Edge Functions.

## Complexity Tracking

Three documented deviations from constitution patterns. Each is intentional and justified below.

### Deviation 1: Server-First Mutation for Deletion Request

**Principle**: §VI Optimistic Updates with Automatic Rollback — "All mutations MUST implement optimistic updates with onMutate snapshot and immediate cache update."

**Deviation**: `useRequestDeletion()` verifies the user's password via `signInWithPassword()` before updating the cache. The optimistic update happens after server confirmation, not immediately.

**Justification**: Password re-authentication is a security-critical precondition. Optimistically assuming the password is correct and showing "deletion requested" before verification would create a misleading security state. If the server rejects the password, rolling back would flash a false "deletion pending" status — an unacceptable UX for a destructive action. The simpler alternative (immediate optimistic) was rejected because it violates the principle of least surprise for irreversible operations.

**Simpler alternative considered**: Standard optimistic update with rollback on auth failure — rejected due to misleading security feedback.

### Deviation 2: Simplified Query Key Factory

**Principle**: §VII Query Key Factory Pattern — "Centralized cache organization via key factories with all/lists/list(filters)/detail(id) levels."

**Deviation**: `accountDeletionKeys` defines only `all` and `status()` keys, omitting the `lists/list(filters)/detail(id)` hierarchy.

**Justification**: Account deletion status is a singleton per user, not a collection. There is no list of deletions to paginate, filter, or detail-view. The `all` → `status()` structure mirrors the domain: one user has exactly one deletion state. Adding empty `lists()` and `detail(id)` factories would be dead code with no consumer. The existing `projectKeys` factory uses the full hierarchy because projects are a collection — deletions are not.

**Simpler alternative considered**: Flat single key `['account-deletion']` — rejected because the two-level structure still enables targeted invalidation (`status` vs broad `all`).

### Deviation 3: Direct Auth Call in Composable Layer

**Principle**: §I Three-Layer Data Access Architecture — "All data access goes through Database → Schema → Composable layers."

**Deviation**: `useRequestDeletion()` calls `signInWithPassword()` directly in the composable layer instead of routing through a database-layer function.

**Justification**: `signInWithPassword()` is a Supabase Auth operation, not a data access query. The three-layer pattern governs PostgreSQL data access (tables, RLS, typed queries). Auth operations use a separate Supabase client method (`auth.signInWithPassword`) that doesn't interact with application tables, doesn't benefit from `TypedSupabaseClient` typing, and doesn't return `Result<T>`. Wrapping it in a database-layer function would add an indirection layer with no type safety or error translation benefit. The actual deletion mutation (`requestAccountDeletion()`) does go through all three layers correctly — only the password verification step is exempt.

**Simpler alternative considered**: Inline password check as a raw fetch — rejected because `signInWithPassword()` already provides proper error typing and session management.

## Critical Path

**Longest Chain**: 7 steps

| Step | Description | Blocks |
|------|-------------|--------|
| 1 | Migration: deletion_requested_at column | 2, 3, 4, 7 |
| 2 | Migration: deletion_audit_log table + helper functions | 3, 7 |
| 3 | Regenerate TypeScript types | 4, 5, 6 |
| 4 | Database layer functions | 6 |
| 5 | Zod validation schemas | 6 |
| 6 | Composable layer (TanStack Query) | 10 |
| 7 | Edge Function: process-account-deletions (deletions + reminders) | 9 |
| 8 | Edge Function: send-deletion-email (confirmation + reminder types) | 7 (reminder phase only), 10 |
| 9 | pg_cron job setup | 10 |
| 10 | Integration tests | 11 |
| 11 | Documentation update | - |

**Bottleneck Steps** (blocks 3+ downstream steps):
- **Step 1 (Migration: deletion_requested_at)**: Blocks 4 downstream steps - schema changes must be first
- **Step 3 (Type generation)**: Blocks 3 downstream steps - types required for all TS layers

## Testing Approach

| Component | Verification Method | Success Criteria |
|-----------|-------------------|------------------|
| deletion_requested_at column | Migration test | Column exists, nullable, correct type |
| deletion_audit_log table | Migration test | Table exists, indexes present, RLS enabled |
| generate_anonymized_user_ref() | Unit test | Returns consistent SHA-256 hash |
| log_deletion_event() | Integration test | Inserts audit row with correct anonymization |
| getDeletionStatus() | Unit test | Returns correct status, calculates days remaining |
| requestAccountDeletion() | Unit test + integration | Sets timestamp, logs event, validates preconditions |
| cancelAccountDeletion() | Unit test + integration | Clears timestamp, logs event |
| hasActiveStint() | Unit test | Correctly detects running stints |
| requestDeletionSchema | Unit test | Validates email format, requires password |
| useDeletionStatusQuery() | Unit test (mocked) | Returns status, handles loading/error states |
| useRequestDeletion() | Unit test (mocked) | Validates, mutates, updates cache; optimistic after server confirms |
| useCancelDeletion() | Unit test (mocked) | Mutates, updates cache, handles rollback |
| process-account-deletions Edge Function | Integration test | Phase 1: Deletes expired accounts, logs audit. Phase 2: Sends reminders for day-23 users |
| send-deletion-email Edge Function | Integration test | Sends confirmation and reminder emails via Resend API |
| Reminder email timing | Unit test | Only users at day 23 receive reminders; canceled requests skipped |
| pg_cron job | Manual verification | Job scheduled, triggers Edge Function |
| Full deletion flow | E2E test | Request → wait → reminder at day 23 → permanent deletion works |

## Delivery Strategy

**MVP Boundary**: Steps 1-6 + Step 10 (database, types, all three layers, integration tests)

This provides:
- Users can request and cancel deletion
- Deletion status is tracked and displayed
- Grace period enforced
- All data access patterns complete

**Incremental Slices**:
1. **MVP**: Database schema + Three-layer implementation + Tests (Steps 1-6, 10)
   - Manual cleanup possible via admin console
2. **Automation**: Edge Functions + pg_cron (Steps 7-9)
   - Automatic cleanup after 30 days
   - Automatic 7-day reminder emails (FR-014)
3. **Notifications**: Email Edge Function (Step 8)
   - Confirmation and reminder emails
4. **Documentation**: Roadmap update (Step 11)
   - Feature officially complete

## Risk Summary

| Severity | Count | Key Risks |
|----------|-------|-----------|
| HIGH | 3 | Service role key exposure, orphaned data, accidental deletion |
| MEDIUM | 3 | PII in audit log, cron failures, cascade FK changes |
| LOW | 5 | Email failures, active stint blocking, timezone issues, cancellation UX, reminder timing edge cases |

All HIGH severity risks have documented mitigations in [research.md](./research.md).

## Next Steps

Run `/speckit.tasks` to generate the implementation task list from this plan.
