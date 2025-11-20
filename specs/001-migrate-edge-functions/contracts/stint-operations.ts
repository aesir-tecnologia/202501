/**
 * API Contracts for Stint Operations
 *
 * This file defines the TypeScript interfaces for all stint operations
 * migrated from Supabase Edge Functions to client-side composables.
 *
 * These contracts serve as the specification for:
 * 1. Input validation (Zod schemas in app/schemas/stints.ts)
 * 2. Database layer functions (app/lib/supabase/stints.ts)
 * 3. Composable mutations/queries (app/composables/useStints.ts)
 */

// ============================================================================
// Base Types
// ============================================================================

/**
 * Stint status enumeration
 * Represents the current state in the stint lifecycle
 */
export type StintStatus = 'active' | 'paused' | 'completed';

/**
 * Stint completion type enumeration
 * Indicates how the stint was completed
 */
export type CompletionType = 'manual' | 'auto' | 'interrupted';

/**
 * Standard result type for database operations
 */
export interface Result<T> {
  data: T | null
  error: Error | null
}

/**
 * Conflict error for concurrent stint creation
 */
export interface ConflictError {
  code: 'CONFLICT'
  existingStint: StintRow | null
  message: string
}

/**
 * Result type that handles conflict scenarios
 */
export type StintConflictResult
  = | { error: ConflictError, data: null }
    | { error: null, data: StintRow };

// ============================================================================
// Database Row Types
// ============================================================================

/**
 * Complete stint record from database
 * Maps 1:1 with stints table schema
 */
export interface StintRow {
  id: string
  user_id: string
  project_id: string
  status: StintStatus
  planned_duration: number // minutes
  started_at: string // ISO 8601 timestamp
  paused_at: string | null // ISO 8601 timestamp
  completed_at: string | null // ISO 8601 timestamp
  paused_duration: number | null // cumulative minutes paused
  completion_type: CompletionType | null
  notes: string | null
  created_at: string // ISO 8601 timestamp
  updated_at: string // ISO 8601 timestamp
}

/**
 * Project record (relevant fields only)
 */
export interface ProjectRow {
  id: string
  user_id: string
  custom_stint_duration: number | null
  archived_at: string | null
}

/**
 * User profile record (relevant fields only)
 */
export interface UserProfileRow {
  id: string
  version: number
}

// ============================================================================
// Operation Input Types
// ============================================================================

/**
 * Start Stint Input
 * Operation: Create a new active stint for a project
 */
export interface StartStintInput {
  projectId: string // UUID of the project
  plannedDurationMinutes?: number // Optional override for planned duration (5-480)
  notes?: string // Optional notes (max 500 chars)
}

/**
 * Complete (Stop) Stint Input
 * Operation: Manually complete an active or paused stint
 */
export interface CompleteStintInput {
  stintId: string // UUID of the stint to complete
  notes?: string // Optional completion notes (max 500 chars)
}

/**
 * Pause Stint Input
 * Operation: Pause an active stint
 */
export interface PauseStintInput {
  stintId: string // UUID of the stint to pause
}

/**
 * Resume Stint Input
 * Operation: Resume a paused stint
 */
export interface ResumeStintInput {
  stintId: string // UUID of the stint to resume
}

/**
 * Sync Check Input
 * Operation: Get server-calculated remaining time for timer drift correction
 */
export interface SyncCheckInput {
  stintId: string // UUID of the stint to sync
}

/**
 * List Stints Input
 * Operation: Query stints with optional filters
 */
export interface ListStintsInput {
  projectId?: string // Filter by project
  activeOnly?: boolean // Only return active/paused stints
}

// ============================================================================
// Operation Output Types
// ============================================================================

/**
 * Start Stint Output
 * Returns: Newly created stint or conflict error
 */
export type StartStintOutput = StintConflictResult;

/**
 * Complete Stint Output
 * Returns: Completed stint record
 */
export type CompleteStintOutput = Result<StintRow>;

/**
 * Pause Stint Output
 * Returns: Updated stint record with paused status
 */
export type PauseStintOutput = Result<StintRow>;

/**
 * Resume Stint Output
 * Returns: Updated stint record with active status
 */
export type ResumeStintOutput = Result<StintRow>;

/**
 * Get Active Stint Output
 * Returns: Current active/paused stint or null
 */
export type GetActiveStintOutput = Result<StintRow | null>;

/**
 * List Stints Output
 * Returns: Array of stint records
 */
export type ListStintsOutput = Result<StintRow[]>;

/**
 * Sync Check Output
 * Returns: Server-calculated remaining time and drift information
 */
export interface SyncCheckOutput {
  stintId: string
  status: StintStatus
  remainingSeconds: number // Server-calculated remaining time
  serverTimestamp: string // ISO 8601 timestamp for drift calculation
  driftSeconds?: number // Client vs server time drift (if provided)
}

export type SyncCheckResult = Result<SyncCheckOutput>;

/**
 * Auto-Complete Summary Output
 * Returns: Summary of auto-completion cron job execution
 */
export interface AutoCompleteSummary {
  completedCount: number
  errorCount: number
  completedStintIds: string[]
  errors?: Array<{ stintId: string, error: string }>
  executedAt: string // ISO 8601 timestamp
}

// ============================================================================
// Validation Error Types
// ============================================================================

/**
 * Validation error from Zod schema
 */
export interface ValidationError {
  field: string
  message: string
}

/**
 * Validation result with multiple possible errors
 */
export interface ValidationResult {
  success: boolean
  errors?: ValidationError[]
}

// ============================================================================
// Database Layer Function Signatures
// ============================================================================

/**
 * Database layer function signatures
 * Implemented in app/lib/supabase/stints.ts
 */
export interface StintDatabaseLayer {
  /**
   * Start a new stint with validation and conflict detection
   *
   * @param client - Typed Supabase client
   * @param projectId - UUID of the project
   * @param plannedDurationMinutes - Optional duration override
   * @param notes - Optional stint notes
   * @returns Created stint or conflict error
   */
  startStint(
    client: any, // TypedSupabaseClient
    projectId: string,
    plannedDurationMinutes?: number,
    notes?: string,
  ): Promise<StartStintOutput>

  /**
   * Complete (stop) an active or paused stint manually
   *
   * @param client - Typed Supabase client
   * @param stintId - UUID of the stint to complete
   * @param notes - Optional completion notes
   * @returns Completed stint record
   */
  completeStint(
    client: any,
    stintId: string,
    completionType: CompletionType,
    notes?: string | null,
  ): Promise<CompleteStintOutput>

  /**
   * Pause an active stint
   *
   * @param client - Typed Supabase client
   * @param stintId - UUID of the stint to pause
   * @returns Updated stint record
   */
  pauseStint(
    client: any,
    stintId: string,
  ): Promise<PauseStintOutput>

  /**
   * Resume a paused stint
   *
   * @param client - Typed Supabase client
   * @param stintId - UUID of the stint to resume
   * @returns Updated stint record
   */
  resumeStint(
    client: any,
    stintId: string,
  ): Promise<ResumeStintOutput>

  /**
   * Get the user's current active or paused stint
   *
   * @param client - Typed Supabase client
   * @returns Active/paused stint or null
   */
  getActiveStint(
    client: any,
  ): Promise<GetActiveStintOutput>

  /**
   * List stints with optional filters
   *
   * @param client - Typed Supabase client
   * @param options - Filter options
   * @returns Array of stint records
   */
  listStints(
    client: any,
    options?: ListStintsInput,
  ): Promise<ListStintsOutput>

  /**
   * Sync client timer with server-calculated remaining time
   *
   * @param client - Typed Supabase client
   * @param stintId - UUID of the stint to sync
   * @returns Server-calculated remaining time and metadata
   */
  syncStintCheck(
    client: any,
    stintId: string,
  ): Promise<SyncCheckResult>
}

// ============================================================================
// Composable Layer Function Signatures (TanStack Query)
// ============================================================================

/**
 * Composable layer mutation/query signatures
 * Implemented in app/composables/useStints.ts
 */
export interface StintComposables {
  /**
   * Query hook: Get current active/paused stint
   *
   * @returns TanStack Query result with active stint or null
   */
  useActiveStintQuery(): {
    data: StintRow | null
    isLoading: boolean
    error: Error | null
    refetch: () => void
  }

  /**
   * Query hook: List stints with optional filters
   *
   * @param options - Filter options
   * @returns TanStack Query result with stint list
   */
  useStintsQuery(options?: ListStintsInput): {
    data: StintRow[]
    isLoading: boolean
    error: Error | null
    refetch: () => void
  }

  /**
   * Mutation hook: Start a new stint
   *
   * @returns TanStack Query mutation for starting stints
   */
  useStartStint(): {
    mutate: (input: StartStintInput) => void
    mutateAsync: (input: StartStintInput) => Promise<StintRow>
    isLoading: boolean
    error: Error | ConflictError | null
    reset: () => void
  }

  /**
   * Mutation hook: Complete a stint manually
   *
   * @returns TanStack Query mutation for completing stints
   */
  useCompleteStint(): {
    mutate: (input: CompleteStintInput) => void
    mutateAsync: (input: CompleteStintInput) => Promise<StintRow>
    isLoading: boolean
    error: Error | null
    reset: () => void
  }

  /**
   * Mutation hook: Pause an active stint
   *
   * @returns TanStack Query mutation for pausing stints
   */
  usePauseStint(): {
    mutate: (input: PauseStintInput) => void
    mutateAsync: (input: PauseStintInput) => Promise<StintRow>
    isLoading: boolean
    error: Error | null
    reset: () => void
  }

  /**
   * Mutation hook: Resume a paused stint
   *
   * @returns TanStack Query mutation for resuming stints
   */
  useResumeStint(): {
    mutate: (input: ResumeStintInput) => void
    mutateAsync: (input: ResumeStintInput) => Promise<StintRow>
    isLoading: boolean
    error: Error | null
    reset: () => void
  }

  /**
   * Mutation hook: Sync timer with server time
   *
   * @returns TanStack Query mutation for timer sync
   */
  useSyncStintCheck(): {
    mutate: (input: SyncCheckInput) => void
    mutateAsync: (input: SyncCheckInput) => Promise<SyncCheckOutput>
    isLoading: boolean
    error: Error | null
    reset: () => void
  }
}

// ============================================================================
// PostgreSQL RPC Function Contracts
// ============================================================================

/**
 * validate_stint_start RPC function result
 */
export interface ValidateStintStartResult {
  can_start: boolean
  existing_stint_id: string | null
  conflict_message: string | null
}

/**
 * auto_complete_expired_stints RPC function result
 */
export interface AutoCompleteResult {
  completed_count: number
  error_count: number
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Stint validation constraints
 * Must match values in app/schemas/stints.ts
 */
export const STINT_CONSTRAINTS = {
  MIN_DURATION: 5, // minutes
  MAX_DURATION: 480, // minutes (8 hours)
  DEFAULT_DURATION: 120, // minutes (2 hours)
  MAX_TOTAL_DURATION: 240, // minutes (4 hours)
  MAX_NOTES_LENGTH: 500, // characters
} as const;

/**
 * Query cache keys for TanStack Query
 */
export const STINT_QUERY_KEYS = {
  all: ['stints'] as const,
  lists: () => [...STINT_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: ListStintsInput) => [...STINT_QUERY_KEYS.lists(), filters] as const,
  detail: (id: string) => [...STINT_QUERY_KEYS.all, 'detail', id] as const,
  active: () => [...STINT_QUERY_KEYS.all, 'active'] as const,
} as const;
