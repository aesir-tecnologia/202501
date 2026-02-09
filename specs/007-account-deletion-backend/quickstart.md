# Quickstart: Account Deletion Backend Implementation

**Feature Branch**: `007-account-deletion-backend`
**Date**: 2026-02-03

## Prerequisites

- Local Supabase running (`supabase start`)
- Node.js environment set up
- Resend API key (for email functionality)

## Implementation Steps

### Step 1: Database Migration - Add deletion_requested_at column

**File**: `supabase/migrations/[timestamp]_add_deletion_requested_at.sql`

**What to do**:
1. Create migration file with timestamp
2. Add `deletion_requested_at` column to `user_profiles`
3. Create partial index for pending deletions

**Verification**:
```bash
supabase db reset
# Check column exists:
supabase db execute --sql "SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'deletion_requested_at'"
```

**Dependencies**: None (first step)

---

### Step 2: Database Migration - Create deletion_audit_log table

**File**: `supabase/migrations/[timestamp]_create_deletion_audit_log.sql`

**What to do**:
1. Create `deletion_audit_log` table with RLS enabled but no policies
2. Create `generate_anonymized_user_ref()` function
3. Create `log_deletion_event()` SECURITY DEFINER function
4. Create indexes for compliance queries

**Verification**:
```bash
supabase db reset
# Check table exists:
supabase db execute --sql "SELECT * FROM public.deletion_audit_log LIMIT 1"
# Check function works:
supabase db execute --sql "SELECT public.generate_anonymized_user_ref('00000000-0000-0000-0000-000000000001'::uuid)"
```

**Dependencies**: Step 1 (same migration batch)

---

### Step 3: Regenerate TypeScript Types

**Command**: `npm run supabase:types`

**What to do**:
1. Run type generation command
2. Verify `deletion_requested_at` appears in `UserProfilesRow`
3. Verify `deletion_audit_log` types are generated

**Verification**:
```bash
grep -n "deletion_requested_at" app/types/database.types.ts
grep -n "deletion_audit_log" app/types/database.types.ts
```

**Dependencies**: Steps 1-2 (migrations applied)

---

### Step 4: Create Database Layer Functions

**File**: `app/lib/supabase/account-deletion.ts`

**What to do**:
1. Create `getDeletionStatus()` - returns current deletion status
2. Create `requestAccountDeletion()` - sets deletion_requested_at, logs event
3. Create `cancelAccountDeletion()` - clears deletion_requested_at, logs event
4. Create `hasActiveStint()` - checks for running stints
5. Follow existing patterns from `app/lib/supabase/projects.ts`

**Key patterns**:
- Return `Result<T>` type
- Use `requireUserId()` for auth
- Translate errors to user-friendly messages

**Verification**:
- Write co-located tests in `app/lib/supabase/account-deletion.test.ts`
- Run: `npm test -- account-deletion`

**Dependencies**: Step 3 (types available)

---

### Step 5: Create Zod Validation Schemas

**File**: `app/schemas/account-deletion.ts`

**What to do**:
1. Create `requestDeletionSchema` (email + password required)
2. Create `deletionStatusSchema` (for type safety)
3. Export TypeScript types via `z.infer<>`

**Verification**:
- Write co-located tests in `app/schemas/account-deletion.test.ts`
- Test validation edge cases (empty email, missing password)

**Dependencies**: None (can be parallel with Step 4)

---

### Step 6: Create Composable Layer (TanStack Query)

**File**: `app/composables/useAccountDeletion.ts`

**What to do**:
1. Create `accountDeletionKeys` query key factory
2. Create `useDeletionStatusQuery()` hook
3. Create `useRequestDeletion()` mutation with optimistic update
4. Create `useCancelDeletion()` mutation with optimistic update
5. Implement password verification via `signInWithPassword()`

**Key patterns**:
- Validate with Zod before mutation
- Optimistic update after server confirms
- Rollback on error
- Invalidate queries on success

**Verification**:
- Write co-located tests in `app/composables/useAccountDeletion.test.ts`
- Mock Supabase client for unit tests

**Dependencies**: Steps 4-5 (database layer + schemas)

---

### Step 7: Create Edge Function - process-account-deletions

**File**: `supabase/functions/process-account-deletions/index.ts`

**What to do**:
1. Create Deno Edge Function with two phases:
   - **Phase 1 (Deletion)**: Query users with expired grace period (≥30 days). For each: log audit event, call `auth.admin.deleteUser()`. Return summary.
   - **Phase 2 (Reminders)**: Query users with `deletion_requested_at` between 23-24 days ago. For each: call `send-deletion-email` Edge Function with type `deletion_reminder` (FR-014). Failures logged but do not affect Phase 1 results.
2. Phase 1 MUST complete before Phase 2 begins (FR-014 compliance)
3. Return combined summary of deletions processed and reminders sent

**Environment Variables** (set in Supabase dashboard):
- `SUPABASE_URL` (auto-injected)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-injected)

**Verification**:
```bash
supabase functions serve process-account-deletions
# Test with curl (requires service role key)
```

**Dependencies**: Steps 1-2 (schema exists)

---

### Step 8: Create Edge Function - send-deletion-email

**File**: `supabase/functions/send-deletion-email/index.ts`

**What to do**:
1. Create Deno Edge Function
2. Accept email type (`deletion_confirmation` or `deletion_reminder`) and user ID
3. Fetch user email from database
4. Send via Resend API
5. For `deletion_confirmation`: include user_id, request timestamp, scheduled deletion date, cancel instructions (FR-003a)
6. For `deletion_reminder`: warn that account will be permanently deleted in 7 days, include cancel instructions (FR-014)

**Environment Variables**:
- `RESEND_API_KEY` (set in Supabase dashboard)

**Verification**:
```bash
supabase functions serve send-deletion-email
# Test with curl for both email types
```

**Dependencies**: None (independent)

---

### Step 9: Create pg_cron Job for Cleanup and Reminders

**File**: `supabase/migrations/[timestamp]_schedule_deletion_cleanup_cron.sql`

**What to do**:
1. Enable pg_net extension (if not already)
2. Create cron job `process-account-deletions` to run daily — calls Edge Function which handles two phases:
   - **Phase 1**: Permanently delete accounts with expired grace period (≥30 days)
   - **Phase 2**: Send reminder emails to users approaching 7-day window (day 23) by calling `send-deletion-email` Edge Function with type `deletion_reminder`
3. Phase 1 completes independently before Phase 2 starts — satisfies FR-014 ("email delivery failures MUST NOT block or delay the scheduled deletion")

**Verification**:
```sql
-- Check job is scheduled
SELECT * FROM cron.job WHERE jobname = 'process-account-deletions';
```

**Dependencies**: Steps 7-8 (Edge Functions exist)

---

### Step 10: Integration Tests

**File**: `app/lib/supabase/account-deletion.integration.test.ts`

**What to do**:
1. Test full deletion request flow
2. Test cancellation flow
3. Test active stint blocking
4. Test password verification failure
5. Test email mismatch failure

**Verification**:
```bash
npm run test:run -- account-deletion.integration
```

**Dependencies**: All previous steps

---

## File Checklist

### Database (supabase/migrations/)
- [ ] `[timestamp]_add_deletion_requested_at.sql`
- [ ] `[timestamp]_create_deletion_audit_log.sql`
- [ ] `[timestamp]_schedule_deletion_cleanup_cron.sql`

### Edge Functions (supabase/functions/)
- [ ] `process-account-deletions/index.ts`
- [ ] `process-account-deletions/index.test.ts`
- [ ] `send-deletion-email/index.ts`
- [ ] `send-deletion-email/index.test.ts`

### Database Layer (app/lib/supabase/)
- [ ] `account-deletion.ts`
- [ ] `account-deletion.test.ts`

### Schema Layer (app/schemas/)
- [ ] `account-deletion.ts`
- [ ] `account-deletion.test.ts`

### Composable Layer (app/composables/)
- [ ] `useAccountDeletion.ts`
- [ ] `useAccountDeletion.test.ts`

### Types (auto-generated)
- [ ] `app/types/database.types.ts` (regenerated)

### Documentation
- [ ] `docs/07-development-roadmap.md` (updated)

## Environment Variables Required

| Variable | Location | Purpose |
|----------|----------|---------|
| `RESEND_API_KEY` | Supabase Edge Function secrets | Email delivery |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected in Edge Functions | Admin user deletion |

## Testing Commands

```bash
# Unit tests during development
npm test -- account-deletion

# Run all tests once (CI mode)
npm run test:run

# Type check
npm run type-check

# Lint
npm run lint
```
