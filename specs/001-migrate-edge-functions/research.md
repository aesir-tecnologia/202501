# Research: Migrate Supabase Edge Functions to Nuxt Client

**Branch**: `001-migrate-edge-functions` | **Date**: 2025-11-20

## Executive Summary

This research document consolidates findings for migrating 7 Supabase Edge Functions to client-side Nuxt composables. All edge functions follow a consistent pattern of authentication → validation → database operation (via RPC or direct query). The migration will preserve existing PostgreSQL RPC functions and leverage the three-layer architecture pattern already established in the codebase.

## Edge Functions Analysis

### 1. stints-start (POST /api/stints/start)

**Current Implementation:**
- Validates projectId and optional plannedDurationMinutes
- Retrieves user version for optimistic locking
- Fetches project to check custom_stint_duration and archived status
- Determines final planned duration (provided > project custom > default 120)
- Validates duration bounds (5-480 minutes)
- Calls `validate_stint_start()` RPC to check for active stints
- On conflict: returns 409 with existing stint details
- On success: inserts new stint record
- Handles race conditions with unique constraint violation (23505)

**Key Logic to Preserve:**
- Optimistic locking via user version
- Three-tier duration resolution: parameter → project custom → default
- Conflict detection with detailed existing stint information
- Race condition handling for concurrent requests

**Migration Strategy:**
- Move validation logic to `app/schemas/stints.ts` (Zod schema)
- Move database operations to `app/lib/supabase/stints.ts` (startStint function)
- Create TanStack Query mutation in `app/composables/useStints.ts`
- Preserve `validate_stint_start()` RPC call for server-side consistency checks

---

### 2. stints-stop (PATCH /api/stints/:id/stop)

**Current Implementation:**
- Validates stintId (required string)
- Validates optional notes (max 500 characters)
- Verifies stint exists and belongs to user
- Calls `complete_stint()` RPC with completion_type='manual'
- Maps database errors to HTTP status codes

**Key Logic to Preserve:**
- Notes length validation (500 char max)
- Stint ownership verification
- Error message mapping (not active → 400, not found → 404)

**Migration Strategy:**
- Update existing `completeStint()` in `app/lib/supabase/stints.ts`
- Add notes validation to stint schema
- Create mutation in useStints composable
- Preserve `complete_stint()` RPC call

---

### 3. stints-pause (PATCH /api/stints/:id/pause)

**Current Implementation:**
- Validates stintId (required string)
- Verifies stint exists and belongs to user
- Calls `pause_stint()` RPC function
- Maps errors: "not active" → 400, "not found" → 404

**Key Logic to Preserve:**
- State validation (only active stints can be paused)
- Ownership verification

**Migration Strategy:**
- Use existing `pauseStint()` in `app/lib/supabase/stints.ts`
- Update to call RPC directly instead of edge function
- Add mutation in useStints composable

---

### 4. stints-resume (PATCH /api/stints/:id/resume)

**Current Implementation:**
- Validates stintId (required string)
- Verifies stint exists and belongs to user
- Calls `resume_stint()` RPC function
- Maps errors: "not paused" → 400, "not found" → 404

**Key Logic to Preserve:**
- State validation (only paused stints can be resumed)
- Ownership verification

**Migration Strategy:**
- Use existing `resumeStint()` in `app/lib/supabase/stints.ts`
- Update to call RPC directly instead of edge function
- Add mutation in useStints composable

---

### 5. stints-active (GET /api/stints/active)

**Current Implementation:**
- No request body validation
- Queries stints table for user's active or paused stint
- Returns stint or null if none found
- Uses `maybeSingle()` to handle 0 or 1 result

**Key Logic to Preserve:**
- Query filters: user_id match + status in ['active', 'paused']
- Return null (not error) when no active stint

**Migration Strategy:**
- Update existing `getActiveStint()` in `app/lib/supabase/stints.ts`
- Remove edge function invocation, use direct database query
- Create query hook in useStints composable

---

### 6. stint-auto-complete (Cron job)

**Current Implementation:**
- Uses service role key to bypass RLS
- Queries all active stints with planned_duration and started_at
- Client-side calculation: `startedAt + plannedDuration <= now`
- Calls `complete_stint()` RPC for each expired stint
- Handles errors gracefully (logs but continues batch)
- Returns summary of completed stints and errors

**Key Logic to Preserve:**
- Independent processing of each stint (one failure doesn't block others)
- Time calculation: `started_at + (planned_duration * 60 * 1000) <= now`
- Completion type: 'auto'

**Migration Strategy:**
- **NOT client-side** - This requires server-side cron
- Create PostgreSQL function that queries and completes stints
- Set up pg_cron job to run every 2 minutes
- Remove edge function after migration

---

### 7. stint-sync-check (POST /api/stints/sync-check)

**Current Implementation:**
- Validates stintId (required string)
- Verifies stint exists and belongs to user
- Validates stint is active or paused (not completed)
- Calculates server-side remaining time:
  - Active: `planned_duration - (now - started_at) - paused_duration`
  - Paused: `planned_duration - (paused_at - started_at) - paused_duration`
- Returns remaining time in seconds and drift detection

**Key Logic to Preserve:**
- Different calculations for active vs paused stints
- Server-authoritative time calculation
- Drift detection (difference between client and server time)

**Migration Strategy:**
- Create new function `syncStintCheck()` in `app/lib/supabase/stints.ts`
- Can be implemented with RPC or client-side calculation with server timestamp
- Create mutation/query in useStints composable

## Technology Decisions

### 1. Client-Side Validation: Zod Schemas

**Decision**: Use existing Zod schema pattern in `app/schemas/stints.ts`

**Rationale**:
- Already established pattern for projects
- Runtime type safety with TypeScript inference
- Clear validation error messages
- Composable validation rules

**Implementation**:
```typescript
// app/schemas/stints.ts additions
export const startStintSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  plannedDurationMinutes: z.number().int().min(5).max(480).optional(),
  notes: z.string().max(500).optional(),
})

export const completeStintSchema = z.object({
  stintId: z.string().uuid('Invalid stint ID'),
  notes: z.string().max(500).optional(),
})

export const stintIdSchema = z.object({
  stintId: z.string().uuid('Invalid stint ID'),
})
```

---

### 2. Database Layer: Direct RPC Calls

**Decision**: Continue using existing PostgreSQL RPC functions

**Rationale**:
- RPC functions contain business logic that should remain server-side
- Functions like `validate_stint_start()`, `pause_stint()`, `resume_stint()`, `complete_stint()` handle complex state transitions
- Server-side enforcement prevents client manipulation
- Already tested and working

**Functions to Use**:
- `validate_stint_start()` - Checks for active stints, validates version
- `pause_stint()` - State transition logic
- `resume_stint()` - State transition logic
- `complete_stint()` - Completion logic with timing calculations

---

### 3. Optimistic Updates: TanStack Query Pattern

**Decision**: Use existing TanStack Query mutation pattern from projects

**Rationale**:
- Instant UI feedback
- Automatic rollback on error
- Cache invalidation built-in
- Already implemented for projects

**Pattern**:
```typescript
// app/composables/useStints.ts
export function useStartStint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params) => {
      // 1. Validate with Zod
      // 2. Transform to DB payload
      // 3. Call database layer
    },
    onMutate: async (params) => {
      // Cancel outgoing queries
      // Snapshot current state
      // Optimistic update
      return { previousStints }
    },
    onError: (err, params, context) => {
      // Rollback to snapshot
      queryClient.setQueryData(stintKeys.lists(), context.previousStints)
    },
    onSuccess: () => {
      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: stintKeys.all })
    },
  })
}
```

---

### 4. Error Handling: Three-Layer Propagation

**Decision**: Follow existing error handling pattern from projects

**Rationale**:
- Consistent user experience
- Translates technical errors to user-friendly messages
- Preserves error context for debugging

**Layers**:
1. **Database Layer** (`app/lib/supabase/stints.ts`):
   ```typescript
   if (error.code === '23505') {
     return { data: null, error: new Error('A stint is already active') }
   }
   ```

2. **Composable Layer** (`app/composables/useStints.ts`):
   ```typescript
   const validation = schema.safeParse(payload)
   if (!validation.success) {
     throw new Error(validation.error.issues[0]?.message || 'Validation failed')
   }
   ```

3. **Component Layer**:
   ```typescript
   try {
     await startStint({ projectId, plannedDurationMinutes })
     toast.add({ title: 'Stint started', color: 'success' })
   } catch (error) {
     toast.add({
       title: 'Failed to start stint',
       description: error.message,
       color: 'error',
     })
   }
   ```

---

### 5. Auto-Completion: PostgreSQL Cron Job

**Decision**: Migrate stint-auto-complete to pg_cron + PostgreSQL function

**Rationale**:
- Eliminates need for edge function
- More reliable scheduling with pg_cron
- Direct database access (no HTTP overhead)
- Consistent with server-side architecture

**Implementation**:
```sql
-- Create PostgreSQL function
CREATE OR REPLACE FUNCTION auto_complete_expired_stints()
RETURNS TABLE(completed_count int, error_count int)
AS $$
DECLARE
  v_completed_count int := 0;
  v_error_count int := 0;
BEGIN
  -- Find and complete expired stints
  FOR stint_record IN
    SELECT id
    FROM stints
    WHERE status = 'active'
      AND started_at + (planned_duration || ' minutes')::interval <= now()
  LOOP
    BEGIN
      PERFORM complete_stint(stint_record.id, 'auto', NULL);
      v_completed_count := v_completed_count + 1;
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      RAISE WARNING 'Failed to auto-complete stint %: %', stint_record.id, SQLERRM;
    END;
  END LOOP;

  RETURN QUERY SELECT v_completed_count, v_error_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron (every 2 minutes)
SELECT cron.schedule(
  'auto-complete-stints',
  '*/2 * * * *',
  $$ SELECT auto_complete_expired_stints(); $$
);
```

---

### 6. Constants: Shared Client-Side

**Decision**: Move STINT_CONSTRAINTS to `app/schemas/stints.ts`

**Rationale**:
- Already defined in edge functions' `_shared/constants.ts`
- Needed for client-side validation
- Single source of truth

**Constants**:
```typescript
export const STINT_SCHEMA_LIMITS = {
  MIN_DURATION: 5,
  MAX_DURATION: 480,
  DEFAULT_DURATION: 120,
  MAX_TOTAL_DURATION: 240,
  MAX_NOTES_LENGTH: 500,
} as const
```

---

## Data Model Changes

### No Schema Changes Required

All database tables and RPC functions remain unchanged:

**Tables Used**:
- `stints` - Main stint records
- `projects` - For custom_stint_duration lookup
- `user_profiles` - For version optimistic locking

**RPC Functions Used**:
- `validate_stint_start(p_user_id, p_project_id, p_version)` → `{ can_start, existing_stint_id, conflict_message }`
- `pause_stint(p_stint_id)` → StintRow
- `resume_stint(p_stint_id)` → StintRow
- `complete_stint(p_stint_id, p_completion_type, p_notes)` → StintRow

**New Functions**:
- `auto_complete_expired_stints()` - For pg_cron (replaces stint-auto-complete edge function)

---

## Dependencies

### Existing (No Changes)
- @supabase/supabase-js 2.57.4 - Database client
- @tanstack/vue-query 5.90.6 - State management
- Zod (via schemas) - Validation

### New (None Required)
All dependencies already available in the project.

---

## Performance Considerations

### Client-Side Benefits
- **Eliminates HTTP round-trip** to edge functions (~50-100ms saved)
- **Optimistic updates** provide instant UI feedback
- **Automatic retry** via TanStack Query for transient failures
- **Caching** reduces redundant queries

### Tradeoffs
- **Client bundle size** increases slightly (validation logic)
  - Estimated: +2-3 KB minified for validation schemas
  - Impact: Negligible for modern web apps

- **RPC calls** still require round-trip to database
  - Same as current edge function implementation
  - Cannot be eliminated without moving business logic to client (undesirable)

### Optimization Opportunities
- **Debounce** sync-check calls (max 1 per minute)
- **Cache** active stint query (60 second TTL)
- **Batch** operations where possible (future enhancement)

---

## Testing Strategy

### Unit Tests
- `app/schemas/stints.ts` - Validation schema tests
- `app/lib/supabase/stints.ts` - Database layer tests with real Supabase
- `app/composables/useStints.ts` - Composable tests with mocked Supabase

### Integration Tests
- Full flow: start → pause → resume → complete
- Conflict detection on concurrent start attempts
- Auto-completion via manual trigger of PostgreSQL function
- Sync-check accuracy with time drift scenarios

### Test Users
- Use existing Playwright test user for E2E tests
- Local Supabase instance for development testing

---

## Migration Sequence

### Phase 1: Add Client-Side Functions (Non-Breaking)
1. Update `app/schemas/stints.ts` with new validation schemas
2. Update `app/lib/supabase/stints.ts` with new functions
3. Update `app/composables/useStints.ts` with new mutations/queries
4. Write tests for all three layers

### Phase 2: Create Auto-Completion Cron
1. Create migration for `auto_complete_expired_stints()` function
2. Set up pg_cron job (or Supabase equivalent)
3. Test cron execution manually
4. Monitor for 24 hours

### Phase 3: Update Components
1. Update components to use new composables
2. Remove edge function invocations
3. Test all user flows

### Phase 4: Remove Edge Functions
1. Verify all functionality works without edge functions
2. Delete `supabase/functions/stints-*` directories
3. Remove `_shared` directory if no other functions use it
4. Update deployment configuration

---

## Risk Mitigation

### Risk 1: Race Conditions During Migration
**Mitigation**:
- Keep edge functions active during initial deployment
- Use feature flag to gradually roll out client-side code
- Monitor error rates closely

### Risk 2: Auto-Completion Gaps
**Mitigation**:
- Run both cron job and edge function in parallel for 1 week
- Monitor completion counts
- Alert if discrepancies detected

### Risk 3: Client-Side Validation Bypass
**Mitigation**:
- RLS policies enforce security at database level
- PostgreSQL constraints catch invalid data
- RPC functions contain business logic validation

### Risk 4: Token Expiration During Operations
**Mitigation**:
- Supabase client handles automatic token refresh
- Operations are short-lived (<1s typical)
- Error handling with retry for auth errors

---

## Open Questions (All Resolved)

All technical clarifications have been obtained from the feature specification:

- ✅ Auto-completion trigger: Server-side cron job every 2 minutes
- ✅ Retry policy: No automatic retry, user sees error immediately
- ✅ Observability: Client-side error logging only
- ✅ Token refresh: Handled by Supabase client automatically

---

## Alternatives Considered

### Alternative 1: Keep Edge Functions
**Rejected Because**:
- Adds unnecessary complexity (extra deployment layer)
- Higher latency (client → edge function → database vs client → database)
- Harder to test locally
- Inconsistent with project's SSG + client-side architecture

### Alternative 2: Move Business Logic to Client
**Rejected Because**:
- Security risk (client can manipulate validation)
- Violates constitution's server-authoritative principle
- Would require major refactoring of RPC functions
- No clear benefit over current hybrid approach

### Alternative 3: GraphQL Instead of RPC
**Rejected Because**:
- Supabase uses RPC functions, not GraphQL
- Would require complete rewrite of server logic
- No benefit for this use case (simple CRUD + state transitions)

---

## Success Metrics

- ✅ All 7 edge functions replaced with client-side equivalents
- ✅ No change in user-facing behavior (same success/error cases)
- ✅ <1s stint start operation (from click to confirmation)
- ✅ 100% test coverage for new validation schemas
- ✅ Auto-completion runs every 2 minutes with <1% error rate
- ✅ Zero security vulnerabilities introduced
- ✅ Deployment size increase <5 KB
