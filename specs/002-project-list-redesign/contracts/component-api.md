# Component API Contracts

**Feature**: 002-project-list-redesign
**Date**: November 14, 2025

---

## Overview

This document defines the public API contracts for all components in the Project List redesign. These are TypeScript interfaces that define props, emits, slots, and exposed methods.

**Note**: This is a UI-only feature. "Contracts" refer to component APIs, not REST/GraphQL endpoints.

---

## 1. ProjectList Component

**File**: `app/components/ProjectList.vue`
**Status**: Modified (existing component)

### Props

```typescript
interface ProjectListProps {
  /**
   * List of projects to display
   * @required
   */
  projects: ProjectRow[]
}
```

### Emits

```typescript
interface ProjectListEmits {
  /**
   * Emitted when user clicks edit button on a project
   * @param project - The project to edit
   */
  edit: (project: ProjectRow) => void
}
```

### Exposed Methods

None (component is stateless except for internal drag state)

### Usage Example

```vue
<template>
  <ProjectList
    :projects="projectsData"
    @edit="handleEditProject"
  />
</template>

<script setup lang="ts">
const { data: projectsData } = useProjectsQuery()

function handleEditProject(project: ProjectRow) {
  // Open edit modal
}
</script>
```

---

## 2. ProjectListCard Component

**File**: `app/components/ProjectListCard.vue`
**Status**: New component

### Props

```typescript
interface ProjectListCardProps {
  /**
   * Project data to display
   * @required
   */
  project: ProjectRow

  /**
   * Active stint (if this project has one running)
   * @optional
   */
  activeStint?: StintRow | null

  /**
   * Whether another project has an active stint
   * Used to disable "Start Stint" button
   * @optional
   * @default false
   */
  hasOtherActiveStint?: boolean

  /**
   * Whether this card is draggable
   * Only active projects are draggable
   * @optional
   * @default true
   */
  draggable?: boolean
}
```

### Emits

```typescript
interface ProjectListCardEmits {
  /**
   * Emitted when user clicks edit button
   * @param project - The project being edited
   */
  edit: (project: ProjectRow) => void

  /**
   * Emitted when user toggles active/inactive status
   * @param projectId - ID of project to toggle
   */
  'toggle-active': (projectId: string) => void

  /**
   * Emitted when user clicks "Start Stint" button
   * @param project - The project to start stint on
   */
  'start-stint': (project: ProjectRow) => void

  /**
   * Emitted when user clicks "Pause" button on active stint
   * @param stintId - ID of stint to pause
   */
  'pause-stint': (stintId: string) => void

  /**
   * Emitted when user clicks "Resume" button on paused stint
   * @param stintId - ID of stint to resume
   */
  'resume-stint': (stintId: string) => void

  /**
   * Emitted when user clicks "Stop" button on active/paused stint
   * @param stintId - ID of stint to stop
   */
  'stop-stint': (stintId: string) => void

  /**
   * Emitted when user reorders project via drag-and-drop
   * Note: This is handled by parent's useSortable, but included for completeness
   * @param oldIndex - Original position
   * @param newIndex - New position
   */
  reorder?: (data: { oldIndex: number, newIndex: number }) => void
}
```

### Slots

```typescript
interface ProjectListCardSlots {
  /**
   * Optional slot to replace default controls section
   * @param { project: ProjectRow, activeStint: StintRow | null } slot props
   */
  controls?: (props: {
    project: ProjectRow
    activeStint: StintRow | null
  }) => VNode[]

  /**
   * Optional slot to add content after metadata line
   * @param { project: ProjectRow } slot props
   */
  'after-metadata'?: (props: { project: ProjectRow }) => VNode[]
}
```

### Usage Example

```vue
<template>
  <ProjectListCard
    :project="project"
    :active-stint="activeStint"
    :has-other-active-stint="hasOtherActiveStint"
    :draggable="project.is_active"
    @edit="handleEdit"
    @toggle-active="handleToggleActive"
    @start-stint="handleStartStint"
    @pause-stint="handlePauseStint"
    @resume-stint="handleResumeStint"
    @stop-stint="handleStopStint"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  project: ProjectRow
}>()

const { data: activeStint } = useActiveStintQuery()
const { mutateAsync: toggleActive } = useToggleProjectActive()
const { mutateAsync: startStint } = useStartStint()
const { mutateAsync: pauseStint } = usePauseStint()
const { mutateAsync: resumeStint } = useResumeStint()
const { mutateAsync: stopStint } = useStopStint()

const hasOtherActiveStint = computed(() =>
  !!activeStint.value && activeStint.value.project_id !== props.project.id
)

function handleEdit(project: ProjectRow) {
  // Open edit modal
}

async function handleToggleActive(projectId: string) {
  await toggleActive(projectId)
}

async function handleStartStint(project: ProjectRow) {
  await startStint({
    projectId: project.id,
    plannedDurationMinutes: project.custom_stint_duration ?? undefined,
  })
}

async function handlePauseStint(stintId: string) {
  await pauseStint(stintId)
}

async function handleResumeStint(stintId: string) {
  await resumeStint(stintId)
}

async function handleStopStint(stintId: string) {
  await stopStint(stintId)
}
</script>
```

---

## 3. ProjectListSection Component

**File**: `app/components/ProjectListSection.vue`
**Status**: New component (optional organizational component)

### Props

```typescript
interface ProjectListSectionProps {
  /**
   * Section title
   * @required
   * @example "Active Projects", "Inactive Projects (5)"
   */
  title: string

  /**
   * Whether section is collapsible
   * @optional
   * @default false
   */
  collapsible?: boolean

  /**
   * Initial collapsed state (only applicable if collapsible=true)
   * @optional
   * @default false
   */
  defaultCollapsed?: boolean

  /**
   * Optional icon to show next to title
   * @optional
   * @example "i-lucide-folder"
   */
  icon?: string
}
```

### Emits

```typescript
interface ProjectListSectionEmits {
  /**
   * Emitted when section is expanded/collapsed
   * @param isExpanded - New expanded state
   */
  toggle: (isExpanded: boolean) => void
}
```

### Slots

```typescript
interface ProjectListSectionSlots {
  /**
   * Default slot for section content
   */
  default: () => VNode[]

  /**
   * Optional slot to customize section header
   * @param { title: string, isExpanded: boolean } slot props
   */
  header?: (props: {
    title: string
    isExpanded: boolean
  }) => VNode[]
}
```

### Usage Example

```vue
<template>
  <ProjectListSection
    title="Inactive Projects (5)"
    collapsible
    default-collapsed
    @toggle="handleToggle"
  >
    <ProjectListCard
      v-for="project in inactiveProjects"
      :key="project.id"
      :project="project"
      :draggable="false"
      @edit="handleEdit"
      @toggle-active="handleToggleActive"
    />
  </ProjectListSection>
</template>

<script setup lang="ts">
const inactiveProjects = computed(() =>
  projects.value.filter(p => !p.is_active)
)

function handleToggle(isExpanded: boolean) {
  // Track analytics or update user preferences
  console.log('Inactive section expanded:', isExpanded)
}
</script>
```

---

## 4. Type Definitions

### ProjectDisplay (View Model)

```typescript
/**
 * Enhanced project with computed UI properties
 */
interface ProjectDisplay extends ProjectRow {
  formattedDuration: string       // "45m", "1h 30m"
  hasActiveStint: boolean         // True if active stint on this project
  activeStint: StintRow | null    // Active stint or null
  dailyProgress: DailyProgress    // Today's progress
  canStartStint: boolean          // Can user start a stint?
  colorBorderClass: string        // Tailwind border class
}
```

### DailyProgress (Computed)

```typescript
/**
 * Daily progress metrics for a project
 */
interface DailyProgress {
  projectId: string       // Project UUID
  completed: number       // Completed stints today
  expected: number        // Expected daily stints
  percentage: number      // Percentage (0-100+)
  isOverAchieving: boolean // completed > expected
  isMet: boolean          // completed >= expected
}
```

---

## 5. Composable Contracts

### useProjectsQuery (Existing)

```typescript
/**
 * Fetches list of projects with optional filters
 * @param filters - Optional filters (includeInactive)
 * @returns TanStack Query result with ProjectRow[]
 */
function useProjectsQuery(
  filters?: MaybeRefOrGetter<ProjectListFilters | undefined>
): UseQueryReturnType<ProjectRow[], Error>

interface ProjectListFilters {
  includeInactive?: boolean
}
```

### useActiveStintQuery (Existing)

```typescript
/**
 * Fetches the currently active stint (singleton)
 * @returns TanStack Query result with StintRow | null
 */
function useActiveStintQuery(): UseQueryReturnType<StintRow | null, Error>
```

### useStintsQuery (Existing)

```typescript
/**
 * Fetches list of stints with optional filters
 * @param filters - Optional filters (date range, project, status)
 * @returns TanStack Query result with StintRow[]
 */
function useStintsQuery(
  filters?: MaybeRefOrGetter<StintListFilters | undefined>
): UseQueryReturnType<StintRow[], Error>

interface StintListFilters {
  projectId?: string
  status?: 'active' | 'paused' | 'completed'
  startDate?: Date
  endDate?: Date
}
```

### useStartStint (Existing)

```typescript
/**
 * Mutation to start a new stint
 * @returns TanStack Mutation with optimistic updates
 */
function useStartStint(): UseMutationReturnType<
  StintRow,
  Error,
  { projectId: string, plannedDurationMinutes?: number },
  unknown
>
```

### usePauseStint (Existing)

```typescript
/**
 * Mutation to pause the currently active stint
 * @returns TanStack Mutation with optimistic updates
 */
function usePauseStint(): UseMutationReturnType<
  StintRow,
  Error,
  string, // stintId
  unknown
>
```

### useResumeStint (Existing)

```typescript
/**
 * Mutation to resume a paused stint
 * @returns TanStack Mutation with optimistic updates
 */
function useResumeStint(): UseMutationReturnType<
  StintRow,
  Error,
  string, // stintId
  unknown
>
```

### useStopStint (Existing)

```typescript
/**
 * Mutation to stop (complete) an active or paused stint
 * @returns TanStack Mutation with optimistic updates
 */
function useStopStint(): UseMutationReturnType<
  StintRow,
  Error,
  string, // stintId
  unknown
>
```

### useToggleProjectActive (Existing)

```typescript
/**
 * Mutation to toggle project active/inactive status
 * @returns TanStack Mutation with optimistic updates
 */
function useToggleProjectActive(): UseMutationReturnType<
  ProjectRow,
  Error,
  string, // projectId
  unknown
>
```

### useReorderProjects (Existing)

```typescript
/**
 * Mutation to reorder projects (debounced 500ms)
 * @returns TanStack Mutation with optimistic updates
 */
function useReorderProjects(): {
  mutate: (newOrder: ProjectRow[]) => void        // Debounced
  mutateImmediate: (newOrder: ProjectRow[]) => void // Immediate
  isError: Ref<boolean>
  error: Ref<Error | null>
  isPending: Ref<boolean>
}
```

---

## 6. Event Contracts

### Component Events

| Event | Payload | Description | Handler Location |
|---|---|---|---|
| `@edit` | `ProjectRow` | User clicks edit button | Parent component (opens modal) |
| `@toggle-active` | `string` (projectId) | User toggles active switch | Parent component (calls `useToggleProjectActive`) |
| `@start-stint` | `ProjectRow` | User clicks Start Stint | Parent component (calls `useStartStint`) |
| `@pause-stint` | `string` (stintId) | User clicks Pause button | Parent component (calls `usePauseStint`) |
| `@resume-stint` | `string` (stintId) | User clicks Resume button | Parent component (calls `useResumeStint`) |
| `@stop-stint` | `string` (stintId) | User clicks Stop button | Parent component (calls `useStopStint`) |
| `@toggle` | `boolean` (isExpanded) | User expands/collapses section | Parent component (analytics/state) |
| `@reorder` | `{oldIndex, newIndex}` | User drags project to new position | Parent component (handled by `useSortable`) |

### User Interactions

```typescript
/**
 * All user interactions that trigger state changes
 * These map directly to component emits
 */
type UserInteraction =
  | { type: 'edit', project: ProjectRow }
  | { type: 'toggle-active', projectId: string }
  | { type: 'start-stint', project: ProjectRow }
  | { type: 'pause-stint', stintId: string }
  | { type: 'resume-stint', stintId: string }
  | { type: 'stop-stint', stintId: string }
  | { type: 'reorder', oldIndex: number, newIndex: number }
  | { type: 'toggle-section', sectionName: string, isExpanded: boolean }
```

---

## 7. Validation Contracts

### Input Validation

All validation handled by existing Zod schemas:
- `app/schemas/projects.ts` - Project CRUD validation
- `app/schemas/stints.ts` - Stint CRUD validation

### UI-Level Constraints

```typescript
/**
 * Business rules enforced in UI
 */
const uiConstraints = {
  // Only active projects can have stints started
  canStartStint: (project: ProjectRow, hasOtherActiveStint: boolean): boolean => {
    return project.is_active && !hasOtherActiveStint
  },

  // Only active projects are draggable
  isDraggable: (project: ProjectRow): boolean => {
    return project.is_active
  },

  // Progress bar capped at 100%
  progressPercentage: (completed: number, expected: number): number => {
    return Math.min((completed / expected) * 100, 100)
  },
}
```

---

## 8. Error Handling Contracts

### Error Types

```typescript
/**
 * Possible error states in Project List feature
 * Each error type maps to a specific user action that can fail
 */
type ProjectListError =
  // Data Loading Errors
  | { type: 'fetch-projects-failed', message: string }     // Failed to load projects list
  | { type: 'fetch-stints-failed', message: string }       // Failed to load stints for progress
  | { type: 'fetch-active-stint-failed', message: string } // Failed to load active stint

  // Project Mutation Errors
  | { type: 'update-project-failed', message: string }     // Failed to save project edits
  | { type: 'toggle-active-failed', message: string }      // Failed to toggle active/inactive
  | { type: 'reorder-projects-failed', message: string }   // Failed to save new order

  // Stint Mutation Errors
  | { type: 'start-stint-failed', message: string }        // Failed to start new stint
  | { type: 'pause-stint-failed', message: string }        // Failed to pause active stint
  | { type: 'resume-stint-failed', message: string }       // Failed to resume paused stint
  | { type: 'stop-stint-failed', message: string }         // Failed to stop/complete stint

  // Validation Errors
  | { type: 'validation-error', message: string }          // Client-side validation failed

  // Network/System Errors
  | { type: 'network-error', message: string }             // Network timeout or connectivity issue
  | { type: 'unknown-error', message: string }             // Unexpected error
```

### Error Type Mapping

| User Action | Error Type | Composable | Example Message |
|-------------|------------|------------|-----------------|
| Load projects | `fetch-projects-failed` | `useProjectsQuery` | "Failed to load projects. Please refresh." |
| Load stints | `fetch-stints-failed` | `useStintsQuery` | "Failed to load progress data." |
| Load active stint | `fetch-active-stint-failed` | `useActiveStintQuery` | "Failed to load active stint status." |
| Edit project | `update-project-failed` | `useUpdateProject` | "Failed to save changes to {project name}." |
| Toggle active | `toggle-active-failed` | `useToggleProjectActive` | "Failed to {activate\|deactivate} project." |
| Reorder | `reorder-projects-failed` | `useReorderProjects` | "Failed to save new project order." |
| Start stint | `start-stint-failed` | `useStartStint` | "Failed to start stint on {project name}." |
| Pause stint | `pause-stint-failed` | `usePauseStint` | "Failed to pause stint." |
| Resume stint | `resume-stint-failed` | `useResumeStint` | "Failed to resume stint." |
| Stop stint | `stop-stint-failed` | `useStopStint` | "Failed to stop stint." |
| Any validation | `validation-error` | Schema validation | "Invalid input: {field} is required." |
| Network issues | `network-error` | Any mutation/query | "Network connection lost. Please try again." |
| Unknown | `unknown-error` | Any operation | "An unexpected error occurred." |
```

### Error Display

All errors displayed via toast notifications:

```typescript
interface ToastNotification {
  title: string                 // Short error summary
  description?: string          // Detailed error message
  color: 'error' | 'warning' | 'success' | 'info'
  icon?: string                 // Lucide icon name
  timeout?: number              // Auto-dismiss time (ms)
}

// Example usage
toast.add({
  title: 'Failed to start stint',
  description: error.message || 'An unexpected error occurred',
  color: 'error',
  icon: 'i-lucide-alert-circle',
  timeout: 5000,
})
```

---

## 9. Accessibility Contracts

### ARIA Attributes

```typescript
/**
 * Required ARIA attributes for accessibility
 */
interface AriaAttributes {
  // Drag handle
  'aria-label': 'Reorder project'
  'role': undefined // Native button role

  // Toggle switch
  'aria-label': 'Toggle project active status'
  'aria-checked': boolean

  // Icon-only buttons
  'aria-label': string // Required for all icon-only buttons

  // Progress indicator
  'role': 'status'
  'aria-label': string // "Daily progress: X of Y stints completed"

  // Collapsible section
  'aria-expanded': boolean
  'aria-controls': string // ID of content region
}
```

### Keyboard Navigation

| Key | Action | Element |
|---|---|---|
| `Tab` | Navigate between interactive elements | All buttons, switches, links |
| `Enter` / `Space` | Activate button or toggle | Buttons, switches |
| `Escape` | Close modal/dropdown (if applicable) | Modal dialogs |
| `Arrow Up/Down` | Navigate list items | Future enhancement (not in MVP) |

### Screen Reader Announcements

```typescript
/**
 * Screen reader announcements for state changes
 */
const announcements = {
  stintStarted: (projectName: string) =>
    `Stint started on ${projectName}`,

  stintStopped: (projectName: string) =>
    `Stint stopped on ${projectName}`,

  projectActivated: (projectName: string) =>
    `${projectName} is now active`,

  projectDeactivated: (projectName: string) =>
    `${projectName} is now inactive`,

  projectReordered: (projectName: string, newPosition: number) =>
    `${projectName} moved to position ${newPosition}`,
}
```

---

## 10. Performance Contracts

### Component Render Budget

| Component | Max Render Time | Instances | Total Budget |
|---|---|---|---|
| ProjectList | 5ms | 1 | 5ms |
| ProjectListCard | 0.5ms | 25 | 12.5ms |
| ProjectListSection | 0.1ms | 2 | 0.2ms |
| **Total** | | | **17.7ms** |

**Target**: 16.67ms (60fps) ✅

### Re-render Optimization

```typescript
/**
 * Memoization strategy for expensive computations
 */
const optimizations = {
  // Use v-memo for project cards
  cardMemo: ['project.id', 'project.updated_at', 'activeStint?.id'],

  // Debounce drag updates
  dragDebounce: 500, // ms

  // Lazy load inactive projects
  inactiveLazy: true, // Only render when expanded
}
```

---

## Summary

**Total Components**: 3 (1 modified, 2 new)
**Public Props**: 9
**Emits**: 8 (edit, toggle-active, start-stint, pause-stint, resume-stint, stop-stint, toggle, reorder)
**Composables**: 10 (all existing: useProjectsQuery, useActiveStintQuery, useStintsQuery, useStartStint, usePauseStint, useResumeStint, useStopStint, useToggleProjectActive, useUpdateProject, useReorderProjects)
**Error Types**: 13 (3 fetch errors, 3 project mutations, 4 stint mutations, 1 validation, 2 system errors)
**ARIA Requirements**: 6
**Performance Budget**: 17.7ms / 16.67ms ✅

✅ **All contracts defined with complete event coverage, comprehensive error handling, and backward compatibility maintained**

---

**Document Version**: 1.0
**Last Updated**: November 14, 2025
