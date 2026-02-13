# Quickstart: Stint Progress Modal

## Prerequisites

- Local Supabase running (`supabase start`)
- No database migrations needed (read-only feature using existing `stints` table)

## Implementation Steps

### Step 1: Add Database Query Function

**File**: `app/lib/supabase/stints.ts`

**Action**: Add `listCompletedStintsByDate()` function after the existing `listStints()` function.

**What it does**:
- Accepts `projectId`, `dateStart` (ISO string), `dateEnd` (ISO string)
- Queries `stints` table filtered by: `user_id`, `project_id`, `status = 'completed'`, `ended_at >= dateStart`, `ended_at < dateEnd`
- Orders by `ended_at` descending (most recent first)
- Returns `Result<StintRow[]>`

**Follows pattern of**: `listStints()` at lines 40-65

**Verification**: Unit test in Step 5

---

### Step 2: Add Query Key and Composable Hook

**File**: `app/composables/useStints.ts`

**Action A**: Extend `stintKeys` factory with new key:
```typescript
completedByDate: (projectId: string, date: string) =>
  [...stintKeys.lists(), 'completedByDate', projectId, date] as const,
```

**Action B**: Add `useCompletedStintsByDateQuery()` composable:
- Accepts `projectId: MaybeRef<string>`, `options?: { enabled?: MaybeRef<boolean> }`
- Internally computes `dateStart` = `startOfDay(new Date()).toISOString()` and `dateEnd` = `addDays(startOfDay(new Date()), 1).toISOString()`
- Calls `listCompletedStintsByDate()` from the database layer
- Uses `stintKeys.completedByDate(projectId, todayDateString)` as query key
- `enabled` defaults to `true`, pass `false` to defer fetching until modal opens
- `staleTime: 30_000` (30s) — stints don't change frequently
- `gcTime: 5 * 60_000` (5min) — keep cached for reopens

**Follows pattern of**: `useStintsQuery()` at lines 161-172

**Verification**: Query key test in Step 5

---

### Step 3: Create Modal Component

**File**: `app/components/StintProgressModal.vue` (new file)

**Props**:
```typescript
{
  projectId: string
  projectName: string
}
```

**Model**: `defineModel<boolean>('open')` — controls visibility via `v-model:open`

**Template structure**:
```
UModal(v-model:open, :title, :ui)
  #body
    - Loading state: skeleton/spinner while query loads
    - Empty state: "No stints completed today" when data is empty
    - UTable(:data, :columns) when data is available
      - Wrapped in scrollable container for horizontal scroll on mobile
  #footer
    - Close button
```

**Columns** (defined as `TableColumn<StintRow>[]` with `h()` render functions):

| Column | `accessorKey` | Cell Renderer |
|--------|--------------|---------------|
| Started | `started_at` | `new Date(val).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })` |
| Ended | `ended_at` | Same format as Started |
| Actual | `actual_duration` | `formatDuration(val ?? 0)` |
| Planned | `planned_duration` | `formatDuration(val * 60)` — **minutes → seconds** |
| Paused | `paused_duration` | `formatDuration(val ?? 0)` |
| Type | `completion_type` | Capitalize first letter, "—" if null |
| Notes | `notes` | Truncate at 50 chars + ellipsis, wrap in `UTooltip` if truncated, "—" if null |
| Date | `attributed_date` | `new Date(val + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })`, "—" if null |
| Status | `status` | Capitalize first letter |

**Key behaviors**:
- Query uses `enabled: isOpen` — only fetches when modal is visible
- Modal is dismissible via outside click, Escape, or close button (UModal defaults)
- Content scrolls vertically when stints exceed visible area (`scrollable` prop or body overflow)
- Table scrolls horizontally on narrow viewports (`overflow-x-auto` wrapper)

**Follows pattern of**: `ProjectEditModal.vue` for modal structure, Nuxt UI 4 docs for UTable

**Verification**: Manual testing — open modal on project with completed stints

---

### Step 4: Make Progress Badge Clickable

**File**: `app/components/ProjectListCard.vue`

**Action A**: Add `StintProgressModal` import and state:
```typescript
const showStintsModal = ref(false)
```

**Action B**: Modify the progress badge `<span>` (lines 216-224):
- Change `<span class="progress-badge">` → `<button type="button" class="progress-badge" @click="showStintsModal = true">`
- Add hover styles following the `.edit-btn` CSS pattern (rgba hover backgrounds with dark mode variant)
- Add `aria-label` for accessibility: `"View completed stints"`

**Action C**: Add `StintProgressModal` to the template (after the badge):
```vue
<StintProgressModal
  v-model:open="showStintsModal"
  :project-id="project.id"
  :project-name="project.name"
/>
```

**Note**: The `project` prop (`ProjectRow`) already contains `id` and `name`.

**Follows pattern of**: Edit button at lines 226-238 (click handler + modal trigger)

**Verification**: Click badge → modal opens with correct stints

---

### Step 5: Write Tests

**File A**: `app/lib/supabase/stints.test.ts`

Add test cases for `listCompletedStintsByDate()`:
- Returns only completed stints for the given project and date range
- Excludes stints with `status !== 'completed'`
- Excludes stints outside the date range
- Returns empty array when no matching stints exist
- Requires authentication (unauthenticated client returns error)

**Follows pattern of**: Existing tests in the same file

**File B**: `app/composables/useStints.test.ts`

Add test cases for `stintKeys.completedByDate()`:
- Returns correct key structure `['stints', 'list', 'completedByDate', projectId, date]`
- Different projectId/date produce different keys

**Follows pattern of**: Existing `stintKeys` tests in the same file

**Verification**: `npx vitest run app/lib/supabase/stints.test.ts app/composables/useStints.test.ts`

---

## File Change Summary

| File | Action | Layer |
|------|--------|-------|
| `app/lib/supabase/stints.ts` | Add function | Database |
| `app/composables/useStints.ts` | Add key + hook | Composable |
| `app/components/StintProgressModal.vue` | New file | Component |
| `app/components/ProjectListCard.vue` | Modify badge + add modal | Component |
| `app/lib/supabase/stints.test.ts` | Add test cases | Test |
| `app/composables/useStints.test.ts` | Add test cases | Test |

**Total**: 1 new file, 5 modified files, 0 migrations
