# Implementation Plan: Unified `useProjects` Composable with Vue Query

## Overview

Consolidate all project-related data fetching and mutations into a single `useProjects` composable using TanStack Query (Vue Query). This will replace the current manual data fetching pattern and merge the existing `useProjectMutations` composable into one cohesive solution.

## Current State

**Data Fetching:**
- Manual `onMounted()` calls with `listProjects(client)` in pages
- Local state management with `ref<ProjectRow[]>([])`
- Manual loading states and error handling

**Mutations:**
- Handled by separate `useProjectMutations` composable
- Implements optimistic updates with manual rollback
- No automatic query invalidation

**Problems:**
- No automatic caching or background refetching
- No stale-while-revalidate behavior
- Queries and mutations not coordinated
- Duplicate state management concerns

## Implementation Steps

### 1. Install Dependencies

```bash
npm install @tanstack/vue-query @tanstack/vue-query-devtools
```

Install the TanStack Query library for Vue 3 and its devtools for development.

**Note:** `@vueuse/core` is already installed (used for `useDebounceFn` in reordering).

### 2. Configure Vue Query Plugin

**File:** `app/plugins/vue-query.ts`

Create a Nuxt plugin to initialize the Vue Query client with sensible defaults:

- Stale time: 5 minutes (data considered fresh)
- Cache time: 10 minutes (unused data kept in cache)
- Retry: 1 attempt on failure
- Refetch on window focus: enabled
- Dev tools: enabled in development mode

**SSG Considerations:**

Since LifeStint is a static site (SSG), Vue Query will operate entirely client-side:
- No server-side hydration concerns
- All queries run in browser after page load
- Plugin should check `import.meta.client` before initialization
- Initial data fetching happens after mount, not during SSR

**Dev Tools Setup:**

Install the Vue Query Devtools for development:

```bash
npm install @tanstack/vue-query-devtools
```

Configure in plugin to only load in development mode for optimal bundle size.

### 3. Create Unified `useProjects` Composable

**File:** `app/composables/useProjects.ts`

This composable will consolidate ALL project operations:

#### Query Key Factory

Establish a consistent query key pattern for type safety and easy invalidation:

```typescript
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters?: ProjectFilters) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
}
```

Benefits:
- Type-safe query keys
- Hierarchical invalidation (invalidate all projects or just one)
- Consistent structure across the app
- Easy to extend with filters later

#### Query Hooks

**`useProjectsQuery()`**
- Fetches all projects with automatic caching
- Returns: `{ data, isLoading, error, refetch }`
- Query key: `projectKeys.lists()`
- Automatically refetches when stale

**`useProjectQuery(id: string)`**
- Fetches a single project by ID
- Returns: `{ data, isLoading, error, refetch }`
- Query key: `projectKeys.detail(id)`
- Parameter-based caching

#### Mutation Hooks (merged from useProjectMutations)

**`useCreateProject()`**
- Creates new project with Zod validation
- Optimistic updates via Vue Query mutation options
- Auto-invalidates `projectKeys.all` query on success
- Returns: `{ mutate, mutateAsync, isPending, error }`

**`useUpdateProject()`**
- Updates existing project with Zod validation
- Optimistic updates for immediate UI feedback
- Auto-invalidates both `projectKeys.all` and `projectKeys.detail(id)` queries
- Returns: `{ mutate, mutateAsync, isPending, error }`

**`useDeleteProject()`**
- Deletes project with active stint validation
- Optimistic removal from cache
- Auto-invalidates `projectKeys.all` query
- Returns: `{ mutate, mutateAsync, isPending, error }`

**`useReorderProjects()`**
- Updates project sort order
- Optimistic reordering in cache
- **Debouncing Strategy:** Use `useDebounceFn` from `@vueuse/core` with 500ms delay to batch rapid drag operations
- Batch updates to database (only persist final order)
- Auto-invalidates `projectKeys.all` query on success
- Returns: `{ mutate, mutateAsync, isPending, error }`

**`useToggleProjectActive()`**
- Convenience wrapper around `useUpdateProject()`
- Toggles `isActive` status
- Same optimistic behavior and invalidation

#### Architecture Principles

- **Vue Query** handles caching, refetching, and cache invalidation
- **Optimistic Updates** via Vue Query's mutation `onMutate` hook
- **Rollback** via Vue Query's `onError` hook
- **Validation** with Zod schemas (from `app/schemas/projects.ts`)
- **Database Layer** calls to existing functions in `app/lib/supabase/projects.ts`
- **Transform Layer** `toDbPayload()` for camelCase → snake_case conversion
- **User Feedback** via Nuxt UI's `useToast()` composable for success/error notifications

#### TypeScript Type Safety Patterns

Export fully typed interfaces for all hooks:

```typescript
import type { UseQueryReturnType, UseMutationReturnType } from '@tanstack/vue-query'
import type { ProjectRow, ProjectInsert, ProjectUpdate } from '~/lib/supabase/projects'

// Query return types
export type ProjectsQueryResult = UseQueryReturnType<ProjectRow[], Error>
export type ProjectQueryResult = UseQueryReturnType<ProjectRow | null, Error>

// Mutation return types
export type CreateProjectMutation = UseMutationReturnType<
  ProjectRow,
  Error,
  ProjectInsert,
  unknown
>

export type UpdateProjectMutation = UseMutationReturnType<
  ProjectRow,
  Error,
  { id: string; data: ProjectUpdate },
  unknown
>

export type DeleteProjectMutation = UseMutationReturnType<
  void,
  Error,
  string,
  unknown
>
```

Benefits:
- Components can properly type destructured values
- IDE autocomplete for query/mutation states
- Compile-time safety for error handling
- Documentation through types

#### Error Handling Patterns

**Global Error Handling:**

Configure default error handling in the Vue Query plugin using Nuxt UI's `useToast()`:

```typescript
// app/plugins/vue-query.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => {
        console.error('Query error:', error)
        // Note: Component-level error handling is preferred for queries
        // to allow contextual error messages and retry actions
      },
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error)
        // Note: Component-level toast notifications are preferred
        // to allow custom error messages per mutation type
      },
    },
  },
})
```

**Local Error Handling in Components:**

Use Nuxt UI's `useToast()` composable for user-facing error notifications:

```typescript
// Component-level error handling example
const toast = useToast()
const { data, error, isLoading } = useProjectsQuery()

// Programmatic error handling with toast notifications
const { mutateAsync } = useCreateProject()

const handleSubmit = async (formData) => {
  try {
    await mutateAsync(formData)
    toast.add({
      title: 'Success',
      description: 'Project created successfully',
      color: 'success',
    })
  } catch (err) {
    // Component-specific error handling
    if (err instanceof ZodError) {
      // Handle validation errors inline (form fields)
      toast.add({
        title: 'Validation Error',
        description: 'Please check your inputs',
        color: 'error',
      })
    } else {
      // Handle API errors with toast
      toast.add({
        title: 'Error',
        description: err.message || 'An unexpected error occurred',
        color: 'error',
      })
    }
  }
}
```

**Error Type Discrimination:**

Distinguish between error types for better UX:

- **Validation Errors** (ZodError): Show inline form errors
- **Network Errors**: Show retry button
- **Auth Errors**: Redirect to login
- **Database Errors**: Show generic error message

### 4. Delete Old Composable

Remove the now-redundant files:
- `app/composables/useProjectMutations.ts`
- `tests/composables/useProjectMutations.test.ts`

All functionality is now unified in `useProjects.ts`.

### 5. Update All Consumers

Update components and pages to use the new unified composable:

#### `app/pages/dashboard/index.vue`
- Replace manual `onMounted()` fetching with `useProjectsQuery()`
- Remove local `projects` ref and `isLoading` ref
- Use query state directly: `const { data: projects, isLoading, error } = useProjectsQuery()`

**Error Handling Example:**
```vue
<template>
  <div v-if="isLoading">Loading projects...</div>
  <div v-else-if="error" class="error-banner">
    <p>Failed to load projects: {{ error.message }}</p>
    <UButton @click="refetch">Retry</UButton>
  </div>
  <ProjectList v-else :projects="projects" />
</template>

<script setup lang="ts">
const { data: projects, isLoading, error, refetch } = useProjectsQuery()
</script>
```

#### `app/components/ProjectList.vue`
- Replace `useProjectMutations()` with `useReorderProjects()`
- Update mutation call syntax to Vue Query pattern
- Add debounced reordering with optimistic updates

#### `app/components/ProjectCreateModal.vue`
- Replace `useProjectMutations()` with `useCreateProject()`
- Update to use `mutateAsync()` or `mutate()` pattern
- Leverage automatic query invalidation (no manual state updates needed)

**Error Handling Example:**
```vue
<script setup lang="ts">
const { mutateAsync, isPending } = useCreateProject()
const toast = useToast()

const handleSubmit = async (formData: ProjectInsert) => {
  try {
    await mutateAsync(formData)
    toast.add({
      title: 'Project created',
      description: `${formData.name} has been created successfully`,
      color: 'success',
    })
    closeModal()
  } catch (err) {
    if (err instanceof ZodError) {
      // Display validation errors inline
      formErrors.value = err.flatten().fieldErrors
      toast.add({
        title: 'Validation Error',
        description: 'Please check your inputs',
        color: 'error',
      })
    } else {
      // Display generic error toast
      toast.add({
        title: 'Failed to create project',
        description: err.message || 'An unexpected error occurred',
        color: 'error',
      })
    }
  }
}
</script>
```

#### `app/components/ProjectEditModal.vue`
- Replace `useProjectMutations()` with `useUpdateProject()`
- Update to use Vue Query mutation pattern
- Rely on automatic cache updates
- Use `useToast()` for success/error notifications
- Handle validation and network errors gracefully

#### `app/components/ProjectDeleteModal.vue`
- Replace `useProjectMutations()` with `useDeleteProject()`
- Update to use Vue Query mutation pattern
- Rely on automatic cache invalidation
- Use `useToast()` for success/error notifications
- Show error toast if deletion fails (e.g., project has active stints)

### 6. Write Tests

**File:** `tests/composables/useProjects.test.ts`

Comprehensive test coverage for:

**Query Tests:**
- Projects list caching behavior
- Single project caching behavior
- Refetching on stale data
- Error handling and states
- Loading states

**Mutation Tests:**
- Create project with optimistic updates
- Update project with optimistic updates
- Delete project with optimistic updates
- Reorder projects with batch updates
- Toggle active status
- Query invalidation after mutations
- Rollback on error
- Zod validation errors

**Integration Tests:**
- Mutation → query invalidation flow
- Optimistic update → server response → cache sync
- Error scenarios with rollback

### 7. Verification Steps

After implementation:

1. **Run Tests:** `npm run test:run`
2. **Type Check:** `npm run type-check`
3. **Manual Testing:**
   - Create a project → verify immediate UI update → verify persists on refresh
   - Edit a project → verify optimistic update → verify rollback on error
   - Delete a project → verify immediate removal → verify persists
   - Reorder projects → verify drag-and-drop works → verify order persists
   - Toggle active status → verify immediate feedback

## Benefits

- **Single Source of Truth:** One composable for all project operations
- **Automatic Caching:** No manual cache management
- **Background Refetching:** Always up-to-date data
- **Optimistic Updates:** Immediate UI feedback
- **Automatic Invalidation:** Queries refresh after mutations
- **Better Error Handling:** Centralized error states with toast notifications
- **Simplified Imports:** One composable instead of multiple
- **Type Safety:** Full TypeScript support throughout
- **Consistent Patterns:** Same approach for all CRUD operations
- **User Feedback:** Built-in toast notifications via Nuxt UI's `useToast()`

## Migration Notes

- All existing functionality preserved
- API surface intentionally similar to reduce friction
- Optimistic updates behavior maintained
- Validation rules unchanged
- Database layer untouched

## Future Enhancements

- Add pagination for large project lists
- Implement infinite scroll if needed
- Add query filters (active/inactive, search)
- Consider realtime subscriptions via Supabase + Query integration
- Add mutation loading states to UI components
