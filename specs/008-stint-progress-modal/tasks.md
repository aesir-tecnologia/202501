# Tasks: Stint Progress Modal

**Input**: Design documents from `/specs/008-stint-progress-modal/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Included — plan.md specifies integration tests (Layer 2) and query key tests (Layer 3) per project testing architecture.

**Organization**: This is an **atomic feature** (plan.md: "Partial delivery provides no value"). US2 (column formatting) and US3 (sort order) are physically integral to US1's modal — the UTable requires column definitions and the DB query includes sort order. All three user stories are satisfied within a single combined phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Database + Composable Infrastructure)

**Purpose**: Core DB query function and query key that block all user story implementation

- [X] T001 Add `listCompletedStintsByDate()` function in `app/lib/supabase/stints.ts`
  - Follow pattern of existing `listStints()` (lines 40-65)
  - Parameters: `client: TypedSupabaseClient`, options `{ projectId: string, dateStart: string, dateEnd: string }`
  - Query: `.from('stints').select('*').eq('user_id', userId).eq('project_id', projectId).eq('status', 'completed').gte('ended_at', dateStart).lt('ended_at', dateEnd).order('ended_at', { ascending: false })`
  - Use `requireUserId()` for auth enforcement
  - Return type: `Result<StintRow[]>`
  - The `.order('ended_at', { ascending: false })` satisfies **US3** (most recent first)

- [X] T002 [P] Add `stintKeys.completedByDate` to query key factory in `app/composables/useStints.ts`
  - Extend existing `stintKeys` object (lines 43-51) with:
    ```typescript
    completedByDate: (projectId: string, date: string) =>
      [...stintKeys.lists(), 'completedByDate', projectId, date] as const,
    ```
  - `date` parameter is a simple date string (e.g., `"2026-02-12"`) for human-readable, stable cache keys

**Checkpoint**: Infrastructure ready — composable and component work can begin

---

## Phase 2: User Story 1 — View Today's Completed Stints (Priority: P1) 🎯 MVP

**Goal**: Make the stint progress badge ("2/3") on project cards clickable. Opens a modal displaying today's completed stints with all columns formatted correctly.

**Satisfies**: US1 (clickable badge + modal), US2 (column formatting), US3 (sort order — via T001's `.order()`)

**Independent Test**: Click the progress badge on any project card → modal opens showing correct stints with all columns. Badge count matches modal row count. Durations formatted via `formatDuration()`. Notes truncated with tooltip. Empty state works.

### Implementation

- [X] T003 [US1] Add `useCompletedStintsByDateQuery()` composable in `app/composables/useStints.ts`
  - Follow pattern of `useStintsQuery()` (lines 161-172)
  - Parameters: `projectId: MaybeRef<string>`, `options?: { enabled?: MaybeRef<boolean> }`
  - Compute date boundaries client-side: `startOfDay(new Date()).toISOString()` and `addDays(startOfDay(new Date()), 1).toISOString()` (import from `date-fns`)
  - Also compute `todayDateString` as a `YYYY-MM-DD` string for the query key (manual formatting — no date-fns import needed)
  - Query key: `stintKeys.completedByDate(toValue(projectId), todayDateString)`
  - Call `listCompletedStintsByDate()` from database layer
  - Config: `staleTime: 30_000` (30s), `gcTime: 5 * 60_000` (5min)
  - `enabled` tied to options parameter (defaults to `true`)

- [X] T004 [US1] Create `StintProgressModal.vue` component in `app/components/StintProgressModal.vue`
  - Follow modal pattern from `ProjectEditModal.vue` (UModal with `v-model:open` + `defineModel<boolean>('open')`)
  - **Props**: `projectId: string`, `projectName: string`
  - **Data**: Call `useCompletedStintsByDateQuery(projectId, { enabled: isOpen })` — only fetch when modal is visible
  - **Title**: Include project name (e.g., `"${projectName} — Today's Stints"`) per FR-009
  - **States**: Loading skeleton/spinner, empty state ("No stints completed today" per FR-008), **error state (user-friendly message + `toast.add({ title: 'Failed to load stints', color: 'error' })` when query errors — FR constitution V)**, data table
  - **UTable columns** (as `TableColumn<StintRow>[]` with `h()` render functions per research.md D4 order):
    | Column | `accessorKey` | Cell Renderer |
    |--------|--------------|---------------|
    | Started | `started_at` | `formatTimestamp(val)` from `~/utils/time-format` |
    | Ended | `ended_at` | `formatTimestamp(val)` from `~/utils/time-format` |
    | Actual | `actual_duration` | `formatDuration(val ?? 0)` — stored in seconds |
    | Planned | `planned_duration` | `formatDuration((val ?? 0) * 60)` — **stored in minutes, multiply by 60** (research.md D3) |
    | Paused | `paused_duration` | `formatDuration(val ?? 0)` — stored in seconds |
    | Type | `completion_type` | Capitalize first letter, "—" if null (FR-010) |
    | Notes | `notes` | Truncate at 50 chars + ellipsis, wrap in `UTooltip` if truncated (FR-014), "—" if null |
    | Date | `attributed_date` | `new Date(val + 'T12:00:00').toLocaleDateString(...)`, "—" if null |
    | Status | `status` | Capitalize first letter |
  - Import `formatDuration` and `formatTimestamp` from `~/utils/time-format`
  - Add a `watch` on the query's `error` ref: `logger.error('Failed to fetch completed stints', { projectId, error })` (constitution VIII)
  - Horizontal scroll wrapper (`overflow-x-auto`) for mobile (edge case: narrow viewports)
  - Vertical scroll for many stints (FR-012)
  - Footer with close button
  - Check Nuxt UI 4 docs via Context7 for UModal and UTable API before implementing
  - **Design system**: Verify color tokens, typography, and dark mode variants against `docs/DESIGN_SYSTEM.md`

- [X] T005 [US1] Make progress badge clickable and wire modal in `app/components/ProjectListCard.vue`
  - Add `showStintsModal` ref: `const showStintsModal = ref(false)`
  - Modify progress badge `<span>` (around lines 216-224):
    - Change to `<button type="button">` with `@click="showStintsModal = true"`
    - Add styles following the `.edit-btn` pattern (CSS class with `rgba()` hover backgrounds and dark mode variant) — not Tailwind utility classes
    - Add `aria-label="View completed stints"` for accessibility
  - Add `StintProgressModal` component to template:
    ```vue
    <StintProgressModal
      v-model:open="showStintsModal"
      :project-id="project.id"
      :project-name="project.name"
    />
    ```
  - Follow pattern of edit button (lines 226-238) for click handler + modal trigger
  - **Design system**: Verify hover/focus styles against `docs/DESIGN_SYSTEM.md` and provide dark mode variants

**Checkpoint**: Feature fully functional — clicking badge opens modal with formatted stints. All 3 user stories satisfied.

---

## Phase 3: Tests

**Purpose**: Automated verification per project testing architecture (Layer 2 + Layer 3)

- [X] T006 [P] Add integration tests for `listCompletedStintsByDate()` in `app/lib/supabase/stints.test.ts`
  - Follow existing test patterns in the same file
  - Test cases:
    1. Returns only completed stints for given project and date range
    2. Excludes stints with `status !== 'completed'` (active, paused, interrupted)
    3. Excludes stints outside the date range (`ended_at` before dateStart or after dateEnd)
    4. Returns empty array when no matching stints exist
    5. Requires authentication (unauthenticated client returns error)
    6. Results are ordered by `ended_at` descending (most recent first)
  - Use local Supabase instance
  - Run with: `npx vitest run app/lib/supabase/stints.test.ts`

- [X] T007 [P] Add query key unit tests for `stintKeys.completedByDate()` in `app/composables/useStints.test.ts`
  - Follow existing `stintKeys` test patterns in the same file
  - Test cases:
    1. Returns correct key structure `['stints', 'list', 'completedByDate', projectId, date]`
    2. Different `projectId` values produce different keys
    3. Different `date` values produce different keys
  - Run with: `npx vitest run app/composables/useStints.test.ts`

**Checkpoint**: All automated tests pass — `npx vitest run app/lib/supabase/stints.test.ts app/composables/useStints.test.ts`

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and manual verification

- [X] T008 Run quickstart.md validation against all acceptance scenarios
  - Verify: Badge click → modal opens with correct project stints
  - Verify: Badge count matches modal row count (SC-003)
  - Verify: All duration columns formatted via `formatDuration()` (SC-002)
  - Verify: `planned_duration` displays correctly (minutes → seconds conversion)
  - Verify: Empty state shows when no completed stints today
  - Verify: Notes truncation + tooltip for long text
  - Verify: Null fields show "—" dash
  - Verify: Modal dismissible via outside click, Escape, close button
  - Verify: Horizontal scroll on 375px viewport — table scrolls, close button accessible without scrolling (SC-004)
  - Verify: Modal opens and displays data within 500ms on cold load (DevTools Network tab)
  - Verify: Lint passes (`npm run lint`)
  - Verify: Type-check passes (`npm run type-check`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — can start immediately. T001 and T002 are parallel (different files).
- **User Story (Phase 2)**: Depends on Phase 1 completion. Tasks are sequential: T003 → T004 → T005.
- **Tests (Phase 3)**: T006 depends on T001 (tests the DB function). T007 depends on T002 (tests the query key). Both can run in parallel.
- **Polish (Phase 4)**: Depends on all previous phases.

### Critical Path

```
T001 ──→ T003 ──→ T004 ──→ T005 ──→ T008
T002 ─┘                              ↑
T006 ────────────────────────────────┘
T007 ────────────────────────────────┘
```

Longest chain: T001 → T003 → T004 → T005 → T008 (5 steps)

### User Story Mapping

| Story | Priority | Satisfied By | Notes |
|-------|----------|-------------|-------|
| US1: View Completed Stints | P1 | T001–T005 | Core feature |
| US2: Review Stint Details | P2 | T004 | Column formatting integral to modal UTable definition |
| US3: Sorted by Recency | P3 | T001 | `.order('ended_at', { ascending: false })` in DB query |

### Parallel Opportunities

```bash
# Phase 1 — run in parallel (different files):
T001: listCompletedStintsByDate() in app/lib/supabase/stints.ts
T002: stintKeys.completedByDate in app/composables/useStints.ts

# Phase 3 — run in parallel (different test files):
T006: Integration tests in app/lib/supabase/stints.test.ts
T007: Query key tests in app/composables/useStints.test.ts
```

---

## Implementation Strategy

### MVP = Complete Feature (Atomic)

This feature has no meaningful partial delivery. The clickable badge + modal with formatted columns is a single user-facing unit.

1. Complete Phase 1: Foundational (T001 + T002 in parallel)
2. Complete Phase 2: US1 implementation (T003 → T004 → T005)
3. Complete Phase 3: Tests (T006 + T007 in parallel)
4. Complete Phase 4: Polish + validation (T008)

### Single Developer Flow

```
T001 + T002 (parallel) → T003 → T004 → T005 → T006 + T007 (parallel) → T008
```

Estimated task count: 8 tasks across 4 phases.

---

## Notes

- [P] tasks = different files, no dependencies
- [US1] label maps tasks to User Story 1 (all stories delivered in single phase due to atomic nature)
- `planned_duration` is stored in **minutes** — must multiply by 60 before passing to `formatDuration(seconds)` (research.md D3)
- Date boundaries computed client-side via `startOfDay(new Date())` to match badge's timezone logic (research.md D2)
- Check Nuxt UI 4 UModal + UTable API via Context7 before implementing T004 (research.md R3)
- Commit after each task or logical group
