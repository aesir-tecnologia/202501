# Implementation Plan: Streak Counter Completion

**Branch**: `004-streak-counter` | **Date**: 2025-12-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-streak-counter/spec.md`

## Summary

Complete the Streak Counter feature by adding a dashboard header banner displaying current/longest streaks with real-time updates after stint completion, 1-day grace period logic, and "at-risk" visual indicator. Implementation follows the three-layer data access architecture with TanStack Query for cache management.

## Technical Context

**Language/Version**: TypeScript 5.9.3 / Vue 3.5.24 / Nuxt 4.2.1 (SSG)
**Primary Dependencies**: @tanstack/vue-query 5.90.6, @supabase/supabase-js 2.57.4, Zod, Nuxt UI 4
**Storage**: PostgreSQL via Supabase with RLS (existing `user_streaks` table)
**Testing**: Vitest 3.2.4 with co-located tests (`.test.ts` alongside source)
**Target Platform**: Static site (Vercel), client-side auth
**Project Type**: Web application (Nuxt 4 SSG)
**Performance Goals**: <2s dashboard load (SC-001), <1s streak update after completion (SC-002)
**Constraints**: Server-authoritative time, browser-detected timezone, offline not required
**Scale/Scope**: Single user streak tracking, user_streaks 1:1 with user_profiles

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Three-Layer Data Access | ✅ Pass | Will implement: `lib/supabase/streaks.ts`, `schemas/streaks.ts`, `composables/useStreaks.ts` |
| II. Test-Driven Development | ✅ Pass | Co-located tests for database layer and composable |
| III. SSG + Client-Side Auth | ✅ Pass | Dashboard is already `ssr: false`, no server-side changes needed |
| IV. Type Safety | ✅ Pass | Types will be regenerated from Supabase schema |
| V. User-Friendly Error Handling | ✅ Pass | Toast notifications on failure, graceful degradation |
| VI. Optimistic Updates | ⚠️ N/A | Streak is server-calculated, no optimistic updates needed |
| VII. Query Key Factory | ✅ Pass | Will add `streakKeys` factory pattern |

## Project Structure

### Documentation (this feature)

```text
specs/004-streak-counter/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file
├── research.md          # Phase 0 output (below)
├── data-model.md        # Phase 1 output (below)
├── quickstart.md        # Phase 1 output (below)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
app/
├── components/
│   └── StreakBanner.vue          # NEW: Dashboard streak display
├── composables/
│   ├── useStreaks.ts             # NEW: TanStack Query hooks
│   ├── useStints.ts              # MODIFY: Add streak cache invalidation
│   └── useStintTimer.ts          # MODIFY: Add streak cache invalidation
├── lib/supabase/
│   ├── streaks.ts                # NEW: Database layer functions
│   └── streaks.test.ts           # NEW: Co-located tests
├── pages/
│   └── dashboard.vue             # MODIFY: Add StreakBanner component
├── schemas/
│   └── streaks.ts                # NEW: Zod validation schemas
├── constants/
│   └── index.ts                  # MODIFY: Add STREAK constants
└── types/
    └── database.types.ts         # REGENERATE: After migration

supabase/migrations/
└── YYYYMMDD_enhance_streak_functions.sql  # NEW: Enhanced streak calculation
```

**Structure Decision**: Follows existing Nuxt 4 SSG structure with three-layer data access pattern. All new code integrates with existing composable patterns.

## Complexity Tracking

> No constitution violations requiring justification.

---

## Phase 0: Research

### Decision 1: Streak Calculation Location

**Decision**: Server-side (database function) with client timezone parameter

**Rationale**:
- Server is authoritative, prevents manipulation
- Database has efficient access to all completed stints
- Existing `calculate_streak()` function provides foundation
- Client passes timezone string for day boundary calculation

**Alternatives Considered**:
- Client-side calculation (like analytics page): Rejected - duplicates logic, larger data transfer
- Hybrid approach: Rejected - unnecessary complexity

### Decision 2: Update Trigger Mechanism

**Decision**: Application layer cache invalidation after stint completion

**Rationale**:
- Follows existing pattern in `useCompleteStint` and `useStintTimer`
- More testable than database triggers
- Application has easy access to timezone
- Enables real-time UI updates via TanStack Query

**Alternatives Considered**:
- Database triggers: Rejected - complex timezone handling without user context
- Polling: Rejected - unnecessary overhead, not real-time

### Decision 3: Grace Period Implementation

**Decision**: Calculate dynamically from `last_stint_date` in database function

**Rationale**:
- Simple calculation: `today - last_stint_date <= 1` means "at risk"
- No additional column needed
- Keeps database schema simple
- `is_at_risk` returned from function, not stored

**Alternatives Considered**:
- Store `is_at_risk` column: Rejected - synchronization complexity
- Client-side calculation only: Rejected - duplicates logic

### Decision 4: Timezone Handling

**Decision**: Browser detection via `Intl.DateTimeFormat().resolvedOptions().timeZone`

**Rationale**:
- Accurate timezone detection without user configuration
- `user_profiles` lacks timezone column (noted as future enhancement)
- Passed as parameter to database function
- Falls back to UTC if detection fails

**Alternatives Considered**:
- Add timezone to user_profiles: Deferred - requires UI for user to configure
- Always use UTC: Rejected - breaks streak accuracy across timezones

---

## Phase 1: Design

### Data Model

**Entity: User Streak** (existing table: `user_streaks`)

| Field | Type | Description |
|-------|------|-------------|
| user_id | UUID (PK) | References user_profiles.id |
| current_streak | INTEGER | Consecutive days with completed stints |
| longest_streak | INTEGER | All-time maximum streak |
| last_stint_date | DATE | Date of most recent completed stint |
| streak_updated_at | TIMESTAMPTZ | Last update timestamp |

**Computed Fields** (returned from function, not stored):

| Field | Type | Calculation |
|-------|------|-------------|
| is_at_risk | BOOLEAN | `today - last_stint_date = 1 AND current_streak > 0` |

### API Contracts

**Function: `calculate_streak_with_tz(user_id, timezone)`**

```sql
-- Input
p_user_id: UUID
p_timezone: TEXT (default 'UTC')

-- Output (TABLE)
current_streak: INTEGER
longest_streak: INTEGER
last_stint_date: DATE
is_at_risk: BOOLEAN
```

**Function: `update_user_streak(user_id, timezone)`**

```sql
-- Input
p_user_id: UUID
p_timezone: TEXT (default 'UTC')

-- Output (TABLE)
current_streak: INTEGER
longest_streak: INTEGER
last_stint_date: DATE
```

### Composable API

```typescript
// Query key factory
export const streakKeys = {
  all: ['streaks'] as const,
  current: () => [...streakKeys.all, 'current'] as const,
};

// Query hook
export function useStreakQuery(): UseQueryReturnType<StreakData | null, Error>;

// Types
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastStintDate: string | null;
  isAtRisk: boolean;
}
```

### Component API

```vue
<!-- StreakBanner.vue -->
<template>
  <!-- Hidden when currentStreak === 0 (FR-008) -->
  <div v-if="showStreak">
    <UCard class="bg-gradient-to-br from-brand-500 to-mint-500">
      <!-- 🔥 Current streak count -->
      <!-- "At risk" warning when isAtRisk (FR-006) -->
      <!-- Longest streak display (FR-005) -->
    </UCard>
  </div>
</template>
```

---

## Quickstart

### Prerequisites

1. Local Supabase running: `supabase start`
2. Dependencies installed: `npm install`

### Implementation Steps

#### Step 1: Database Migration

```bash
# Create migration file
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_enhance_streak_functions.sql

# Edit migration with enhanced functions (see contracts above)

# Apply migration
supabase db reset

# Regenerate types
npm run supabase:types
```

#### Step 2: Database Layer

Create `app/lib/supabase/streaks.ts`:
- `getStreak(client, timezone)` - calls `calculate_streak_with_tz` RPC
- `updateStreakAfterCompletion(client, timezone)` - calls `update_user_streak` RPC

#### Step 3: Schema Layer

Create `app/schemas/streaks.ts`:
- `streakDataSchema` - Zod schema for StreakData
- Export `StreakData` type

#### Step 4: Composable Layer

Create `app/composables/useStreaks.ts`:
- `streakKeys` - Query key factory
- `useStreakQuery()` - Fetches current streak data
- `getBrowserTimezone()` - Helper for timezone detection

#### Step 5: Integration

Modify `app/composables/useStints.ts`:
```typescript
// In useCompleteStint onSuccess callback, add:
queryClient.invalidateQueries({ queryKey: streakKeys.all });
```

Modify `app/composables/useStintTimer.ts`:
```typescript
// In handleTimerComplete function, add:
await globalTimerState.queryClient.invalidateQueries({ queryKey: streakKeys.all });
```

#### Step 6: UI Component

Create `app/components/StreakBanner.vue`:
- Use `useStreakQuery()` for data
- Conditional rendering based on `currentStreak > 0`
- Gradient styling with at-risk indicator

#### Step 7: Dashboard Integration

Modify `app/pages/dashboard.vue`:
```vue
<UPageHeader ... />

<!-- Add after UPageHeader -->
<StreakBanner class="mb-6" />

<div v-if="isLoading" ... >
```

### Verification

```bash
# Run tests
npm run test:run

# Start dev server
npm run dev

# Manual test:
# 1. Complete a stint
# 2. Verify streak banner appears
# 3. Complete another stint
# 4. Verify streak updates without refresh
```

---

## Cache Invalidation Flow

```
┌─────────────────────┐
│  Stint Completed    │
│  (manual or auto)   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ useCompleteStint    │
│ onSuccess callback  │
└─────────┬───────────┘
          │
          ├───────────────────────────┐
          │                           │
          ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐
│ invalidateQueries   │     │ invalidateQueries   │
│ (stintKeys.all)     │     │ (streakKeys.all)    │
└─────────────────────┘     └─────────┬───────────┘
                                      │
                                      ▼
                            ┌─────────────────────┐
                            │ useStreakQuery      │
                            │ refetches           │
                            └─────────┬───────────┘
                                      │
                                      ▼
                            ┌─────────────────────┐
                            │ StreakBanner        │
                            │ updates (real-time) │
                            └─────────────────────┘
```

---

## Files Summary

### New Files (7)

| File | Purpose |
|------|---------|
| `supabase/migrations/*_enhance_streak_functions.sql` | Enhanced streak calculation with timezone & grace period |
| `app/lib/supabase/streaks.ts` | Database layer - getStreak, updateStreak |
| `app/lib/supabase/streaks.test.ts` | Co-located tests for database layer |
| `app/schemas/streaks.ts` | Zod schema for streak data validation |
| `app/composables/useStreaks.ts` | TanStack Query hooks - useStreakQuery, streakKeys |
| `app/components/StreakBanner.vue` | Dashboard banner component |
| `specs/004-streak-counter/research.md` | This research documentation |

### Modified Files (5)

| File | Changes |
|------|---------|
| `app/composables/useStints.ts` | Add `streakKeys` invalidation in `onSuccess` (~line 420) |
| `app/composables/useStintTimer.ts` | Add `streakKeys` invalidation in `handleTimerComplete` |
| `app/pages/dashboard.vue` | Add `<StreakBanner />` after `<UPageHeader>` (line 68) |
| `app/constants/index.ts` | Add `STREAK.GRACE_PERIOD_DAYS = 1` |
| `app/types/database.types.ts` | Regenerate after migration |
