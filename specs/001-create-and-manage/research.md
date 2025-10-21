# Research: Dashboard Project Management

**Feature**: Dashboard Project Management
**Branch**: 001-create-and-manage
**Date**: 2025-10-04

## Phase 0 Research Findings

### 1. Drag-and-Drop Library Selection

**Decision**: Use `@vueuse/core` with native HTML5 drag-and-drop API

**Rationale**:
- VueUse already used in project (check dependencies)
- Provides `useSortable` composable for drag-and-drop list reordering
- Lightweight (~5KB), well-maintained, TypeScript-first
- Integrates seamlessly with Vue 3 Composition API
- No external UI library dependencies (compatible with Nuxt UI)

**Alternatives Considered**:
- **Vue Draggable Plus**: More feature-rich but heavier (~25KB), may conflict with Nuxt UI components
- **Native HTML5 Drag API**: Too low-level, requires manual state management and accessibility features
- **Sortable.js wrapper**: Mature but jQuery-era design, not Vue-native

**Implementation Notes**:
- Use `useSortable` from `@vueuse/integrations/useSortable`
- Requires `sortablejs` peer dependency (~15KB gzipped)
- Total bundle impact: ~20KB (within 50KB budget)

---

### 2. Modal State Management Pattern

**Decision**: Use local component state with Nuxt UI modal system

**Rationale**:
- Nuxt UI 4 provides `UModal` component with built-in state management
- Modal visibility controlled by `v-model:open` boolean
- No global state needed (modal state is ephemeral)
- Fits "zero overhead" philosophy (simple, no boilerplate)

**Alternatives Considered**:
- **Global modal store (Pinia)**: Overkill for simple modal visibility, adds complexity
- **Route-based modals**: Not compatible with SSG + modal requirement (spec says "no separate pages")
- **Teleport + manual overlay**: Reinventing Nuxt UI modal system

**Implementation Pattern**:
```typescript
// In dashboard/index.vue
const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingProject = ref<Project | null>(null)

function openEdit(project: Project) {
  editingProject.value = project
  showEditModal.value = true
}
```

---

### 3. Duplicate Name Validation Strategy

**Decision**: Client-side Zod validation + database unique constraint (case-insensitive)

**Rationale**:
- Zod schema validates on form input (immediate feedback)
- Database constraint enforces uniqueness server-side (data integrity)
- Use PostgreSQL `LOWER(name)` index for case-insensitive uniqueness
- Composable catches database error and transforms to user-friendly message

**Alternatives Considered**:
- **Client-only validation**: Vulnerable to race conditions (two tabs creating same project)
- **Server-only validation**: Poor UX (no immediate feedback)
- **API call to check existence**: Extra network round-trip, still vulnerable to races

**Implementation Approach**:
- Add Zod `.refine()` to check against existing project list (client-side, fast feedback)
- Database migration adds unique constraint: `CREATE UNIQUE INDEX projects_name_user_id_lower_idx ON projects (user_id, LOWER(name))`
- Composable error handler transforms Postgres error code 23505 (unique violation) to user message

---

### 4. Active Stint Deletion Protection

**Decision**: Database-level check in delete function + RLS policy

**Rationale**:
- Business rule: Cannot delete project with active stint
- Enforce in database layer (`app/lib/supabase/projects.ts`) before DELETE
- Query `stints` table for `project_id = $1 AND end_time IS NULL`
- Return error if active stint exists
- RLS test validates this constraint

**Alternatives Considered**:
- **Client-only check**: Unreliable (stale data, race conditions)
- **Database trigger**: More robust but less testable, harder to return user-friendly errors
- **Soft delete**: Out of scope (spec requires hard delete with cascade)

**Implementation**:
```typescript
// In app/lib/supabase/projects.ts
export async function deleteProject(client: TypedSupabaseClient, projectId: number) {
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
    return { data: null, error: new Error('Cannot delete project with active stint') }
  }

  // Proceed with delete (cascade handled by FK constraint)
  // ...
}
```

---

### 5. Optimistic UI Update Pattern

**Decision**: Extend existing `useProjectMutations` composable with optimistic update logic

**Rationale**:
- Pattern already established in codebase (per CLAUDE.md architecture)
- Immediate UI update + rollback on error = best UX
- Reorder operations need optimistic updates for drag-and-drop responsiveness
- Fits three-layer architecture (composable layer responsibility)

**Implementation Pattern**:
```typescript
// In app/composables/useProjectMutations.ts
export async function reorderProjects(newOrder: Project[]) {
  const previousState = [...projects.value]

  // Optimistic update
  projects.value = newOrder

  try {
    // Batch update sort_order in database
    const updates = newOrder.map((p, idx) => ({
      id: p.id,
      sort_order: idx
    }))
    const { error } = await batchUpdateSortOrder(client, updates)

    if (error) throw error
  } catch (e) {
    // Rollback on error
    projects.value = previousState
    throw e
  }
}
```

---

### 6. Sort Order Persistence

**Decision**: Add `sort_order` integer column to `projects` table

**Rationale**:
- User-defined order requires explicit sort field
- Integer column allows efficient sorting and reordering
- Default value = current max + 1 (new projects at end)
- Update on drag-and-drop reorder

**Database Schema**:
```sql
ALTER TABLE projects ADD COLUMN sort_order INTEGER;
UPDATE projects SET sort_order = id WHERE sort_order IS NULL;
ALTER TABLE projects ALTER COLUMN sort_order SET NOT NULL;
CREATE INDEX projects_sort_order_idx ON projects (user_id, sort_order);
```

**Alternatives Considered**:
- **Timestamp-based sorting**: Not user-controllable
- **Lexicographic ordering (fractional indexing)**: Overkill for small lists, more complex updates

---

## Research Summary

All technical unknowns resolved. Key decisions:
1. **Drag-and-drop**: VueUse + Sortable.js (~20KB)
2. **Modals**: Nuxt UI `UModal` with local state
3. **Duplicate prevention**: Zod + database unique constraint (case-insensitive)
4. **Active stint check**: Database layer function with RLS test
5. **Optimistic updates**: Extend existing composable pattern
6. **Sort order**: New integer column with index

No constitutional violations. All patterns align with existing architecture.

**Phase 0 Status**: ✅ Complete
