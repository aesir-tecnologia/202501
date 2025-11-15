# Data Model: Project List Redesign

**Feature**: 002-project-list-redesign
**Date**: November 14, 2025
**Status**: Complete

---

## Overview

This document defines the data structures and view models for the Project List redesign. **Important**: This is a UI-only feature with no database schema changes. All entities are derived from existing database models or computed client-side.

---

## Entity Relationships

```
┌─────────────────┐
│   ProjectRow    │ (Existing - No Changes)
│  (Database)     │
└────────┬────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────┐
│    StintRow     │ (Existing - No Changes)
│  (Database)     │
└────────┬────────┘
         │
         │
         │ Computed
         ▼
┌─────────────────┐
│ DailyProgress   │ (NEW - Computed View Model)
│  (Client-Side)  │
└─────────────────┘

┌─────────────────┐
│ ProjectDisplay  │ (NEW - View Model)
│  (Client-Side)  │
└─────────────────┘
```

---

## 1. ProjectRow (Existing - Database Entity)

**Source**: `app/lib/supabase/projects.ts`
**Status**: No changes required

### Fields

```typescript
interface ProjectRow {
  id: string                      // UUID, primary key
  user_id: string                 // UUID, foreign key to auth.users
  name: string                    // Max 100 characters
  is_active: boolean              // Active/Inactive status
  expected_daily_stints: number   // Positive integer, default: 2
  custom_stint_duration: number | null  // Minutes (15-180), null = use default
  color_tag: string | null        // Enum: red|orange|amber|green|teal|blue|purple|pink
  archived_at: string | null      // ISO timestamp, null if not archived
  sort_order: number              // Integer for drag-and-drop ordering
  created_at: string              // ISO timestamp
  updated_at: string              // ISO timestamp
}
```

### Relationships

- **1:N with StintRow**: One project has many stints
- **Owned by User**: `user_id` references `auth.users.id`

### Validation Rules

Per `app/schemas/projects.ts`:
- `name`: 1-100 characters, trimmed
- `expected_daily_stints`: 1-10 (integer)
- `custom_stint_duration`: 15-180 minutes (5-minute increments) or null
- `color_tag`: One of 8 predefined colors or null
- `is_active`: Boolean, defaults to true

### State Transitions

```
Created (is_active=true) ──► Deactivated (is_active=false) ──► Reactivated (is_active=true)
      │                                                               │
      └─────────────────► Archived (archived_at≠null) ───────────────┘
                                     │
                                     ▼
                          Permanently Deleted (hard delete)
```

**Constraint**: Cannot start stint on inactive project (enforced in UI)

---

## 2. StintRow (Existing - Database Entity)

**Source**: `app/lib/supabase/stints.ts`
**Status**: No changes required (used for progress calculation only)

### Fields (Relevant Subset)

```typescript
interface StintRow {
  id: string                    // UUID
  user_id: string               // UUID
  project_id: string            // UUID, foreign key to projects
  started_at: string            // ISO timestamp
  paused_at: string | null      // ISO timestamp
  completed_at: string | null   // ISO timestamp
  status: 'active' | 'paused' | 'completed'
  // ... other fields omitted (not needed for progress calculation)
}
```

### Usage in Feature

**Purpose**: Calculate daily progress for each project
- Filter stints by `project_id` and date range (today)
- Count completed stints: `status === 'completed'`
- Compare to `expected_daily_stints` from ProjectRow

---

## 3. DailyProgress (NEW - Computed View Model)

**Source**: Computed client-side in `ProjectListCard.vue`
**Status**: New for this feature

### Purpose

Display "X/Y stints" progress indicator and progress bar for each project.

### Structure

```typescript
interface DailyProgress {
  projectId: string       // Project UUID
  completed: number       // Count of completed stints today
  expected: number        // From project.expected_daily_stints
  percentage: number      // (completed / expected) * 100, capped at 100
  isOverAchieving: boolean // completed > expected
  isMet: boolean          // completed >= expected
}
```

### Calculation Logic

```typescript
function computeDailyProgress(
  project: ProjectRow,
  allStints: StintRow[]
): DailyProgress {
  const today = startOfDay(new Date())
  const tomorrow = addDays(today, 1)

  const completedToday = allStints.filter(stint =>
    stint.project_id === project.id &&
    stint.status === 'completed' &&
    stint.completed_at >= today.toISOString() &&
    stint.completed_at < tomorrow.toISOString()
  ).length

  const expected = project.expected_daily_stints
  const percentage = Math.min((completedToday / expected) * 100, 100)

  return {
    projectId: project.id,
    completed: completedToday,
    expected,
    percentage,
    isOverAchieving: completedToday > expected,
    isMet: completedToday >= expected,
  }
}
```

### Visual Representation

```typescript
// Progress bar color
const progressColor = computed(() => {
  if (progress.isOverAchieving) return 'text-success-600 dark:text-success-400'
  if (progress.isMet) return 'text-success-500'
  return 'text-primary-500'
})

// Display text
const progressText = computed(() => {
  if (progress.isOverAchieving) {
    return `${progress.completed}/${progress.expected} 🔥` // Over-achievement indicator
  }
  return `${progress.completed}/${progress.expected} stints`
})
```

### Edge Cases

- **0/0 stints**: Show "0 stints/day" (no expected stints configured)
- **5/2 stints**: Show "5/2 🔥" with success color (over-achievement)
- **No stints today**: Show "0/2 stints" with neutral progress bar
- **Stint spanning midnight**: Counted based on `completed_at` timestamp (e.g., stint started 11:50 PM yesterday, completed 12:10 AM today counts toward today's progress)

---

## 4. ProjectDisplay (NEW - View Model)

**Source**: Computed in `ProjectList.vue` or `ProjectListCard.vue`
**Status**: New for this feature

### Purpose

Enrich ProjectRow with computed UI-specific properties for rendering.

### Structure

```typescript
interface ProjectDisplay extends ProjectRow {
  // Existing fields from ProjectRow
  // ... (all ProjectRow fields inherited)

  // Computed UI properties
  formattedDuration: string       // "45m", "1h 30m", "2h"
  hasActiveStint: boolean         // True if this project has active stint
  activeStint: StintRow | null    // The active stint for this project
  dailyProgress: DailyProgress    // Progress for today
  canStartStint: boolean          // False if: inactive OR another project has active stint
  colorBorderClass: string        // Tailwind class: "border-l-red-500"
}
```

### Computation

```typescript
function toProjectDisplay(
  project: ProjectRow,
  activeStint: StintRow | null,
  allStints: StintRow[],
  hasOtherActiveStint: boolean
): ProjectDisplay {
  return {
    ...project,
    formattedDuration: formatDuration(project.custom_stint_duration),
    hasActiveStint: activeStint?.project_id === project.id,
    activeStint: activeStint?.project_id === project.id ? activeStint : null,
    dailyProgress: computeDailyProgress(project, allStints),
    canStartStint: project.is_active && !hasOtherActiveStint,
    colorBorderClass: getColorBorderClass(project.color_tag),
  }
}
```

### Helper Functions

```typescript
// Duration formatting (already exists in ProjectList.vue)
function formatDuration(minutes: number | null): string {
  const duration = minutes ?? 45 // Default 45 minutes
  if (duration < 60) return `${duration}m`
  const hours = Math.floor(duration / 60)
  const mins = duration % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

// Color tag to Tailwind class (already exists)
function getColorBorderClass(colorTag: string | null): string {
  const colorMap: Record<string, string> = {
    red: 'border-l-red-500',
    orange: 'border-l-orange-500',
    amber: 'border-l-amber-500',
    green: 'border-l-green-500',
    teal: 'border-l-teal-500',
    blue: 'border-l-blue-500',
    purple: 'border-l-purple-500',
    pink: 'border-l-pink-500',
  }
  return colorMap[colorTag || ''] || ''
}
```

---

## 5. Active Stint State (Existing - Global Singleton)

**Source**: `app/composables/useStints.ts` via TanStack Query
**Status**: No changes required

### Structure

```typescript
// From useActiveStintQuery()
const activeStint: Ref<StintRow | null>
```

### Purpose

Determine which project (if any) has an active stint running. Used to:
1. Disable "Start Stint" buttons on all other projects
2. Show timer and controls on the project with active stint
3. Apply visual highlighting (success border + pulsing animation)

### State Transitions

```
No Active Stint
      │
      │ User clicks "Start Stint" on Project A
      ▼
Active Stint (Project A)
      │
      │ User clicks "Pause"
      ▼
Paused Stint (Project A)
      │
      │ User clicks "Resume"
      ▼
Active Stint (Project A)
      │
      │ User clicks "Stop"
      ▼
No Active Stint
```

---

## 6. Project List Sections (NEW - View Grouping)

### Purpose

Separate active and inactive projects for collapsed/expanded display.

### Structure

```typescript
interface ProjectSections {
  active: ProjectDisplay[]    // Projects where is_active=true, sorted by sort_order
  inactive: ProjectDisplay[]  // Projects where is_active=false
}
```

### Computation

```typescript
const sections = computed((): ProjectSections => {
  const displays = projects.value.map(p => toProjectDisplay(p, activeStint.value, allStints.value, !!activeStint.value))

  return {
    active: displays.filter(p => p.is_active).sort((a, b) => a.sort_order - b.sort_order),
    inactive: displays.filter(p => !p.is_active),
  }
})
```

### Rendering Rules

- **Active Section**: Always visible, always expanded
- **Inactive Section**: Collapsible, collapsed by default, shows count in header
- **Empty States**:
  - 0 total projects: Show empty state with CTA to create project
  - 0 active, N inactive: Encourage activating projects
  - N active, 0 inactive: Hide inactive section entirely

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    TanStack Query Cache                      │
│  ┌───────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ Projects List │  │  Active Stint  │  │   All Stints   │ │
│  │  (sorted)     │  │   (singleton)  │  │  (filtered)    │ │
│  └───────┬───────┘  └────────┬───────┘  └────────┬───────┘ │
└──────────┼──────────────────┼──────────────────┼───────────┘
           │                  │                  │
           │                  │                  │
           ▼                  ▼                  ▼
    ┌─────────────────────────────────────────────────┐
    │         ProjectDisplay[] (Computed)             │
    │  ┌─────────────────────────────────────────┐   │
    │  │  - Format duration                      │   │
    │  │  - Calculate daily progress             │   │
    │  │  - Determine active stint state         │   │
    │  │  - Compute canStartStint                │   │
    │  └─────────────────────────────────────────┘   │
    └───────────────────┬─────────────────────────────┘
                        │
                        │ Split by is_active
                        ▼
           ┌────────────────────────────┐
           │   ProjectSections          │
           │  ┌────────┐  ┌──────────┐ │
           │  │ Active │  │ Inactive │ │
           │  └────────┘  └──────────┘ │
           └────────┬───────────────────┘
                    │
                    ▼
          ┌──────────────────────┐
          │  ProjectListCard.vue │
          │   (Rendered UI)      │
          └──────────────────────┘
```

---

## Validation Rules (Inherited from Database Layer)

No new validation rules. All validation continues through existing Zod schemas:

- `app/schemas/projects.ts`: Project creation/update validation
- `app/schemas/stints.ts`: Stint creation/update validation

### UI-Level Validation

```typescript
// Disable "Start Stint" button when:
const canStartStint = computed(() => {
  return project.is_active &&  // Must be active project
         !activeStint.value    // No other stint running
})

// Show warning tooltip when disabled:
const disabledReason = computed(() => {
  if (!project.is_active) return 'Project is inactive'
  if (activeStint.value) return 'Stop current stint to start new one'
  return ''
})
```

---

## Performance Considerations

### Client-Side Computation Costs

| Operation | Complexity | Frequency | Cost |
|---|---|---|---|
| Daily progress calculation | O(S) where S = stints today | Per project, per render | Low (max 250 stints for 25 projects × 10 stints/day) |
| Section splitting | O(P) where P = projects | Per render | Negligible (max 25 projects) |
| Duration formatting | O(1) | Per project | Negligible |
| Color class lookup | O(1) | Per project | Negligible |

**Total worst case**: 25 projects × 10 stints/day = 250 array filter operations = ~0.5ms on modern hardware ✅ Meets 60fps budget

### Caching Strategy

- ProjectDisplay computed properties memoized via Vue's reactivity
- DailyProgress recalculated only when project or stint list changes
- TanStack Query handles all server-side data caching

---

## Migration Notes

### From Current Implementation

1. **Extract ProjectDisplay view model** from inline computations in ProjectList.vue
2. **Add DailyProgress computation** using existing stint queries (no new API calls)
3. **Keep all existing composables unchanged** (useProjects, useStints, useStintTimer)
4. **No database migrations required** ✅

### Backward Compatibility

- All existing props and emits remain the same
- Existing composables maintain identical APIs
- No breaking changes to parent components

---

## Summary

**Database Entities**: 0 new, 2 existing (ProjectRow, StintRow)
**View Models**: 2 new (DailyProgress, ProjectDisplay)
**Computed Properties**: All client-side, leveraging existing TanStack Query cache
**Performance Impact**: Negligible (< 1ms for 25 projects)
**Migration Complexity**: Low (pure refactoring, no data layer changes)

✅ **All requirements met without database schema changes**

---

**Document Version**: 1.0
**Last Updated**: November 14, 2025
