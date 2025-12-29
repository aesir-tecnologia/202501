# Research: Pause and Switch

**Feature Branch**: `006-suspend-switch`
**Date**: 2025-12-22

This document consolidates research findings for implementing the Pause and Switch feature.

---

## 1. Enum Value Decision

### Context
The `completion_type` enum currently has: `manual`, `auto`, `interrupted`. Initially considered adding `abandoned` for user-stopped paused stints.

### Decision
**Reuse `interrupted`** for both active and paused stint stops.

### Rationale
- Both actions have the same semantic meaning: user discarding incomplete work
- Both result in the same business outcome: excluded from daily counts
- The distinction provides no runtime behavior difference
- Simpler implementation with no schema changes needed

### Caveats
- Cannot distinguish "stopped mid-work" vs "stopped after pause" in analytics
- If this distinction becomes important later, would need migration

---

## 2. Partial Unique Index Modification

### Context
Current constraint enforces only ONE stint (active OR paused):
```sql
CREATE UNIQUE INDEX idx_stints_single_active_per_user
ON public.stints(user_id)
WHERE status IN ('active', 'paused');
```

The feature requires allowing ONE active AND ONE paused simultaneously.

### Decision
Drop existing index and replace with TWO separate partial indexes.

### Rationale
- PostgreSQL partial unique indexes are composable—two separate constraints allow exactly what's needed
- Each index is simpler (single condition), improving clarity and maintainability
- Performance equivalent to a complex WHERE clause
- Directly matches requirements: FR-001 (max 1 active) and FR-002 (max 1 paused)

### Migration Strategy
```sql
-- Drop the combined index
DROP INDEX IF EXISTS idx_stints_single_active_per_user;

-- Create separate index for active stints (max 1 per user)
CREATE UNIQUE INDEX idx_stints_single_active_per_user
ON public.stints(user_id)
WHERE status = 'active';

-- Create separate index for paused stints (max 1 per user)
CREATE UNIQUE INDEX idx_stints_single_paused_per_user
ON public.stints(user_id)
WHERE status = 'paused';
```

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| Single complex index with OR | Cannot enforce two separate maxima with one index |
| Non-unique indexes + trigger | Adds complexity, race conditions possible |
| Check constraint + app logic | Less robust, race conditions at database level |

---

## 3. Nuxt UI 4 Modal Pattern for Conflict Resolution

### Context
Need a conflict resolution dialog when user tries to start a new stint while another is paused. Dialog should present clear options.

### Decision
Use `UModal` with `UCard` wrapper and v-model:open pattern (matches existing codebase).

### Rationale
- Aligns with existing modal patterns (ProjectCreateModal, ProjectDeleteModal)
- UCard provides consistent header/footer structure
- Dismissible by default (ESC or click outside to cancel)
- Toast notifications handle success/errors after modal closes

### Component Structure
```vue
<script setup lang="ts">
interface Props {
  pausedStint: {
    projectName: string
    remainingSeconds: number
  }
  newProjectName: string
}

const props = defineProps<Props>()
const isOpen = defineModel<boolean>('open')
const emit = defineEmits<{
  'pause-and-switch': []
  'complete-and-start': []
  'resume-paused': []
}>()
</script>

<template>
  <UModal v-model:open="isOpen" title="Stint in Progress">
    <template #content>
      <UCard>
        <!-- Paused stint info -->
        <!-- Action buttons -->
        <!-- Cancel option -->
      </UCard>
    </template>
  </UModal>
</template>
```

### Dialog Options (per spec FR-012)
1. **Pause and switch** (Primary) - Start new stint while paused remains paused
2. **Complete paused and start new** - Complete paused stint, then start new
3. **Resume paused** - Resume the paused stint instead
4. **Cancel** - Close dialog without action

### Accessibility
- UModal provides Dialog title automatically via `title` prop
- Button labels are clear and descriptive
- Color coding: primary (pause-and-switch), warning (complete-and-start), neutral (resume/cancel)

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| useModal() composable | Programmatic approach; overkill for single dialog |
| Custom Dialog component | Reinvents the wheel; UModal handles accessibility |
| Inline confirmation | Less discoverable; dedicated modal makes options explicit |

---

## 4. Existing Codebase Patterns

### Relevant Existing Code

| File | Pattern | Relevance |
|------|---------|-----------|
| `ProjectDeleteModal.vue` | Async checking, conditional rendering, multiple actions | Template for conflict dialog |
| `useStints.ts` | TanStack Query mutations with optimistic updates | Pattern for abandon mutation |
| `stints.ts` (lib) | Database layer with Result<T> returns | Pattern for abandonStint function |

### Existing Completion Flow
The `complete_stint()` PostgreSQL function already handles:
- Calculating actual_duration with pause awareness
- Setting ended_at, completion_type, and status
- Atomic update with proper error handling

For abandoned stints, we can reuse this function with `completion_type = 'abandoned'`.

---

## 5. Auto-Stale Mechanism (Existing)

### Current Implementation
- `auto_complete_expired_stints()` function runs via pg_cron
- Completes active stints where `working_time >= planned_duration`
- Uses `'auto'` completion type

### Gap Identified
The spec mentions `auto_stale` for paused stints exceeding 24 hours, but:
- Current function only handles `status = 'active'`
- No separate mechanism for stale paused stints

### Recommendation
This feature does NOT require changes to auto-stale. Per clarifications:
> "On-demand check when user interacts with the app (consistent with existing paused stint handling via `auto_stale`)"

The existing behavior (paused stints persist indefinitely until user action) is acceptable. Auto-stale for paused stints is out of scope for this feature.

---

## 6. Double-Pause Prevention (Added During Review)

### Context
With the new constraint allowing 1 active + 1 paused, a new edge case emerges: what if the user tries to pause their new active stint while a paused stint already exists?

### Scenario
1. User starts stint on Project A, pauses it → 1 paused stint
2. User starts stint on Project B → 1 active + 1 paused
3. User tries to pause Project B stint → Would result in 2 paused stints (blocked by constraint!)

### Decision
Add explicit check in `pause_stint` function with a friendly error message before the constraint is hit.

### Error Message
"You already have a paused stint. Complete or abandon it first."

### Rationale
- Constraint would reject the operation anyway, but with a cryptic PostgreSQL error
- Friendly message guides user to resolve the conflict
- Consistent with the pattern used in `resume_stint` (checks for active stint first)

---

## Summary

| Topic | Decision | Key Insight |
|-------|----------|-------------|
| Enum change | Reuse `interrupted` | Same semantic meaning, simpler |
| Index change | Two separate partial indexes | Composable constraints |
| Modal pattern | UModal + UCard + v-model:open | Matches existing codebase |
| Auto-stale | No changes needed | Out of scope per clarifications |
| Double-pause | Add check to `pause_stint` | Friendly error before constraint |

All research items are resolved. Ready for Phase 1: Design & Contracts.
