# Data Model: Pause and Switch

**Feature Branch**: `006-suspend-switch`
**Date**: 2025-12-22

This document defines the data model changes required for the Pause and Switch feature.

---

## Entity Changes

### 1. Stint (Modified)

The `stints` table requires no column changes. Only enum and constraint modifications are needed.

#### Current Schema (Unchanged)
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| user_id | UUID | No | - | Foreign key to user_profiles |
| project_id | UUID | No | - | Foreign key to projects |
| status | stint_status | No | 'active' | Current stint state |
| planned_duration | INTEGER | Yes | - | Duration in minutes (5-480) |
| actual_duration | INTEGER | Yes | - | Calculated seconds on completion |
| paused_duration | INTEGER | No | 0 | Cumulative pause seconds |
| paused_at | TIMESTAMPTZ | Yes | - | When stint was paused |
| started_at | TIMESTAMPTZ | Yes | NOW() | When stint started |
| ended_at | TIMESTAMPTZ | Yes | - | When stint completed |
| completion_type | completion_type | Yes | - | How stint was completed |
| notes | TEXT | Yes | - | Optional notes (max 500 chars) |
| created_at | TIMESTAMPTZ | Yes | NOW() | Record creation time |
| updated_at | TIMESTAMPTZ | Yes | NOW() | Last update time |

---

## Enum Changes

### completion_type (No Changes)

**Current values**: `'manual'`, `'auto'`, `'interrupted'`

No new values needed. Stopping a paused stint reuses `'interrupted'` — both active and paused stints being manually stopped represent the same semantic action: user discarding incomplete work.

#### Value Semantics
| Value | Trigger | Daily Totals | Description |
|-------|---------|--------------|-------------|
| `manual` | User clicks "Complete" | Included | Normal completion by user |
| `auto` | Timer reaches planned duration | Included | Automatic completion |
| `interrupted` | User clicks "Stop" on active OR paused stint | Excluded | User discards incomplete work |

---

## Constraint Changes

### Unique Constraint Modification

**Current**: Single partial index enforcing max 1 active OR paused stint per user
```sql
CREATE UNIQUE INDEX idx_stints_single_active_per_user
ON public.stints(user_id)
WHERE status IN ('active', 'paused');
```

**New**: Two separate partial indexes allowing 1 active AND 1 paused simultaneously

```sql
-- Enforces: max 1 active stint per user (FR-001)
CREATE UNIQUE INDEX idx_stints_single_active_per_user
ON public.stints(user_id)
WHERE status = 'active';

-- Enforces: max 1 paused stint per user (FR-002)
CREATE UNIQUE INDEX idx_stints_single_paused_per_user
ON public.stints(user_id)
WHERE status = 'paused';
```

#### Constraint Behavior Matrix
| Scenario | Before | After |
|----------|--------|-------|
| 1 active + 0 paused | ✅ Allowed | ✅ Allowed |
| 0 active + 1 paused | ✅ Allowed | ✅ Allowed |
| 1 active + 1 paused | ❌ Blocked | ✅ Allowed |
| 2 active + 0 paused | ❌ Blocked | ❌ Blocked |
| 0 active + 2 paused | ❌ Blocked | ❌ Blocked |

---

## State Transitions

### stint_status State Machine

```
                    ┌──────────────────────────────────────┐
                    │                                      │
                    ▼                                      │
┌─────────┐     ┌────────┐     ┌───────────┐              │
│ (start) │────▶│ active │────▶│ completed │              │
└─────────┘     └────────┘     └───────────┘              │
                    │  ▲                                   │
              pause │  │ resume                            │
                    ▼  │                                   │
                ┌────────┐     ┌─────────────┐            │
                │ paused │────▶│ interrupted │            │
                └────────┘     └─────────────┘            │
                    │               (abandoned)            │
                    │                                      │
                    └──────────────────────────────────────┘
                         start new stint on different project
```

### Valid Transitions
| From | To | Trigger | completion_type |
|------|----|---------|-----------------|
| (new) | active | Start stint | - |
| active | paused | Pause stint | - |
| active | completed | Timer completes | auto |
| active | completed | User completes | manual |
| active | interrupted | User stops | interrupted |
| paused | active | Resume stint | - |
| paused | completed | User completes | manual |
| paused | interrupted | User stops | interrupted |

**New Transition (FR-003)**: While in `paused` state, user can start a new stint on a different project, resulting in:
- Paused stint: remains `paused`
- New stint: enters `active` state

---

## Validation Rules

### Schema Layer (Zod)

No schema changes required. The existing `stintInterruptSchema` and `stintCompletionSchema` already support stopping stints with `completion_type = 'interrupted'`.

### Business Rules

| Rule | Validation Point | Error Message |
|------|------------------|---------------|
| Cannot resume with active stint | Database layer | "Cannot resume while another stint is active" |
| Cannot start if already have active | Database layer | "An active stint already exists" |
| Cannot pause if already paused | Database layer | "Stint is not active" (existing) |
| Cannot pause if another stint is paused | Database layer | "You already have a paused stint. Complete or abandon it first." (NEW) |

---

## Database Functions

### complete_stint (No Changes)

The existing `complete_stint` function already supports stopping paused stints with `completion_type = 'interrupted'`. No new function needed.

### pause_stint (Modified)

Update to check for existing paused stints before allowing pause. This provides a friendly error message before the database constraint would reject the operation.

```sql
-- Current: only checks if stint is active
-- New: also checks if another paused stint exists

-- Error (NEW): 'You already have a paused stint. Complete or abandon it first.'
```

### validate_stint_start (Modified)

Update to check for active stints only (not paused) when determining conflicts.

```sql
-- Current: blocks if ANY active/paused stint exists
-- New: only blocks if ACTIVE stint exists; returns paused stint info for UI

CREATE OR REPLACE FUNCTION validate_stint_start(
  p_user_id UUID,
  p_project_id UUID,
  p_version INTEGER
)
RETURNS TABLE(
  can_start BOOLEAN,
  existing_stint_id UUID,
  existing_stint_status TEXT,
  conflict_message TEXT
) AS $$
-- ... (see contracts for full implementation)
```

### resume_stint (Modified)

Update to check for existing active stints before allowing resume. This ensures users cannot have two active stints simultaneously.

```sql
-- Current: only checks if stint is paused
-- New: also checks if another active stint exists

-- Error (NEW): 'Cannot resume while another stint is active'
```

---

## Migration Summary

### File: `YYYYMMDDHHMMSS_pause_and_switch.sql`

1. Drop combined unique index
2. Create separate active index
3. Create separate paused index
4. Update `pause_stint` function (add paused stint check)
5. Update `resume_stint` function (add active stint check)
6. Update `validate_stint_start` function (return paused stint info)

### Rollback Strategy

```sql
-- Revert index changes
DROP INDEX IF EXISTS idx_stints_single_paused_per_user;
DROP INDEX IF EXISTS idx_stints_single_active_per_user;
CREATE UNIQUE INDEX idx_stints_single_active_per_user
ON public.stints(user_id)
WHERE status IN ('active', 'paused');

-- Revert function changes would require restoring previous versions
```

---

## Type Generation

After applying migration, regenerate TypeScript types:

```bash
npm run supabase:types
```

No type changes expected — only constraint and function modifications.
