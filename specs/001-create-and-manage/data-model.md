# Data Model: Dashboard Project Management

**Feature**: Dashboard Project Management
**Branch**: 001-create-and-manage
**Date**: 2025-10-04

## Entity: Project

### Overview
Represents a client project or work area for tracking focused work sessions (stints). Projects define expected daily goals and custom stint durations.

### Database Schema

**Table**: `projects`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigint` | PRIMARY KEY, AUTO INCREMENT | Unique project identifier |
| `user_id` | `uuid` | NOT NULL, FK → auth.users | Owner of the project |
| `name` | `text` | NOT NULL | Project name (unique per user, case-insensitive) |
| `expected_daily_stints` | `integer` | NOT NULL, CHECK (> 0), DEFAULT 3 | Daily stint goal |
| `custom_stint_duration` | `integer` | NOT NULL, CHECK (> 0), DEFAULT 45 | Stint duration in minutes |
| `sort_order` | `integer` | NOT NULL | User-defined display order (0-indexed) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:
- `projects_pkey` PRIMARY KEY (`id`)
- `projects_user_id_idx` BTREE (`user_id`)
- `projects_user_id_sort_order_idx` BTREE (`user_id`, `sort_order`) — For ordered list queries
- `projects_name_user_id_lower_idx` UNIQUE BTREE (`user_id`, `LOWER(name)`) — Enforce case-insensitive uniqueness

**Foreign Keys**:
- `user_id` → `auth.users(id)` ON DELETE CASCADE

**RLS Policies**:
- `projects_select_own`: `SELECT` WHERE `user_id = auth.uid()`
- `projects_insert_own`: `INSERT` WITH CHECK (`user_id = auth.uid()`)
- `projects_update_own`: `UPDATE` USING (`user_id = auth.uid()`)
- `projects_delete_own`: `DELETE` USING (`user_id = auth.uid()`)

---

## Entity: Stint (Referenced)

### Overview
Represents a focused work session for a project. Referenced for active stint deletion protection.

**Table**: `stints`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigint` | PRIMARY KEY | Unique stint identifier |
| `user_id` | `uuid` | NOT NULL, FK → auth.users | Owner |
| `project_id` | `bigint` | NOT NULL, FK → projects | Associated project |
| `start_time` | `timestamptz` | NOT NULL | Stint start time |
| `end_time` | `timestamptz` | NULL | Stint end time (NULL = active) |
| ... | ... | ... | (other columns omitted) |

**Foreign Keys**:
- `project_id` → `projects(id)` ON DELETE CASCADE — When project deleted, stints deleted

**Business Rule**: Project cannot be deleted if any stint has `end_time IS NULL` (active stint)

---

## Relationships

```
auth.users (1) ──< (many) projects
                      │
                      │ ON DELETE CASCADE
                      ▼
                   (many) stints
```

---

## Validation Rules

### Project Name
- **Required**: Yes
- **Type**: String
- **Min Length**: 1 character
- **Max Length**: 255 characters (suggested)
- **Uniqueness**: Case-insensitive within user's projects
- **Validation**: Zod schema + database constraint

### Expected Daily Stints
- **Required**: Yes
- **Type**: Positive integer
- **Min**: 1
- **Max**: 100 (suggested)
- **Default**: 3
- **Validation**: Zod schema + database CHECK constraint

### Custom Stint Duration
- **Required**: Yes
- **Type**: Positive integer (minutes)
- **Min**: 1
- **Max**: 1440 (24 hours, suggested)
- **Default**: 45
- **Validation**: Zod schema + database CHECK constraint

### Sort Order
- **Required**: Yes
- **Type**: Integer
- **Min**: 0
- **Default**: `(SELECT COALESCE(MAX(sort_order), -1) + 1 FROM projects WHERE user_id = auth.uid())`
- **Validation**: Database-level, managed by composable during reorder

---

## State Transitions

### Project Lifecycle

```
           CREATE
              │
              ▼
         ┌─────────┐
    ┌────│ ACTIVE  │────┐
    │    └─────────┘    │
    │         │         │
    │     UPDATE        │
    │         │         │
    │         ▼         │
    │    ┌─────────┐   │
    │    │ ACTIVE  │   │
    │    └─────────┘   │
    │                  │
  REORDER           DELETE
    │              (if no active stint)
    ▼                  │
┌─────────┐            ▼
│ ACTIVE  │       ┌─────────┐
└─────────┘       │ DELETED │
                  └─────────┘
                       │
                  CASCADE DELETE
                       │
                       ▼
               (stints deleted)
```

**Note**: No "soft delete" or "archived" state. Deletion is permanent and cascades to all associated stints.

---

## Database Migrations

### Required Migration: Add `sort_order` Column

**File**: `supabase/migrations/[timestamp]_add_project_sort_order.sql`

```sql
-- Add sort_order column
ALTER TABLE projects ADD COLUMN sort_order INTEGER;

-- Backfill existing projects with ID-based order
UPDATE projects
SET sort_order = row_number - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at, id) AS row_number
  FROM projects
) AS numbered
WHERE projects.id = numbered.id;

-- Make NOT NULL after backfill
ALTER TABLE projects ALTER COLUMN sort_order SET NOT NULL;

-- Add index for efficient ordering queries
CREATE INDEX projects_user_id_sort_order_idx ON projects (user_id, sort_order);

-- Add unique constraint for case-insensitive name uniqueness
CREATE UNIQUE INDEX projects_name_user_id_lower_idx ON projects (user_id, LOWER(name));
```

---

## TypeScript Types

### Database Types (Auto-Generated)

**File**: `app/types/database.types.ts` (generated via `npm run supabase:types`)

```typescript
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: number
          user_id: string
          name: string
          expected_daily_stints: number
          custom_stint_duration: number
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: never
          user_id?: never
          name: string
          expected_daily_stints?: number
          custom_stint_duration?: number
          sort_order?: number
          created_at?: never
          updated_at?: never
        }
        Update: {
          name?: string
          expected_daily_stints?: number
          custom_stint_duration?: number
          sort_order?: number
        }
      }
      // ...
    }
  }
}
```

### Schema Types (Zod)

**File**: `app/schemas/projects.ts` (existing, may need updates)

```typescript
export const PROJECT_SCHEMA_LIMITS = {
  NAME_MIN: 1,
  NAME_MAX: 255,
  DAILY_STINTS_MIN: 1,
  DAILY_STINTS_MAX: 100,
  STINT_DURATION_MIN: 1,
  STINT_DURATION_MAX: 1440,
} as const

export const projectCreateSchema = z.object({
  name: z.string()
    .min(PROJECT_SCHEMA_LIMITS.NAME_MIN, 'Name is required')
    .max(PROJECT_SCHEMA_LIMITS.NAME_MAX, 'Name too long'),
  expectedDailyStints: z.number()
    .int()
    .min(PROJECT_SCHEMA_LIMITS.DAILY_STINTS_MIN)
    .max(PROJECT_SCHEMA_LIMITS.DAILY_STINTS_MAX)
    .default(3),
  customStintDuration: z.number()
    .int()
    .min(PROJECT_SCHEMA_LIMITS.STINT_DURATION_MIN)
    .max(PROJECT_SCHEMA_LIMITS.STINT_DURATION_MAX)
    .default(45),
})

export const projectUpdateSchema = projectCreateSchema.partial()

export type ProjectCreate = z.infer<typeof projectCreateSchema>
export type ProjectUpdate = z.infer<typeof projectUpdateSchema>
```

---

## Data Access Patterns

### Query: List Projects (Ordered)

```typescript
// app/lib/supabase/projects.ts
export async function listProjects(client: TypedSupabaseClient): Promise<ProjectRow[]> {
  const userId = await requireUserId(client)

  const { data, error } = await client
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data || []
}
```

### Mutation: Create Project

```typescript
export async function createProject(
  client: TypedSupabaseClient,
  input: ProjectInsert
): Promise<ProjectRow> {
  const userId = await requireUserId(client)

  const { data, error } = await client
    .from('projects')
    .insert({
      ...input,
      user_id: userId,
      // sort_order auto-assigned by default expression
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('A project with this name already exists')
    }
    throw error
  }

  return data
}
```

### Mutation: Update Project

```typescript
export async function updateProject(
  client: TypedSupabaseClient,
  projectId: number,
  updates: ProjectUpdate
): Promise<ProjectRow> {
  const userId = await requireUserId(client)

  const { data, error } = await client
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('A project with this name already exists')
    }
    throw error
  }

  return data
}
```

### Mutation: Delete Project (with Active Stint Check)

```typescript
export async function deleteProject(
  client: TypedSupabaseClient,
  projectId: number
): Promise<void> {
  const userId = await requireUserId(client)

  // Check for active stints
  const { data: activeStints } = await client
    .from('stints')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .is('end_time', null)
    .limit(1)

  if (activeStints && activeStints.length > 0) {
    throw new Error('Cannot delete project with active stint. Please stop the stint first.')
  }

  // Delete project (cascade deletes stints)
  const { error } = await client
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId)

  if (error) throw error
}
```

### Mutation: Reorder Projects

```typescript
export async function updateProjectSortOrder(
  client: TypedSupabaseClient,
  updates: Array<{ id: number; sortOrder: number }>
): Promise<void> {
  const userId = await requireUserId(client)

  // Batch update using Promise.all
  const promises = updates.map(({ id, sortOrder }) =>
    client
      .from('projects')
      .update({ sort_order: sortOrder })
      .eq('id', id)
      .eq('user_id', userId)
  )

  const results = await Promise.all(promises)

  const errors = results.filter(r => r.error)
  if (errors.length > 0) {
    throw new Error('Failed to update project order')
  }
}
```

---

## Test Coverage Requirements

### Database Layer Tests (`tests/database/`)

1. **RLS Policies**:
   - Users can only read their own projects
   - Users can only create projects for themselves
   - Users can only update their own projects
   - Users can only delete their own projects

2. **Constraints**:
   - Duplicate project names (case-insensitive) rejected
   - Negative `expected_daily_stints` rejected
   - Negative `custom_stint_duration` rejected
   - Project with active stint cannot be deleted
   - Deleting project cascades to stints

3. **Sort Order**:
   - New projects get max sort_order + 1
   - Reordering updates sort_order correctly

### Schema Layer Tests (`tests/schemas/`)

1. **Validation**:
   - Empty name rejected
   - Name >255 characters rejected
   - Zero or negative daily stints rejected
   - Zero or negative stint duration rejected

### Composable Layer Tests (`tests/composables/`)

1. **Optimistic Updates**:
   - Create: List updated immediately, rolled back on error
   - Update: Changes visible immediately, rolled back on error
   - Delete: Item removed immediately, rolled back on error
   - Reorder: Order updated immediately, rolled back on error

---

**Phase 1 Data Model Status**: ✅ Complete
