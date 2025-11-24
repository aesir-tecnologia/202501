# Quickstart Guide: Migrate Edge Functions to Client

**Branch**: `001-migrate-edge-functions` | **Date**: 2025-11-20

## Purpose

This quickstart provides a step-by-step guide for implementing the stint operations migration from Supabase Edge Functions to client-side composables. Follow this guide in sequence to ensure a smooth migration with proper testing at each step.

## Prerequisites

Before starting implementation:

- ✅ Local Supabase instance running (`supabase start`)
- ✅ Environment variables set in `.env` (SUPABASE_URL, SUPABASE_ANON_KEY)
- ✅ Development server working (`npm run dev`)
- ✅ Tests passing (`npm run test:run`)
- ✅ All planning documents reviewed (spec.md, research.md, data-model.md)

## Implementation Phases

The migration follows a **non-breaking, incremental approach** to minimize risk:

1. **Phase 1**: Add client-side functions (parallel to edge functions)
2. **Phase 2**: Create auto-completion cron job (parallel to edge function)
3. **Phase 3**: Update components to use client-side functions
4. **Phase 4**: Remove edge functions after verification

---

## Phase 1: Client-Side Implementation (Non-Breaking)

### Step 1.1: Update Validation Schemas

**File**: `app/schemas/stints.ts`

**Task**: Add new validation schemas for stint operations

```typescript
// Add to app/schemas/stints.ts

// Constants (from edge functions)
export const STINT_SCHEMA_LIMITS = {
  MIN_DURATION: 5,
  MAX_DURATION: 480,
  DEFAULT_DURATION: 120,
  MAX_TOTAL_DURATION: 240,
  MAX_NOTES_LENGTH: 500,
} as const

// Start stint schema
export const startStintSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  plannedDurationMinutes: z
    .number()
    .int('Duration must be a whole number')
    .min(STINT_SCHEMA_LIMITS.MIN_DURATION, `Duration must be at least ${STINT_SCHEMA_LIMITS.MIN_DURATION} minutes`)
    .max(STINT_SCHEMA_LIMITS.MAX_DURATION, `Duration cannot exceed ${STINT_SCHEMA_LIMITS.MAX_DURATION} minutes`)
    .optional(),
  notes: z
    .string()
    .max(STINT_SCHEMA_LIMITS.MAX_NOTES_LENGTH, `Notes cannot exceed ${STINT_SCHEMA_LIMITS.MAX_NOTES_LENGTH} characters`)
    .optional(),
})

// Complete stint schema
export const completeStintSchema = z.object({
  stintId: z.string().uuid('Invalid stint ID'),
  notes: z
    .string()
    .max(STINT_SCHEMA_LIMITS.MAX_NOTES_LENGTH, `Notes cannot exceed ${STINT_SCHEMA_LIMITS.MAX_NOTES_LENGTH} characters`)
    .optional(),
})

// Stint ID schema (for pause/resume/sync)
export const stintIdSchema = z.object({
  stintId: z.string().uuid('Invalid stint ID'),
})

// Type exports
export type StartStintInput = z.infer<typeof startStintSchema>
export type CompleteStintInput = z.infer<typeof completeStintSchema>
export type StintIdInput = z.infer<typeof stintIdSchema>
```

**Test**: Create `tests/schemas/stints.test.ts` and verify validation rules

**Expected**: All validation constraints work (min/max duration, notes length, UUID format)

---

### Step 1.2: Update Database Layer

**File**: `app/lib/supabase/stints.ts`

**Task**: Replace edge function calls with direct database operations

**Changes**:

1. **Update startStint()**: Replace `client.functions.invoke('stints-start')` with direct implementation
2. **Update getActiveStint()**: Replace `client.functions.invoke('stints-active')` with direct query
3. **Update pauseStint()**: Replace `client.functions.invoke('stints-pause')` with RPC call
4. **Update resumeStint()**: Replace `client.functions.invoke('stints-resume')` with RPC call
5. **Update completeStint()**: Replace `client.functions.invoke('stints-stop')` with RPC call
6. **Add syncStintCheck()**: New function for timer sync

**Example** (startStint implementation):

```typescript
export async function startStint(
  client: TypedSupabaseClient,
  projectId: string,
  plannedDurationMinutes?: number,
  notes?: string,
): Promise<StintConflictResult | Result<StintRow>> {
  const userResult = await requireUserId(client)
  if (userResult.error) return { data: null, error: userResult.error }
  const userId = userResult.data!

  // Get user version for optimistic locking
  const { data: userProfile, error: profileError } = await client
    .from('user_profiles')
    .select('version')
    .eq('id', userId)
    .single<{ version: number }>()

  if (profileError || !userProfile) {
    return { data: null, error: new Error('Failed to get user version') }
  }

  // Get project to determine planned duration
  const { data: project, error: projectError } = await client
    .from('projects')
    .select('custom_stint_duration')
    .eq('id', projectId)
    .eq('user_id', userId)
    .is('archived_at', null)
    .single<{ custom_stint_duration: number | null }>()

  if (projectError || !project) {
    return { data: null, error: new Error('Project not found or archived') }
  }

  // Determine planned duration
  const plannedDuration = plannedDurationMinutes ?? project.custom_stint_duration ?? 120

  // Validate duration bounds
  if (plannedDuration < 5 || plannedDuration > 480) {
    return { data: null, error: new Error(`Planned duration must be between 5 and 480 minutes`) }
  }

  // Validate stint start
  const { data: validation, error: validationError } = await client
    .rpc('validate_stint_start', {
      p_user_id: userId,
      p_project_id: projectId,
      p_version: userProfile.version,
    })
    .single<{ can_start: boolean; existing_stint_id: string | null; conflict_message: string | null }>()

  if (validationError) {
    return { data: null, error: new Error('Validation failed') }
  }

  // Handle conflict
  if (!validation.can_start) {
    if (!validation.existing_stint_id) {
      return {
        error: {
          code: 'CONFLICT',
          existingStint: null,
          message: validation.conflict_message || 'Cannot start stint: conflict detected',
        },
        data: null,
      }
    }

    const { data: existingStint } = await client
      .from('stints')
      .select('*')
      .eq('id', validation.existing_stint_id)
      .eq('user_id', userId)
      .single()

    return {
      error: {
        code: 'CONFLICT',
        existingStint: existingStint || null,
        message: validation.conflict_message || 'An active stint already exists',
      },
      data: null,
    }
  }

  // Create stint
  const { data: newStint, error: createError } = await client
    .from('stints')
    .insert({
      project_id: projectId,
      user_id: userId,
      status: 'active',
      planned_duration: plannedDuration,
      started_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (createError) {
    // Handle race condition
    if (createError.code === '23505') {
      const { data: activeStint } = await client
        .from('stints')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'paused'])
        .maybeSingle()

      if (activeStint) {
        return {
          error: {
            code: 'CONFLICT',
            existingStint: activeStint,
            message: 'Another stint was started concurrently',
          },
          data: null,
        }
      }
    }

    return { data: null, error: createError }
  }

  return { data: newStint, error: null }
}
```

**Test**: Update `tests/lib/supabase/stints.test.ts`

**Expected**: All database operations work identically to edge functions

---

### Step 1.3: Update Composables Layer

**File**: `app/composables/useStints.ts`

**Task**: Create TanStack Query mutations/queries for all operations

**Changes**:

1. **useStartStint()**: Mutation with optimistic updates
2. **usePauseStint()**: Mutation with optimistic updates
3. **useResumeStint()**: Mutation with optimistic updates
4. **useCompleteStint()**: Mutation with optimistic updates
5. **useActiveStintQuery()**: Query with caching
6. **useSyncStintCheck()**: Mutation for timer sync

**Example** (useStartStint implementation):

```typescript
export function useStartStint() {
  const client = useSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: StartStintInput) => {
      // Validate with Zod
      const validation = startStintSchema.safeParse(params)
      if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || 'Validation failed')
      }

      // Call database layer
      const result = await startStint(
        client,
        params.projectId,
        params.plannedDurationMinutes,
        params.notes,
      )

      // Handle conflict
      if ('error' in result && result.error && 'code' in result.error) {
        const conflictError = result.error as ConflictError
        const error = new Error(conflictError.message)
        ;(error as any).code = 'CONFLICT'
        ;(error as any).existingStint = conflictError.existingStint
        throw error
      }

      // Handle other errors
      if (result.error) {
        throw result.error
      }

      return result.data!
    },
    onMutate: async (params) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: stintKeys.all })

      // Snapshot current state
      const previousStints = queryClient.getQueryData<StintRow[]>(stintKeys.lists())
      const previousActive = queryClient.getQueryData<StintRow | null>(stintKeys.active())

      // Optimistic update: Add placeholder stint
      // (We don't have full stint data yet, so we'll skip optimistic create)
      // Instead, we'll just invalidate on success

      return { previousStints, previousActive }
    },
    onError: (err, params, context) => {
      // Rollback optimistic update if needed
      if (context?.previousStints) {
        queryClient.setQueryData(stintKeys.lists(), context.previousStints)
      }
      if (context?.previousActive !== undefined) {
        queryClient.setQueryData(stintKeys.active(), context.previousActive)
      }
    },
    onSuccess: () => {
      // Invalidate all stint queries to refetch
      queryClient.invalidateQueries({ queryKey: stintKeys.all })
    },
  })
}
```

**Test**: Create `tests/composables/useStints.test.ts`

**Expected**: All mutations work with optimistic updates and rollback

---

## Phase 2: Auto-Completion Cron Job

### Step 2.1: Create PostgreSQL Function

**File**: `supabase/migrations/[timestamp]_add_auto_complete_function.sql`

**Task**: Create `auto_complete_expired_stints()` function

**Migration Content**:

```sql
-- Create auto-completion function
CREATE OR REPLACE FUNCTION auto_complete_expired_stints()
RETURNS TABLE (
  completed_count integer,
  error_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_completed_count integer := 0;
  v_error_count integer := 0;
  v_stint_record RECORD;
BEGIN
  FOR v_stint_record IN
    SELECT id, user_id, started_at, planned_duration
    FROM stints
    WHERE status = 'active'
      AND planned_duration IS NOT NULL
      AND started_at IS NOT NULL
      AND (started_at + (planned_duration || ' minutes')::interval) <= now()
  LOOP
    BEGIN
      PERFORM complete_stint(v_stint_record.id, 'auto', NULL);
      v_completed_count := v_completed_count + 1;
      RAISE NOTICE 'Auto-completed stint % for user %', v_stint_record.id, v_stint_record.user_id;
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      RAISE WARNING 'Failed to auto-complete stint %: %', v_stint_record.id, SQLERRM;
    END;
  END LOOP;

  RETURN QUERY SELECT v_completed_count, v_error_count;
END;
$$;
```

**Apply Migration**:

```bash
supabase db reset
```

**Test Manually**:

```sql
-- Create a test stint with short duration
INSERT INTO stints (user_id, project_id, status, planned_duration, started_at)
VALUES (
  auth.uid(),
  'your-project-id',
  'active',
  1, -- 1 minute
  now() - interval '2 minutes' -- Started 2 minutes ago (already expired)
);

-- Run auto-completion
SELECT * FROM auto_complete_expired_stints();

-- Expected: completed_count=1, error_count=0
```

---

### Step 2.2: Set Up Cron Schedule

**Option A: pg_cron (if available)**

```sql
SELECT cron.schedule(
  'auto-complete-stints',
  '*/2 * * * *', -- Every 2 minutes
  $$ SELECT auto_complete_expired_stints(); $$
);
```

**Option B: Supabase Platform Cron (recommended for production)**

Use Supabase dashboard to create a scheduled function call.

**Option C: External Cron (fallback)**

Create GitHub Action or other external scheduler to call the function via Supabase API.

**Verification**:

- Wait 2 minutes
- Check logs for auto-completion notices
- Verify expired stints are being completed

---

## Phase 3: Update Components

### Step 3.1: Replace Edge Function Calls in Components

**Files to Update**: Search for `client.functions.invoke('stints-*')` usages

**Find Usages**:

```bash
grep -r "functions.invoke('stints-" app/
```

**Replace Pattern**:

```typescript
// OLD (edge function):
const { data, error } = await client.functions.invoke('stints-start', {
  body: { projectId, plannedDurationMinutes }
})

// NEW (composable):
const { mutateAsync: startStint } = useStartStint()
try {
  const stint = await startStint({ projectId, plannedDurationMinutes })
  toast.add({ title: 'Stint started', color: 'success' })
} catch (error) {
  toast.add({
    title: 'Failed to start stint',
    description: error.message,
    color: 'error',
  })
}
```

**Test Each Component**:

- Test start stint (success and conflict cases)
- Test pause stint
- Test resume stint
- Test complete stint
- Test active stint query
- Test timer sync

---

## Phase 4: Remove Edge Functions

### Step 4.1: Verify All Functionality

**Checklist**:

- ✅ All stint operations work in UI
- ✅ Conflict detection works (try starting stint when one is active)
- ✅ Auto-completion works (verify via logs or manual test)
- ✅ Timer sync works (check drift correction)
- ✅ All tests passing (`npm run test:run`)
- ✅ No errors in browser console
- ✅ No errors in Supabase logs

**Monitor for 24-48 Hours**:

- Check error rates
- Verify auto-completion is running
- Monitor user reports

---

### Step 4.2: Remove Edge Function Code

**Once verified**:

```bash
# Remove edge function directories
rm -rf supabase/functions/stints-start
rm -rf supabase/functions/stints-stop
rm -rf supabase/functions/stints-pause
rm -rf supabase/functions/stints-resume
rm -rf supabase/functions/stints-active
rm -rf supabase/functions/stint-auto-complete
rm -rf supabase/functions/stint-sync-check

# Remove shared utilities if no other functions use them
rm -rf supabase/functions/_shared
```

**Update Deployment**:

- Remove edge function deployment from CI/CD
- Update environment variables if needed
- Redeploy application

---

## Testing Strategy

### Unit Tests

**Schemas** (`tests/schemas/stints.test.ts`):

```typescript
describe('startStintSchema', () => {
  it('validates valid input', () => {
    const result = startStintSchema.safeParse({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      plannedDurationMinutes: 120,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid duration', () => {
    const result = startStintSchema.safeParse({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      plannedDurationMinutes: 1000, // Too high
    })
    expect(result.success).toBe(false)
  })
})
```

**Database Layer** (`tests/lib/supabase/stints.test.ts`):

```typescript
describe('startStint', () => {
  it('creates stint with valid input', async () => {
    const client = createTestClient()
    const result = await startStint(client, projectId, 120)
    expect(result.data).toBeDefined()
    expect(result.data?.status).toBe('active')
  })

  it('returns conflict when active stint exists', async () => {
    const client = createTestClient()
    await startStint(client, projectId, 120) // First stint
    const result = await startStint(client, projectId, 120) // Second stint (conflict)
    expect(result.error).toBeDefined()
    expect((result.error as any).code).toBe('CONFLICT')
  })
})
```

**Composables** (`tests/composables/useStints.test.ts`):

```typescript
describe('useStartStint', () => {
  it('starts stint and invalidates queries', async () => {
    const { mutateAsync } = useStartStint()
    const stint = await mutateAsync({ projectId, plannedDurationMinutes: 120 })
    expect(stint.status).toBe('active')
    // Verify query invalidation
  })
})
```

---

### Integration Tests

**Full Flow Test**:

```typescript
describe('Stint Lifecycle', () => {
  it('completes full lifecycle: start → pause → resume → complete', async () => {
    const { mutateAsync: startStint } = useStartStint()
    const { mutateAsync: pauseStint } = usePauseStint()
    const { mutateAsync: resumeStint } = useResumeStint()
    const { mutateAsync: completeStint } = useCompleteStint()

    // Start
    const stint = await startStint({ projectId, plannedDurationMinutes: 120 })
    expect(stint.status).toBe('active')

    // Pause
    const pausedStint = await pauseStint({ stintId: stint.id })
    expect(pausedStint.status).toBe('paused')

    // Resume
    const resumedStint = await resumeStint({ stintId: stint.id })
    expect(resumedStint.status).toBe('active')

    // Complete
    const completedStint = await completeStint({ stintId: stint.id })
    expect(completedStint.status).toBe('completed')
    expect(completedStint.completion_type).toBe('manual')
  })
})
```

---

## Rollback Plan

If issues arise during migration:

### Rollback Step 1: Revert Component Changes

- Git revert commits that updated components
- Restore edge function invocations
- Deploy

### Rollback Step 2: Keep New Code (Non-Breaking)

- Client-side functions can coexist with edge functions
- No need to remove database layer or composables
- Simply stop using them in components

### Rollback Step 3: Disable Cron Job

```sql
SELECT cron.unschedule('auto-complete-stints');
```

---

## Performance Monitoring

### Metrics to Track

**Before Migration** (baseline):

- Stint start latency (edge function)
- Error rate for stint operations
- Auto-completion success rate

**After Migration** (compare):

- Stint start latency (client-side)
- Error rate for stint operations
- Auto-completion success rate via cron

**Expected Improvements**:

- 50-100ms reduction in stint start latency (no edge function HTTP round-trip)
- Instant UI feedback via optimistic updates
- Same or better reliability

---

## Success Criteria

- ✅ All 7 edge functions replaced with client-side equivalents
- ✅ No change in user-facing behavior
- ✅ <1s stint start operation
- ✅ 100% test coverage for new code
- ✅ Auto-completion runs every 2 minutes with <1% error rate
- ✅ Zero security vulnerabilities
- ✅ Deployment size increase <5 KB

---

## Troubleshooting

### Issue: "User must be authenticated" Error

**Cause**: Supabase client not initialized or user not logged in

**Fix**: Ensure `useSupabaseClient()` is called in component context

### Issue: Conflict Error Not Showing Existing Stint

**Cause**: RLS policy preventing fetch of existing stint

**Fix**: Verify stint belongs to user, check RLS policies

### Issue: Auto-Completion Not Running

**Cause**: Cron job not scheduled or function failing

**Fix**:
1. Check cron schedule: `SELECT * FROM cron.job`
2. Check logs for errors
3. Test function manually: `SELECT * FROM auto_complete_expired_stints()`

### Issue: Optimistic Update Not Rolling Back

**Cause**: Missing onError handler or incorrect context

**Fix**: Verify onMutate returns context, onError receives and uses it

---

## Next Steps

After successful migration:

1. Monitor production metrics for 1 week
2. Gather user feedback
3. Document lessons learned
4. Apply same pattern to other features if applicable
5. Consider additional optimizations (e.g., WebSocket for real-time updates)
