# Data Model: Stint Progress Modal

## Existing Entities (No Changes)

### Stint (read-only usage)

**Source**: `stints` table — `app/types/database.types.ts:152-224`

| Field | DB Type | Display Column | Format | Notes |
|-------|---------|---------------|--------|-------|
| `started_at` | `timestamptz` | Started | `"Feb 12, 2:30 PM"` | `formatTimestamp()` from `time-format.ts` |
| `ended_at` | `timestamptz` | Ended | `"Feb 12, 2:30 PM"` | `formatTimestamp()` from `time-format.ts` |
| `planned_duration` | `integer` | Planned Duration | `"25m"` | **Stored in minutes** — multiply by 60 for `formatDuration()` |
| `actual_duration` | `integer` | Actual Duration | `"25m"` | Stored in seconds — pass directly to `formatDuration()` |
| `paused_duration` | `integer` | Paused Duration | `"5m"` | Stored in seconds — pass directly to `formatDuration()` |
| `status` | `enum` | Status | `"completed"` | Values: `active`, `paused`, `completed`, `interrupted` |
| `completion_type` | `enum` | Completion Type | `"manual"` | Values: `manual`, `auto`, `interrupted`. Nullable. |
| `attributed_date` | `date` | Attributed Date | `"Feb 12, 2026"` | Nullable — show "—" if null |
| `notes` | `text` | Notes | Truncated 50 chars | Nullable — show "—" if null. Tooltip for full text. |

### DailyProgress (existing interface)

**Source**: `app/types/progress.ts:5-12`

```typescript
interface DailyProgress {
  projectId: string
  completed: number      // Used to display badge "X/Y"
  expected: number       // From project.expected_daily_stints
  percentage: number
  isOverAchieving: boolean
  isMet: boolean
}
```

No changes needed — modal receives `projectId` and `projectName` directly, not the progress object.

## New Query Interface

### `listCompletedStintsByDate()`

**Location**: `app/lib/supabase/stints.ts`

```typescript
interface CompletedStintsByDateOptions {
  projectId: string
  dateStart: string   // ISO string — startOfDay(today).toISOString()
  dateEnd: string     // ISO string — startOfDay(tomorrow).toISOString()
}

// Supabase query:
//   .from('stints')
//   .select('*')
//   .eq('user_id', userId)
//   .eq('project_id', projectId)
//   .eq('status', 'completed')
//   .gte('ended_at', dateStart)
//   .lt('ended_at', dateEnd)
//   .order('ended_at', { ascending: false })
```

### Query Key Extension

**Location**: `app/composables/useStints.ts` — `stintKeys` factory

```typescript
export const stintKeys = {
  // ... existing keys ...
  completedByDate: (projectId: string, date: string) =>
    [...stintKeys.lists(), 'completedByDate', projectId, date] as const,
}
```

The `date` parameter is a simple date string (e.g., `"2026-02-12"`) to make the cache key human-readable and stable.

## State Transitions

N/A — This feature is read-only. No entity mutations.

## Validation Rules

N/A — No user input or mutations. No new Zod schema required.
