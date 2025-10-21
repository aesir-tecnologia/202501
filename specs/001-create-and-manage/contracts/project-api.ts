/**
 * API Contract: Project Management
 *
 * This file defines the TypeScript contract for project CRUD operations.
 * In a Nuxt SSG application with Supabase, these are client-side API calls
 * to the Supabase database via the three-layer architecture.
 *
 * Architecture:
 * - Database Layer: app/lib/supabase/projects.ts
 * - Schema Layer: app/schemas/projects.ts
 * - Composable Layer: app/composables/useProjectMutations.ts
 */

import type { Database } from '~/types/database.types'

// Type aliases for clarity
export type ProjectRow = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

/**
 * Result type for operations that may fail
 */
export type Result<T> = {
  data: T | null
  error: Error | null
}

/**
 * Contract: List Projects
 *
 * Retrieves all projects for the authenticated user, ordered by user-defined sort_order.
 *
 * @returns Array of projects, empty array if none exist
 * @throws Error if not authenticated or database error
 */
export interface ListProjectsContract {
  (): Promise<ProjectRow[]>
}

/**
 * Contract: Get Project
 *
 * Retrieves a single project by ID. Only returns project if owned by authenticated user (RLS enforced).
 *
 * @param projectId - Unique project identifier
 * @returns Project or null if not found
 * @throws Error if not authenticated or database error
 */
export interface GetProjectContract {
  (projectId: number): Promise<ProjectRow | null>
}

/**
 * Contract: Create Project
 *
 * Creates a new project for the authenticated user.
 * sort_order is auto-assigned as max(sort_order) + 1.
 *
 * @param input - Project creation data (camelCase schema)
 * @returns Created project
 * @throws Error if validation fails, name already exists (case-insensitive), or database error
 */
export interface CreateProjectContract {
  (input: ProjectCreate): Promise<ProjectRow>
}

/**
 * Contract: Update Project
 *
 * Updates an existing project. Only succeeds if project is owned by authenticated user (RLS enforced).
 *
 * @param projectId - Unique project identifier
 * @param updates - Partial project update data (camelCase schema)
 * @returns Updated project
 * @throws Error if validation fails, name conflict, project not found, or database error
 */
export interface UpdateProjectContract {
  (projectId: number, updates: ProjectUpdate): Promise<ProjectRow>
}

/**
 * Contract: Delete Project
 *
 * Deletes a project and cascades to all associated stints.
 * Blocks deletion if any stint has end_time IS NULL (active stint).
 *
 * @param projectId - Unique project identifier
 * @throws Error if active stint exists, project not found, or database error
 */
export interface DeleteProjectContract {
  (projectId: number): Promise<void>
}

/**
 * Contract: Reorder Projects
 *
 * Updates sort_order for multiple projects in a single batch operation.
 * Used for drag-and-drop reordering.
 *
 * @param updates - Array of {id, sortOrder} pairs
 * @throws Error if any project not found or database error
 */
export interface ReorderProjectsContract {
  (updates: Array<{ id: number, sortOrder: number }>): Promise<void>
}

/**
 * Contract: Check Active Stint
 *
 * Checks if a project has an active stint (end_time IS NULL).
 * Used for pre-delete validation UI.
 *
 * @param projectId - Unique project identifier
 * @returns true if active stint exists, false otherwise
 */
export interface HasActiveStintContract {
  (projectId: number): Promise<boolean>
}

// ============================================================================
// Schema Types (camelCase for client-side API surface)
// ============================================================================

/**
 * Schema: Project Create
 *
 * Validation:
 * - name: 1-255 chars, trimmed, required
 * - expectedDailyStints: 1-100, integer, default 3
 * - customStintDuration: 1-1440 minutes, integer, default 45
 */
export interface ProjectCreate {
  name: string
  expectedDailyStints?: number
  customStintDuration?: number
}

/**
 * Schema: Project Update
 *
 * All fields optional. Same validation rules as create.
 */
export type ProjectUpdate = Partial<ProjectCreate>

// ============================================================================
// Error Codes
// ============================================================================

/**
 * Domain-specific error codes for user-friendly error messages
 */
export enum ProjectErrorCode {
  DUPLICATE_NAME = 'DUPLICATE_NAME',
  ACTIVE_STINT_EXISTS = 'ACTIVE_STINT_EXISTS',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

/**
 * Error messages for user display
 */
export const PROJECT_ERROR_MESSAGES: Record<ProjectErrorCode, string> = {
  [ProjectErrorCode.DUPLICATE_NAME]: 'A project with this name already exists',
  [ProjectErrorCode.ACTIVE_STINT_EXISTS]: 'Cannot delete project with active stint. Please stop the stint first.',
  [ProjectErrorCode.NOT_FOUND]: 'Project not found',
  [ProjectErrorCode.VALIDATION_ERROR]: 'Invalid project data',
  [ProjectErrorCode.UNAUTHORIZED]: 'You do not have permission to access this project',
}
