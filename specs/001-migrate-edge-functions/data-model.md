# Data Model: Migrate Supabase Edge Functions to Nuxt Client

**Branch**: `001-migrate-edge-functions` | **Date**: 2025-11-20

## Overview

This document defines the data entities, validation rules, and state transitions for the stint operations migration. The migration does NOT modify any database schema - it only moves validation and operation logic from edge functions to the client-side three-layer architecture.

## Entities

### 1. Stint

**Description**: A timed work session for a specific project with state management (active/paused/completed).

**Database Table**: `stints` (no schema changes)

**Fields**:
| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| id | uuid | Yes (auto) | - | Primary key |
| user_id | uuid | Yes | FK to user_profiles | Set by RLS/database layer |
| project_id | uuid | Yes | FK to projects, must not be archived | Validated on start |
| status | enum | Yes | One of: active, paused, completed | State machine |
| planned_duration | integer | Yes | 5-480 minutes | Derived from params → project → default |
| started_at | timestamptz | Yes | - | Set on creation |
| paused_at | timestamptz | No | Only when status=paused | Set by pause_stint RPC |
| completed_at | timestamptz | No | Only when status=completed | Set by complete_stint RPC |
| paused_duration | integer | No | Cumulative minutes paused | Calculated by RPC |
| completion_type | enum | No | manual, auto, interrupted | Set on completion |
| notes | text | No | Max 500 characters | Optional completion notes |

**Relationships**:
- Belongs to: User (via user_id)
- Belongs to: Project (via project_id)

**Indexes** (existing, no changes):
- `idx_stints_user_status` on (user_id, status) - For active stint queries
- `idx_stints_project` on (project_id) - For project stint history
- `idx_stints_started_at` on (started_at DESC) - For chronological listing

**RLS Policies** (existing, no changes):
- Users can only SELECT/INSERT/UPDATE/DELETE their own stints
- Enforced via `user_id = auth.uid()` predicate

---

### 2. Project (Reference Only)

**Description**: Client project that stints belong to.

**Database Table**: `projects` (no schema changes)

**Relevant Fields for Migration**:
| Field | Type | Required | Usage |
|-------|------|----------|-------|
| id | uuid | Yes | Referenced by stint.project_id |
| user_id | uuid | Yes | Ownership verification |
| custom_stint_duration | integer | No | Overrides default 120 minutes |
| archived_at | timestamptz | No | Prevents new stints when not null |

**Validation Rules** (for stint operations):
- Project must exist
- Project must belong to user
- Project must not be archived (archived_at IS NULL)

---

### 3. User Profile (Reference Only)

**Description**: User account profile with optimistic locking.

**Database Table**: `user_profiles` (no schema changes)

**Relevant Fields for Migration**:
| Field | Type | Required | Usage |
|-------|------|----------|-------|
| id | uuid | Yes | FK to auth.users |
| version | integer | Yes | Optimistic locking for stint creation |

**Validation Rules**:
- Version checked by `validate_stint_start()` RPC
- Prevents concurrent stint creation from multiple sessions

---

## Validation Rules

### Stint Start Validation

**Client-Side (Zod Schema)**:
```typescript
startStintSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  plannedDurationMinutes: z.number()
    .int('Duration must be a whole number')
    .min(5, 'Duration must be at least 5 minutes')
    .max(480, 'Duration cannot exceed 480 minutes (8 hours)')
    .optional(),
  notes: z.string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional(),
})
```

**Server-Side (Database Layer)**:
1. Verify user is authenticated
2. Get user version for optimistic locking
3. Check project exists and belongs to user
4. Check project is not archived
5. Determine planned duration:
   - Use provided `plannedDurationMinutes` if present
   - Else use project's `custom_stint_duration` if present
   - Else use default 120 minutes
6. Validate duration is between 5-480 minutes
7. Call `validate_stint_start()` RPC:
   - Checks for existing active/paused stints
   - Validates version hasn't changed (optimistic lock)
   - Returns conflict details if validation fails

**Conflict Conditions**:
- Another active stint exists for user (status = 'active' OR status = 'paused')
- User version has changed since last read (concurrent modification)

---

### Stint Stop (Complete) Validation

**Client-Side (Zod Schema)**:
```typescript
completeStintSchema = z.object({
  stintId: z.string().uuid('Invalid stint ID'),
  notes: z.string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional(),
})
```

**Server-Side (Database Layer)**:
1. Verify user is authenticated
2. Check stint exists and belongs to user
3. Call `complete_stint()` RPC with completion_type='manual'
   - RPC validates stint is active or paused
   - RPC calculates actual duration
   - RPC sets completion_type and completed_at

**State Constraints**:
- Stint must be in 'active' or 'paused' status
- Cannot complete already completed stint

---

### Stint Pause/Resume Validation

**Client-Side (Zod Schema)**:
```typescript
stintIdSchema = z.object({
  stintId: z.string().uuid('Invalid stint ID'),
})
```

**Server-Side (Database Layer)**:

**Pause**:
1. Verify user is authenticated
2. Check stint exists and belongs to user
3. Call `pause_stint()` RPC
   - RPC validates stint status = 'active'
   - RPC sets paused_at timestamp
   - RPC updates status to 'paused'

**Resume**:
1. Verify user is authenticated
2. Check stint exists and belongs to user
3. Call `resume_stint()` RPC
   - RPC validates stint status = 'paused'
   - RPC calculates paused duration
   - RPC updates paused_duration
   - RPC clears paused_at
   - RPC updates status to 'active'

**State Constraints**:
- Pause: Stint must be 'active'
- Resume: Stint must be 'paused'

---

### Stint Sync Check Validation

**Client-Side (Zod Schema)**:
```typescript
stintIdSchema = z.object({
  stintId: z.string().uuid('Invalid stint ID'),
})
```

**Server-Side (Database Layer)**:
1. Verify user is authenticated
2. Check stint exists and belongs to user
3. Validate stint is active or paused (not completed)
4. Calculate server-side remaining time:
   - If active: `planned_duration - (now - started_at) - paused_duration`
   - If paused: `planned_duration - (paused_at - started_at) - paused_duration`
5. Return remaining seconds and drift vs client

**State Constraints**:
- Stint must be 'active' or 'paused'
- Cannot sync completed stints

---

## State Machine

### Stint Lifecycle States

```
┌─────────┐
│ (start) │
└────┬────┘
     │
     ▼
┌──────────┐    pause    ┌─────────┐
│  active  ├────────────►│ paused  │
└─────┬────┘             └────┬────┘
      │                       │
      │   resume             │
      │◄──────────────────────┘
      │
      │   complete (manual/auto)
      │
      ▼
┌───────────┐
│ completed │
└───────────┘
```

### State Transitions

| From | To | Trigger | Validation |
|------|-----|---------|------------|
| - | active | Start stint | No active/paused stints exist |
| active | paused | User pauses | Status must be active |
| paused | active | User resumes | Status must be paused |
| active | completed | User stops (manual) | Status must be active/paused |
| paused | completed | User stops (manual) | Status must be active/paused |
| active | completed | Auto-completion (cron) | started_at + planned_duration <= now |

### Invalid Transitions
- paused → paused (already paused)
- active → active (already active)
- completed → * (completed is terminal state)
- paused → completed (via auto-completion) - Only active stints auto-complete

---

## Constraints

### Business Rules

**Duration Constraints**:
```typescript
const STINT_SCHEMA_LIMITS = {
  MIN_DURATION: 5,           // 5 minutes
  MAX_DURATION: 480,         // 8 hours
  DEFAULT_DURATION: 120,     // 2 hours
  MAX_TOTAL_DURATION: 240,   // 4 hours (for future analytics)
  MAX_NOTES_LENGTH: 500,     // characters
}
```

**Concurrency Rules**:
- Only one active OR paused stint per user at a time
- Enforced by `validate_stint_start()` RPC
- Race conditions handled via optimistic locking (version field)

**Ownership Rules**:
- All stint operations require authentication
- User can only interact with their own stints
- Enforced by RLS policies + database layer validation

**Project Rules**:
- Cannot start stint for archived project
- Project's custom_stint_duration overrides default
- Project must exist and belong to user

---

## Database Constraints (Existing, No Changes)

**Table: stints**

**Check Constraints**:
```sql
-- Duration must be positive
CHECK (planned_duration > 0)

-- Paused duration cannot exceed planned duration
CHECK (paused_duration IS NULL OR paused_duration <= planned_duration)

-- Completed stints must have completed_at
CHECK (
  (status = 'completed' AND completed_at IS NOT NULL) OR
  (status != 'completed' AND completed_at IS NULL)
)

-- Paused stints must have paused_at
CHECK (
  (status = 'paused' AND paused_at IS NOT NULL) OR
  (status != 'paused' AND paused_at IS NULL)
)
```

**Unique Constraints**:
```sql
-- One active stint per user (enforced via partial index)
CREATE UNIQUE INDEX idx_one_active_stint_per_user
ON stints (user_id)
WHERE status IN ('active', 'paused');
```

**Foreign Key Constraints**:
```sql
CONSTRAINT fk_stint_user
  FOREIGN KEY (user_id)
  REFERENCES user_profiles(id)
  ON DELETE CASCADE

CONSTRAINT fk_stint_project
  FOREIGN KEY (project_id)
  REFERENCES projects(id)
  ON DELETE RESTRICT  -- Cannot delete project with stints
```

---

## RPC Functions (Existing, No Changes)

### 1. validate_stint_start

**Signature**:
```sql
validate_stint_start(
  p_user_id uuid,
  p_project_id uuid,
  p_version integer
) RETURNS TABLE (
  can_start boolean,
  existing_stint_id uuid,
  conflict_message text
)
```

**Logic**:
1. Check for existing active/paused stint
2. Validate user version matches (optimistic lock)
3. Return conflict details if validation fails

**Returns**:
- `can_start = true`: No conflicts, safe to create stint
- `can_start = false`: Conflict detected, existing_stint_id and message provided

---

### 2. pause_stint

**Signature**:
```sql
pause_stint(p_stint_id uuid) RETURNS stints
```

**Logic**:
1. Validate stint exists and status = 'active'
2. Set paused_at = now()
3. Update status = 'paused'
4. Return updated stint

**Errors**:
- "Stint not found" - Invalid ID
- "Stint is not active" - Invalid state transition

---

### 3. resume_stint

**Signature**:
```sql
resume_stint(p_stint_id uuid) RETURNS stints
```

**Logic**:
1. Validate stint exists and status = 'paused'
2. Calculate pause duration: now() - paused_at
3. Add to paused_duration
4. Clear paused_at
5. Update status = 'active'
6. Return updated stint

**Errors**:
- "Stint not found" - Invalid ID
- "Stint is not paused" - Invalid state transition

---

### 4. complete_stint

**Signature**:
```sql
complete_stint(
  p_stint_id uuid,
  p_completion_type text,  -- 'manual' | 'auto' | 'interrupted'
  p_notes text DEFAULT NULL
) RETURNS stints
```

**Logic**:
1. Validate stint exists and status IN ('active', 'paused')
2. If paused, finalize paused_duration
3. Set completed_at = now()
4. Set completion_type
5. Set notes if provided
6. Update status = 'completed'
7. Return updated stint

**Errors**:
- "Stint not found" - Invalid ID
- "Stint is not active or paused" - Invalid state transition

---

### 5. auto_complete_expired_stints (NEW)

**Signature**:
```sql
auto_complete_expired_stints() RETURNS TABLE (
  completed_count integer,
  error_count integer
)
```

**Logic**:
1. Find all active stints where `started_at + planned_duration <= now()`
2. For each expired stint:
   - Call `complete_stint(stint_id, 'auto', NULL)`
   - Log errors but continue processing
3. Return summary counts

**Scheduling**:
- Triggered by pg_cron every 2 minutes
- Scheduled job name: 'auto-complete-stints'
- Cron expression: `*/2 * * * *`

---

## Type Definitions

### Client-Side Types (TypeScript)

**From Database**:
```typescript
// Generated from Supabase schema
type StintRow = Database['public']['Tables']['stints']['Row']
type StintInsert = Database['public']['Tables']['stints']['Insert']
type StintUpdate = Database['public']['Tables']['stints']['Update']
```

**From Zod Schemas**:
```typescript
// Inferred from Zod schemas
type StartStintInput = z.infer<typeof startStintSchema>
type CompleteStintInput = z.infer<typeof completeStintSchema>
type StintIdInput = z.infer<typeof stintIdSchema>
```

**Custom Types**:
```typescript
// Conflict error type for start stint
type ConflictError = {
  code: 'CONFLICT'
  existingStint: StintRow | null
  message: string
}

// Result type with conflict handling
type StintConflictResult =
  | { error: ConflictError; data: null }
  | { error: null; data: StintRow }

// Standard result type
type Result<T> = {
  data: T | null
  error: Error | null
}
```

---

## Query Key Factory

### Stint Keys (TanStack Query)

```typescript
export const stintKeys = {
  all: ['stints'] as const,
  lists: () => [...stintKeys.all, 'list'] as const,
  list: (filters?: StintListFilters) => [...stintKeys.lists(), filters] as const,
  detail: (id: string) => [...stintKeys.all, 'detail', id] as const,
  active: () => [...stintKeys.all, 'active'] as const,
}

interface StintListFilters {
  projectId?: string
  activeOnly?: boolean
}
```

**Cache Invalidation Strategy**:
- **Create stint**: Invalidate `stintKeys.all` (updates list and active)
- **Update stint** (pause/resume/complete): Invalidate `stintKeys.detail(id)` and `stintKeys.active()`
- **Delete stint**: Invalidate `stintKeys.all`

---

## Migration Impact

### No Schema Changes
- All database tables remain unchanged
- All RPC functions remain unchanged (except new auto_complete_expired_stints)
- All RLS policies remain unchanged
- All database constraints remain unchanged

### New Additions
- Client-side Zod validation schemas
- Client-side stint operation functions (database layer)
- Client-side TanStack Query mutations/queries
- PostgreSQL auto-completion function
- pg_cron scheduled job

### Deprecations
- Edge function: stints-start → Client-side startStint()
- Edge function: stints-stop → Client-side completeStint()
- Edge function: stints-pause → Client-side pauseStint()
- Edge function: stints-resume → Client-side resumeStint()
- Edge function: stints-active → Client-side getActiveStint()
- Edge function: stint-sync-check → Client-side syncStintCheck()
- Edge function: stint-auto-complete → PostgreSQL cron job

---

## Data Flow Examples

### Example 1: Start Stint (Success)

```
User Action: Click "Start Stint" for Project A (120 min)
     │
     ▼
Component: useStartStint.mutateAsync({ projectId: 'A' })
     │
     ▼
Composable: Validate with startStintSchema
     │
     ▼
Composable: Transform to DB payload (camelCase → snake_case)
     │
     ▼
Database Layer: startStint(client, 'A', undefined)
     │
     ├─► Get user ID via requireUserId()
     ├─► Get user version from user_profiles
     ├─► Get project (check exists, not archived, get custom_stint_duration)
     ├─► Determine planned_duration: project.custom_stint_duration ?? 120
     ├─► Call validate_stint_start RPC
     │       └─► Returns: can_start=true
     └─► Insert stint record
             └─► Returns: StintRow
     │
     ▼
Composable: onSuccess → Invalidate stintKeys.all
     │
     ▼
UI: Toast "Stint started" + Update active stint display
```

---

### Example 2: Start Stint (Conflict)

```
User Action: Click "Start Stint" for Project B
     │
     ▼
[Same flow as Example 1 until validate_stint_start]
     │
     ▼
Database Layer: Call validate_stint_start RPC
     │
     └─► Returns: can_start=false, existing_stint_id='xyz', message='Active stint exists'
     │
     ▼
Database Layer: Query existing stint details
     │
     └─► Returns: StintRow for stint 'xyz'
     │
     ▼
Database Layer: Return conflict error
     │
     └─► { error: { code: 'CONFLICT', existingStint: StintRow, message: '...' }, data: null }
     │
     ▼
Component: Catch error, show conflict dialog with existing stint details
     │
     └─► UI: "You have an active stint for Project X started at 2:30 PM. Stop it first?"
```

---

### Example 3: Auto-Complete (Cron)

```
Cron Schedule: */2 * * * * (every 2 minutes)
     │
     ▼
PostgreSQL: Execute auto_complete_expired_stints()
     │
     ▼
Function: SELECT active stints WHERE started_at + planned_duration <= now()
     │
     └─► Found: [stint_1, stint_2, stint_3]
     │
     ▼
Function: FOR EACH stint in results
     │
     ├─► Call complete_stint(stint_1, 'auto', NULL)
     │       └─► Success: stint_1 completed
     │
     ├─► Call complete_stint(stint_2, 'auto', NULL)
     │       └─► Success: stint_2 completed
     │
     └─► Call complete_stint(stint_3, 'auto', NULL)
             └─► Success: stint_3 completed
     │
     ▼
Function: RETURN (completed_count=3, error_count=0)
     │
     ▼
Log: "Auto-completed 3 stints at [timestamp]"
```

---

## Summary

This data model preserves all existing database schema, constraints, and RPC functions while enabling client-side stint operations. The migration moves validation logic to Zod schemas and operation logic to the three-layer architecture (database → composable → component), eliminating the edge function layer and improving performance through optimistic updates.
