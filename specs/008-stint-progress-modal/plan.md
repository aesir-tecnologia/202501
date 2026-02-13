# Implementation Plan: Stint Progress Modal

**Branch**: `008-stint-progress-modal` | **Date**: 2026-02-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-stint-progress-modal/spec.md`

## Summary

Make the stint progress badge ("2/3") on project cards clickable. Opens a modal displaying a table of today's completed stints for that project with columns: Started, Ended, Planned/Actual/Paused Duration, Completion Type, Notes, Attributed Date, and Status. Durations formatted via existing `formatDuration()` helper. The modal owns its data via a dedicated TanStack Query hook that fires on open.

## Technical Context

**Language/Version**: TypeScript 5 / Vue 3 / Nuxt 4
**Primary Dependencies**: Nuxt UI 4 (UModal, UTable, UTooltip), TanStack Query (Vue Query), date-fns
**Storage**: Supabase PostgreSQL (existing `stints` table — read-only access, no migrations)
**Testing**: Vitest with local Supabase (integration) + unit tests
**Target Platform**: Web (SSG + client-side auth)
**Project Type**: Web application (Nuxt)
**Performance Goals**: Modal opens and displays data within 500ms (single query, small result set)
**Constraints**: Must match badge's stint count exactly (same date boundary logic)
**Scale/Scope**: Typically 1-10 stints per project per day

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Three-Layer Data Access | ✅ PASS | DB query → Composable hook → Component. No new schema needed (read-only, no user input). |
| II. Three-Layer Testing | ✅ PASS | Layer 2: Integration test for new DB query. Layer 3: Query key factory test. No schema test (no new schema). |
| III. SSG + Client-Side Auth | ✅ PASS | Feature is client-side only. Dashboard already uses `ssr: false`. |
| IV. Type Safety | ✅ PASS | Uses existing `StintRow` type and `TypedSupabaseClient`. |
| V. Error Handling | ✅ PASS | TanStack Query handles error states. Loading/empty/error states in modal. Toast on query failure. |
| VI. Cache Update Strategies | ✅ N/A | Read-only feature — no mutations. |
| VII. Query Key Factory | ✅ PASS | New `completedByDate` key added to existing `stintKeys` factory. |
| VIII. Observability & Logging | ✅ PASS | Query failures logged via logger.error() for Sentry observability. |

**Post-design re-check**: All gates still pass. No violations introduced during design.

## Project Structure

### Documentation (this feature)

```text
specs/008-stint-progress-modal/
├── plan.md              # This file
├── research.md          # Phase 0: Architecture fit + decisions
├── data-model.md        # Phase 1: Entity fields + query interface
├── quickstart.md        # Phase 1: Step-by-step implementation guide
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
app/
├── lib/supabase/
│   ├── stints.ts              # MODIFY: Add listCompletedStintsByDate()
│   └── stints.test.ts         # MODIFY: Add integration tests
├── composables/
│   ├── useStints.ts           # MODIFY: Add query key + useCompletedStintsByDateQuery()
│   └── useStints.test.ts      # MODIFY: Add query key tests
├── components/
│   ├── StintProgressModal.vue # NEW: Modal with UTable
│   └── ProjectListCard.vue    # MODIFY: Make badge clickable, add modal
└── utils/
    └── daily-summaries.ts     # READ-ONLY: formatDuration() helper
```

**Structure Decision**: Existing Nuxt web application structure. All changes fit within the established three-layer architecture. No new directories needed.

## Complexity Tracking

No constitution violations — section not applicable.

## Critical Path

**Longest Chain**: 4 steps (linear dependency)

| Step | Description | Blocks |
|------|-------------|--------|
| 1 | Add `listCompletedStintsByDate()` DB function | Step 2, Step 5a |
| 2 | Add `stintKeys.completedByDate` + `useCompletedStintsByDateQuery()` | Step 3 |
| 3 | Create `StintProgressModal.vue` component | Step 4 |
| 4 | Make progress badge clickable in `ProjectListCard.vue` | — |

**Bottleneck Steps** (blocks 3+ downstream steps):
- Step 1 blocks all subsequent steps (3 downstream). This is the foundation — should be implemented first.

## Testing Approach

| Component | Verification Method | Success Criteria |
|-----------|-------------------|------------------|
| `listCompletedStintsByDate()` | Integration test (local Supabase) | Returns only completed stints for given project + date range; excludes other statuses; requires auth |
| `stintKeys.completedByDate()` | Unit test | Produces `['stints', 'list', 'completedByDate', projectId, date]` key structure |
| `StintProgressModal.vue` | Manual testing | Modal shows correct stints, durations formatted correctly, notes truncated with tooltip, empty state works |
| Progress badge click | Manual testing | Badge is clickable, cursor changes, modal opens with correct project's stints, badge count matches modal row count |
| Duration unit conversion | Manual testing | `planned_duration` (minutes) displays correctly via `formatDuration(val * 60)` |
| Mobile horizontal scroll | Manual testing | Table scrolls horizontally on narrow viewports without hiding columns |

## Delivery Strategy

**MVP Boundary**: N/A — atomic feature. The clickable badge + modal is a single user-facing unit. Partial delivery (e.g., clickable badge without modal) provides no value.

**Implementation order follows critical path**: DB → Composable → Modal → Badge modification → Tests.
