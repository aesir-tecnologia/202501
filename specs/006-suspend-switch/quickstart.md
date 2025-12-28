# Quickstart: Pause and Switch

**Feature Branch**: `006-suspend-switch`
**Date**: 2025-12-22

This guide provides step-by-step instructions for implementing the Pause and Switch feature.

---

## Prerequisites

- Local Supabase running (`supabase start`)
- Node.js 18+ with npm
- Feature branch checked out: `git checkout 006-suspend-switch`

---

## Implementation Order

The implementation follows the three-layer data access pattern:

```
1. Database Layer (migration)
       ↓
2. Schema Layer (Zod)
       ↓
3. Composable Layer (TanStack Query)
       ↓
4. UI Components
```

---

## Step 1: Database Migration

Create the migration file:

```bash
# Generate timestamp
TIMESTAMP=$(date +%Y%m%d%H%M%S)
touch supabase/migrations/${TIMESTAMP}_pause_and_switch.sql
```

Migration contents (see `contracts/database-functions.sql` for full implementations):

```sql
-- 1. Replace unique constraint (allows 1 active + 1 paused)
DROP INDEX IF EXISTS idx_stints_single_active_per_user;

CREATE UNIQUE INDEX idx_stints_single_active_per_user
ON public.stints(user_id)
WHERE status = 'active';

CREATE UNIQUE INDEX idx_stints_single_paused_per_user
ON public.stints(user_id)
WHERE status = 'paused';

-- 2. Update resume_stint function (add active stint check)
CREATE OR REPLACE FUNCTION resume_stint(...);

-- 3. Update validate_stint_start function (return paused stint info)
CREATE OR REPLACE FUNCTION validate_stint_start(...);
```

Apply and regenerate types:

```bash
supabase db reset
npm run supabase:types
```

---

## Step 2: Schema Layer

No changes required. The existing `stintInterruptSchema` handles stopping stints with `completion_type = 'interrupted'`.

---

## Step 3: Database Layer Functions

Update `app/lib/supabase/stints.ts`:

```typescript
/**
 * Get the currently active stint (status = 'active' only)
 * Note: Changed from returning active OR paused to active only,
 * since we now allow 1 active + 1 paused simultaneously.
 */
export async function getActiveStint(
  client: TypedSupabaseClient,
): Promise<Result<StintRow | null>> {
  const userResult = await requireUserId(client);
  if (userResult.error) return { data: null, error: userResult.error };

  const { data, error } = await client
    .from('stints')
    .select('*')
    .eq('user_id', userResult.data!)
    .eq('status', 'active')  // Changed from .in('status', ['active', 'paused'])
    .maybeSingle<StintRow>();

  if (error) {
    return { data: null, error: new Error(error.message || 'Failed to get active stint') };
  }

  return { data: data || null, error: null };
}

/**
 * Get the currently paused stint (NEW)
 */
export async function getPausedStint(
  client: TypedSupabaseClient,
): Promise<Result<StintRow | null>> {
  const userResult = await requireUserId(client);
  if (userResult.error) return { data: null, error: userResult.error };

  const { data, error } = await client
    .from('stints')
    .select('*')
    .eq('user_id', userResult.data!)
    .eq('status', 'paused')
    .maybeSingle<StintRow>();

  if (error) {
    return { data: null, error: new Error(error.message || 'Failed to get paused stint') };
  }

  return { data: data || null, error: null };
}
```

---

## Step 4: Composable Layer

Update `app/composables/useStints.ts`:

```typescript
// Add new query key for paused stints
export const stintKeys = {
  all: ['stints'] as const,
  lists: () => [...stintKeys.all, 'list'] as const,
  list: (filters?: StintListFilters) => [...stintKeys.lists(), filters] as const,
  details: () => [...stintKeys.all, 'detail'] as const,
  detail: (id: string) => [...stintKeys.details(), id] as const,
  active: () => [...stintKeys.all, 'active'] as const,
  paused: () => [...stintKeys.all, 'paused'] as const,  // NEW
};

/**
 * Fetches the currently paused stint (NEW)
 */
export function usePausedStintQuery() {
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient;

  return useQuery({
    queryKey: stintKeys.paused(),
    queryFn: async () => {
      const { data, error } = await getPausedStint(client);
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
```

To stop a paused stint, use the existing `useInterruptStint()` hook — no new mutation needed.

---

## Step 5: UI Components

### 5a. Conflict Resolution Dialog

Create `app/components/StintConflictDialog.vue`:

```vue
<script setup lang="ts">
import type { ConflictResolutionAction } from '~/contracts/stint-operations';

interface Props {
  existingStint: {
    id: string
    status: 'active' | 'paused'
    projectName: string
    remainingSeconds: number
  }
  newProjectName: string
  isPending?: boolean
}

const props = defineProps<Props>();
const isOpen = defineModel<boolean>('open', { required: true });

const emit = defineEmits<{
  resolve: [action: ConflictResolutionAction]
}>();

function handleAction(action: ConflictResolutionAction) {
  emit('resolve', action);
  isOpen.value = false;
}

const formattedTime = computed(() => {
  const mins = Math.floor(props.existingStint.remainingSeconds / 60);
  const secs = props.existingStint.remainingSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
});

// Contextual UI based on existing stint status
const isExistingActive = computed(() => props.existingStint.status === 'active');

const statusLabel = computed(() =>
  isExistingActive.value ? 'running' : 'paused',
);

const statusColor = computed(() =>
  isExistingActive.value ? 'bg-green-50 dark:bg-green-950/50' : 'bg-amber-50 dark:bg-amber-950/50',
);

const statusTextColor = computed(() =>
  isExistingActive.value ? 'text-green-800 dark:text-green-200' : 'text-amber-800 dark:text-amber-200',
);
</script>

<template>
  <UModal v-model:open="isOpen" title="Stint in Progress">
    <template #content>
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">
            {{ isExistingActive ? 'Switch Projects?' : 'Start New Stint?' }}
          </h3>
        </template>

        <div class="space-y-4">
          <!-- Existing stint info -->
          <div :class="['rounded-lg p-4', statusColor]">
            <p :class="['text-sm', statusTextColor]">
              <strong>{{ existingStint.projectName }}</strong> is {{ statusLabel }}
              with {{ formattedTime }} remaining.
            </p>
          </div>

          <p class="text-sm text-gray-600 dark:text-gray-400">
            You're about to start a stint on <strong>{{ newProjectName }}</strong>.
          </p>

          <!-- Actions for ACTIVE existing stint -->
          <div v-if="isExistingActive" class="space-y-2">
            <UButton
              block
              color="primary"
              :loading="isPending"
              @click="handleAction('pause-and-switch')"
            >
              Pause & Switch
            </UButton>

            <UButton
              block
              variant="outline"
              @click="handleAction('complete-active-and-start')"
            >
              Complete Current & Start New
            </UButton>
          </div>

          <!-- Actions for PAUSED existing stint -->
          <div v-else class="space-y-2">
            <UButton
              block
              color="primary"
              :loading="isPending"
              @click="handleAction('start-alongside')"
            >
              Start New Stint
            </UButton>

            <UButton
              block
              variant="outline"
              @click="handleAction('complete-paused-and-start')"
            >
              Complete Paused & Start New
            </UButton>

            <UButton
              block
              variant="ghost"
              @click="handleAction('resume-paused')"
            >
              Resume Paused Instead
            </UButton>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton variant="ghost" @click="handleAction('cancel')">
              Cancel
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
```

### 5b. Abandon Confirmation Dialog (FR-013)

Create `app/components/StintAbandonDialog.vue`:

```vue
<script setup lang="ts">
interface Props {
  stintId: string
  projectName: string
  remainingSeconds: number
  isPending?: boolean
}

const props = defineProps<Props>();
const isOpen = defineModel<boolean>('open', { required: true });

const emit = defineEmits<{
  confirm: []
  cancel: []
}>();

function handleConfirm() {
  emit('confirm');
}

function handleCancel() {
  emit('cancel');
  isOpen.value = false;
}

const formattedTime = computed(() => {
  const mins = Math.floor(props.remainingSeconds / 60);
  const secs = props.remainingSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
});
</script>

<template>
  <UModal v-model:open="isOpen" title="Abandon Stint?">
    <template #content>
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-red-600 dark:text-red-400">
            Abandon Paused Stint?
          </h3>
        </template>

        <div class="space-y-4">
          <div class="rounded-lg bg-red-50 dark:bg-red-950/50 p-4">
            <p class="text-sm text-red-800 dark:text-red-200">
              <strong>{{ projectName }}</strong> has {{ formattedTime }} remaining.
            </p>
          </div>

          <div class="rounded-lg bg-amber-50 dark:bg-amber-950/50 p-4">
            <p class="text-sm text-amber-800 dark:text-amber-200">
              <strong>Warning:</strong> Abandoned stints do not count toward your daily progress.
              The time you've already worked will be lost.
            </p>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="handleCancel">
              Keep Paused
            </UButton>
            <UButton
              color="error"
              :loading="isPending"
              @click="handleConfirm"
            >
              Abandon Stint
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
```

---

## Step 6: Integration

Update `app/pages/dashboard.vue` to use both dialogs:

```typescript
import type { ConflictResolutionAction } from '~/contracts/stint-operations';

// Dialog state
const conflictDialogOpen = ref(false);
const abandonDialogOpen = ref(false);
const conflictStint = ref<ExistingStint | null>(null);
const pendingProjectId = ref<string | null>(null);
const stintToAbandon = ref<PausedStint | null>(null);

// Query for paused stint (always loaded)
const { data: pausedStint } = usePausedStintQuery();

// Helper to get project name by ID
async function getProjectName(projectId: string): Promise<string> {
  const { data: projects } = useProjectsQuery();
  return projects.value?.find(p => p.id === projectId)?.name || 'Unknown Project';
}

/**
 * Start stint with conflict detection
 *
 * Flow:
 * 1. Check for active stint → BLOCKED, show dialog with pause/complete options
 * 2. Check for paused stint → ALLOWED, show dialog with alongside/complete/resume options
 * 3. No conflicts → Start directly
 */
async function handleStartStint(projectId: string, projectName: string) {
  // First check for active stint
  const { data: activeStint } = useActiveStintQuery();

  if (activeStint.value) {
    // BLOCKED: Active stint exists
    const activeProjectName = await getProjectName(activeStint.value.project_id);
    conflictStint.value = {
      id: activeStint.value.id,
      status: 'active',
      projectId: activeStint.value.project_id,
      projectName: activeProjectName,
      remainingSeconds: calculateRemainingSeconds(activeStint.value),
    };
    pendingProjectId.value = projectId;
    conflictDialogOpen.value = true;
    return;
  }

  // Check for paused stint
  if (pausedStint.value) {
    // ALLOWED but show dialog for user awareness
    const pausedProjectName = await getProjectName(pausedStint.value.project_id);
    conflictStint.value = {
      id: pausedStint.value.id,
      status: 'paused',
      projectId: pausedStint.value.project_id,
      projectName: pausedProjectName,
      remainingSeconds: calculateRemainingSeconds(pausedStint.value),
    };
    pendingProjectId.value = projectId;
    conflictDialogOpen.value = true;
    return;
  }

  // No conflicts, start directly
  try {
    await startStint({ projectId });
    toast.add({ title: 'Stint started', color: 'success' });
  } catch (error) {
    toast.add({
      title: 'Failed to start stint',
      description: error instanceof Error ? error.message : 'Unknown error',
      color: 'error',
    });
  }
}

/**
 * Handle conflict resolution dialog actions
 */
async function handleConflictResolution(action: ConflictResolutionAction) {
  if (!conflictStint.value || !pendingProjectId.value) return;

  try {
    switch (action) {
      // Active stint actions
      case 'pause-and-switch':
        await pauseStint(conflictStint.value.id);
        await startStint({ projectId: pendingProjectId.value });
        toast.add({ title: 'Switched projects', color: 'success' });
        break;

      case 'complete-active-and-start':
        await completeStint({ stintId: conflictStint.value.id, completionType: 'manual' });
        await startStint({ projectId: pendingProjectId.value });
        toast.add({ title: 'Completed and started new stint', color: 'success' });
        break;

      // Paused stint actions
      case 'start-alongside':
        await startStint({ projectId: pendingProjectId.value });
        toast.add({ title: 'New stint started', color: 'success' });
        break;

      case 'complete-paused-and-start':
        await completeStint({ stintId: conflictStint.value.id, completionType: 'manual' });
        await startStint({ projectId: pendingProjectId.value });
        toast.add({ title: 'Completed paused and started new stint', color: 'success' });
        break;

      case 'resume-paused':
        await resumeStint(conflictStint.value.id);
        toast.add({ title: 'Resumed paused stint', color: 'success' });
        break;

      case 'cancel':
        break;
    }
  } catch (error) {
    toast.add({
      title: 'Action failed',
      description: error instanceof Error ? error.message : 'Unknown error',
      color: 'error',
    });
  } finally {
    pendingProjectId.value = null;
    conflictStint.value = null;
  }
}

/**
 * Stop paused stint with confirmation (FR-013)
 */
function handleStopPausedStint(stint: PausedStint) {
  stintToAbandon.value = stint;
  abandonDialogOpen.value = true;
}

async function handleAbandonConfirm() {
  if (!stintToAbandon.value) return;

  try {
    await interruptStint({ stintId: stintToAbandon.value.id });
    toast.add({
      title: 'Stint abandoned',
      description: 'This stint will not count toward your daily progress.',
      color: 'warning',
    });
    abandonDialogOpen.value = false;
  } catch (error) {
    toast.add({
      title: 'Failed to abandon stint',
      description: error instanceof Error ? error.message : 'Unknown error',
      color: 'error',
    });
  } finally {
    stintToAbandon.value = null;
  }
}
```

### Template Integration

```vue
<template>
  <!-- ... existing dashboard content ... -->

  <!-- Conflict Resolution Dialog -->
  <StintConflictDialog
    v-if="conflictStint"
    v-model:open="conflictDialogOpen"
    :existing-stint="conflictStint"
    :new-project-name="getProjectName(pendingProjectId!)"
    :is-pending="isStarting"
    @resolve="handleConflictResolution"
  />

  <!-- Abandon Confirmation Dialog -->
  <StintAbandonDialog
    v-if="stintToAbandon"
    v-model:open="abandonDialogOpen"
    :stint-id="stintToAbandon.id"
    :project-name="getProjectName(stintToAbandon.project_id)"
    :remaining-seconds="calculateRemainingSeconds(stintToAbandon)"
    :is-pending="isInterrupting"
    @confirm="handleAbandonConfirm"
    @cancel="stintToAbandon = null"
  />
</template>
```

---

## Testing

### Unit Tests

Update `app/lib/supabase/stints.test.ts`:

```typescript
describe('getActiveStint', () => {
  it('should return only active stint, not paused', async () => {
    // Create active stint, pause it, verify getActiveStint returns null
  });

  it('should return active stint when both active and paused exist', async () => {
    // 1. Create stint A, pause it
    // 2. Create stint B (active)
    // 3. Verify getActiveStint returns stint B
  });
});

describe('getPausedStint', () => {
  it('should return paused stint', async () => {
    // Create stint, pause it, verify getPausedStint returns it
  });

  it('should return null when no paused stint exists', async () => {
    // Verify getPausedStint returns null when only active stint exists
  });

  it('should return paused stint when both active and paused exist', async () => {
    // 1. Create stint A, pause it
    // 2. Create stint B (active)
    // 3. Verify getPausedStint returns stint A
  });
});
```

### Integration Tests

```typescript
describe('Pause and Switch Flow', () => {
  it('allows starting new stint while paused stint exists', async () => {
    // 1. Start stint on Project A
    // 2. Pause stint
    // 3. Start stint on Project B
    // 4. Verify: Project A paused, Project B active
  });

  it('prevents resuming while active stint exists', async () => {
    // 1. Start stint on Project A, pause it
    // 2. Start stint on Project B
    // 3. Try to resume Project A stint
    // 4. Verify: Error "Cannot resume while another stint is active"
  });

  it('allows stopping paused stint with interrupted type', async () => {
    // 1. Start stint, pause it
    // 2. Stop the paused stint using useInterruptStint
    // 3. Verify: status = 'interrupted', completion_type = 'interrupted'
  });

  it('prevents pausing when a paused stint already exists', async () => {
    // 1. Start stint on Project A, pause it
    // 2. Start stint on Project B
    // 3. Try to pause Project B stint
    // 4. Verify: Error "You already have a paused stint. Complete or abandon it first."
  });

  it('allows resuming after stopping active stint', async () => {
    // 1. Start stint on Project A, pause it
    // 2. Start stint on Project B
    // 3. Stop Project B stint (interrupted)
    // 4. Resume Project A stint
    // 5. Verify: Project A is now active
  });
});
```

### Edge Case Tests

```typescript
describe('Edge Cases', () => {
  it('handles paused stint crossing midnight correctly', async () => {
    // 1. Create paused stint with started_at = yesterday
    // 2. Start new stint today
    // 3. Resume paused stint
    // 4. Complete it
    // 5. Verify: Stint is attributed to original start date
  });

  it('handles starting stint on same project as paused stint', async () => {
    // 1. Start stint on Project A, pause it
    // 2. Try to start another stint on Project A
    // 3. Verify: Conflict dialog shows with resume option prominent
  });

  it('handles rapid pause-start-pause sequences', async () => {
    // Test optimistic update rollback under rapid operations
    // 1. Start stint A
    // 2. Pause stint A
    // 3. Immediately start stint B
    // 4. Verify: No race conditions, correct final state
  });

  it('displays correct remaining time for paused stint in conflict dialog', async () => {
    // 1. Start stint with 30min duration
    // 2. Wait 10min (or mock time)
    // 3. Pause stint
    // 4. Trigger conflict dialog
    // 5. Verify: Shows ~20min remaining, not 30min
  });

  it('prevents multiple paused stints via constraint', async () => {
    // 1. Manually insert two paused stints (bypass app logic)
    // 2. Verify: Database constraint rejects second insert
  });
});
```

### Constraint Tests (Database Level)

```typescript
describe('Database Constraints', () => {
  it('allows 1 active + 1 paused simultaneously', async () => {
    // Direct insert via Supabase client
    // Verify both inserts succeed
  });

  it('blocks 2 active stints', async () => {
    // Direct insert via Supabase client
    // Verify second insert fails with 23505
  });

  it('blocks 2 paused stints', async () => {
    // Direct insert via Supabase client
    // Verify second insert fails with 23505
  });
});
```

---

## Verification Checklist

### Build & Lint
- [ ] Migration applies cleanly: `supabase db reset`
- [ ] Types regenerate: `npm run supabase:types`
- [ ] Lint passes: `npm run lint`
- [ ] Tests pass: `npm run test:run`
- [ ] Build succeeds: `npm run generate`

### Manual Testing - Core Flow
- [ ] Can pause stint and start new one on different project
- [ ] Can resume paused stint after stopping active stint
- [ ] Can resume paused stint after completing active stint
- [ ] Cannot resume paused stint while active stint is running

### Manual Testing - Conflict Dialog
- [ ] Dialog shows "Pause & Switch" for ACTIVE stint
- [ ] Dialog shows "Start New Stint" for PAUSED stint
- [ ] All dialog actions work correctly
- [ ] Cancel closes dialog without action

### Manual Testing - Abandon Flow (FR-013)
- [ ] Abandon confirmation dialog shows warning
- [ ] Abandoned stint marked as interrupted
- [ ] Abandoned stint excluded from daily totals
- [ ] Keep Paused button cancels abandon

### Manual Testing - Edge Cases
- [ ] Cannot pause when another stint is already paused
- [ ] Error message is user-friendly for double-pause attempt
- [ ] Paused stint displays correct remaining time in dialog
- [ ] Dashboard shows both active AND paused stint when both exist
