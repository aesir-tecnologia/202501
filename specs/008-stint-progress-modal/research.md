# Research: Stint Progress Modal

## Architectural Fit

### Existing Patterns to Follow

| Pattern | Location | How It Applies |
|---------|----------|---------------|
| UModal with `v-model:open` + `defineModel<boolean>('open')` | `ProjectEditModal.vue` | Modal open/close pattern |
| UModal slots: `#body`, `#footer` | `ProjectEditModal.vue`, `StintCompletionModal.vue` | Content structure |
| UTable with `TableColumn<T>[]` + `h()` render functions | Nuxt UI 4 docs (TanStack Table) | Stint table columns |
| UTooltip wrapping elements | `ProjectListCard.vue:226` | Notes truncation tooltip |
| `formatDuration(seconds)` | `app/utils/time-format.ts` | Duration columns |
| `formatTimestamp(isoString)` | `app/utils/time-format.ts` | Started/Ended columns |
| `listStints()` with filter options | `app/lib/supabase/stints.ts:40-65` | Pattern for new query function |
| `stintKeys` factory | `app/composables/useStints.ts:43-51` | New query key |
| `useStintsQuery()` with TanStack Query | `app/composables/useStints.ts:161-172` | Pattern for new query hook |
| `computeAllDailyProgress()` filtering logic | `app/components/ProjectList.vue:100-139` | Date boundary + status filter |

### New Patterns Needed

None. Every aspect of this feature maps to existing patterns in the codebase.

## Decision Log

### D1: Query Strategy — Server-Side Filtering

**Decision**: Create a new `listCompletedStintsByDate()` DB function with server-side date + status filters.

**Rationale**: FR-013 mandates a dedicated query. Server-side filtering is more efficient than fetching all stints and filtering client-side, especially as stint history grows.

**Alternatives considered**:
- Client-side filtering of `useStintsQuery()` data — rejected because FR-013 explicitly requires a dedicated query, and coupling to dashboard cache would create fragile dependencies.
- Using existing `listStints()` with extended options — viable but adding date filters to a general-purpose function adds complexity for one use case. A dedicated function is cleaner.

### D2: Date Boundary Calculation — Client-Side Timezone

**Decision**: Compute `startOfDay(new Date())` and `addDays(today, 1)` client-side, pass as ISO strings to the Supabase query.

**Rationale**: Matches the existing `computeAllDailyProgress()` logic exactly. The badge and modal will always show the same stints because they use identical boundary calculations.

**Alternatives considered**:
- Server-side date boundaries via PostgreSQL `date_trunc()` — rejected because it would use the server's timezone, not the user's browser timezone, causing mismatches with the badge count.

### D3: planned_duration Unit Conversion

**Decision**: Convert `planned_duration` from minutes to seconds (`* 60`) before passing to `formatDuration()`.

**Rationale**: `planned_duration` is stored in minutes (DB schema), while `actual_duration` and `paused_duration` are in seconds. `formatDuration()` expects seconds. Failing to convert would show "0s" for a 25-minute stint.

### D4: Column Order

**Decision**: Started → Ended → Actual → Planned → Paused → Type → Notes → Date → Status

**Rationale**: Most actionable information first (times, durations), metadata last. Status will always be "completed" for now so it's least useful. The user said "You're free to sort columns as you wish."

### D5: Modal Owns Its Data

**Decision**: The `StintProgressModal` component internally calls `useCompletedStintsByDateQuery()` with `enabled` tied to modal open state. Parent passes only `projectId` and `projectName`.

**Rationale**: FR-013 ("fetch via its own dedicated query") + Assumption ("modal owns its data"). Clean separation — parent doesn't need to manage stint data for the modal.

## Dependencies

### Technical Dependencies
- `date-fns`: `startOfDay`, `addDays` — already used in `ProjectList.vue`
- `@nuxt/ui`: `UModal`, `UTable`, `UTooltip` — already in project
- `formatDuration()` from `~/utils/time-format` — already exists
- `formatTimestamp()` from `~/utils/time-format` — already exists
- `parseSafeDate()` from `~/utils/date-helpers` — already exists

### Task Dependencies
```
[DB query function] → [Composable hook] → [Modal component] → [Badge click handler]
                                                             ↘ [Tests]
```

## Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| R1 | Unit mismatch: `planned_duration` (minutes) vs `actual_duration` (seconds) causes wrong display | Medium | Medium | Explicit `* 60` conversion in column cell renderer, documented in code |
| R2 | Date boundary mismatch between badge and modal query | Low | High | Both use identical `startOfDay(new Date())` + `addDays(today, 1)` logic |
| R3 | UTable API differs from expected (Nuxt UI 4 breaking changes) | Low | Medium | Verified against Context7 docs — `TableColumn<T>[]` with `accessorKey` + `cell` confirmed |
| R4 | Modal blocks interaction with active timer behind it | Low | Low | UModal defaults: `dismissible: true`, overlay, escape key — standard behavior |

No CRITICAL risks identified.
