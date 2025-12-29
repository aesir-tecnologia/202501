/**
 * Stint Operations API Contract
 *
 * This file defines the TypeScript contracts for stint operations
 * related to the Pause and Switch feature.
 *
 * These contracts are used by:
 * - app/schemas/stints.ts (Zod validation)
 * - app/composables/useStints.ts (TanStack Query mutations)
 * - app/lib/supabase/stints.ts (Database operations)
 */

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Stint status values (unchanged)
 */
export type StintStatus = 'active' | 'paused' | 'completed' | 'interrupted';

/**
 * Completion type values (NO CHANGES)
 * Stopping a paused stint reuses 'interrupted' — same semantic action.
 */
export type CompletionType = 'manual' | 'auto' | 'interrupted';

// =============================================================================
// INPUT CONTRACTS
// =============================================================================

/**
 * Input for starting a new stint (unchanged structure, new behavior)
 *
 * Behavior change: Now allows starting when a paused stint exists,
 * resulting in 1 active + 1 paused stint.
 */
export interface StartStintInput {
  /** UUID of the project to start stint for */
  projectId: string;
  /** Planned duration in minutes (5-480) */
  plannedDurationMinutes?: number;
  /** Optional notes (max 500 chars) */
  notes?: string;
}

/**
 * Input for resuming a paused stint (unchanged structure, new validation)
 *
 * Validation change: Now checks that no active stint exists before resuming.
 */
export interface ResumeStintInput {
  /** UUID of the paused stint to resume */
  stintId: string;
}

// =============================================================================
// OUTPUT CONTRACTS
// =============================================================================

/**
 * Standard stint row returned from database operations
 */
export interface StintRow {
  id: string;
  userId: string;
  projectId: string;
  status: StintStatus;
  plannedDuration: number | null;
  actualDuration: number | null;
  pausedDuration: number;
  pausedAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  completionType: CompletionType | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Validation result for stint start operation (MODIFIED)
 *
 * Change: Now returns existing paused stint info for conflict dialog.
 *
 * IMPORTANT: The UI layer must check BOTH canStart AND existingStintStatus:
 * - canStart=false + existingStintStatus='active' → BLOCKED, must pause/complete first
 * - canStart=true + existingStintStatus='paused' → ALLOWED but show conflict dialog
 * - canStart=true + existingStintStatus=null → ALLOWED, no dialog needed
 */
export interface ValidateStintStartResult {
  /** Whether the stint can be started (false only if ACTIVE stint exists) */
  canStart: boolean;
  /** ID of existing active OR paused stint (if any) */
  existingStintId: string | null;
  /** Status of existing stint ('active' or 'paused') */
  existingStintStatus: StintStatus | null;
  /** User-friendly message (conflict for active, info for paused) */
  conflictMessage: string | null;
}

/**
 * Conflict error with existing stint details (NEW)
 *
 * Thrown when user tries to start a stint while another is active (BLOCKING).
 */
export interface StintConflictError extends Error {
  code: 'ACTIVE_STINT_CONFLICT';
  /** Details of the blocking active stint */
  existingStint: {
    id: string;
    status: 'active';
    projectId: string;
    projectName: string;
    remainingSeconds: number;
  };
}

/**
 * Paused stint info returned when starting a stint is allowed but
 * a paused stint exists (NON-BLOCKING, for UI dialog).
 *
 * This is NOT an error - the stint CAN be started, but UI should
 * show a dialog to inform user about the paused stint.
 */
export interface PausedStintInfo {
  code: 'PAUSED_STINT_EXISTS';
  /** Details of the existing paused stint */
  pausedStint: {
    id: string;
    status: 'paused';
    projectId: string;
    projectName: string;
    remainingSeconds: number;
  };
}

// =============================================================================
// CONFLICT RESOLUTION CONTRACTS (NEW)
// =============================================================================

/**
 * Options available in the conflict resolution dialog.
 *
 * The available actions depend on the existing stint's status:
 *
 * EXISTING = ACTIVE:
 *   - 'pause-and-switch': Pause active stint, start new one
 *   - 'complete-and-start': Complete active stint, start new one
 *   - 'cancel': Close dialog
 *
 * EXISTING = PAUSED:
 *   - 'start-alongside': Start new stint, keep paused stint as-is
 *   - 'complete-paused-and-start': Complete paused stint, start new one
 *   - 'resume-paused': Resume paused stint instead of starting new
 *   - 'cancel': Close dialog
 */
export type ConflictResolutionAction =
  // For ACTIVE existing stint
  | 'pause-and-switch'           // Pause active → start new
  | 'complete-active-and-start'  // Complete active → start new
  // For PAUSED existing stint
  | 'start-alongside'            // Keep paused, start new alongside
  | 'complete-paused-and-start'  // Complete paused → start new
  | 'resume-paused'              // Resume paused instead
  // Universal
  | 'cancel';                    // Close without action

/**
 * Props for the StintConflictDialog component
 *
 * Dialog behavior changes based on existingStint.status:
 * - 'active': Shows pause/complete options, primary = "Pause & Switch"
 * - 'paused': Shows alongside/complete/resume options, primary = "Start New Stint"
 */
export interface StintConflictDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Details of the existing stint causing conflict */
  existingStint: {
    id: string;
    status: 'active' | 'paused';
    projectId: string;
    projectName: string;
    remainingSeconds: number;
  };
  /** Name of the project user wants to start stint for */
  newProjectName: string;
  /** Whether a mutation is in progress */
  isPending?: boolean;
}

/**
 * Events emitted by the StintConflictDialog component
 */
export interface StintConflictDialogEmits {
  /** Dialog open state changed */
  (event: 'update:open', value: boolean): void;
  /** User selected a resolution action */
  (event: 'resolve', action: ConflictResolutionAction): void;
}

// =============================================================================
// COMPOSABLE CONTRACTS
// =============================================================================

/**
 * Return type for usePausedStintQuery (NEW)
 */
export interface UsePausedStintQueryReturn {
  /** The paused stint, or null if none exists */
  data: StintRow | null;
  /** Whether the query is loading */
  isLoading: boolean;
  /** Error if query failed */
  error: Error | null;
}

/**
 * Result of attempting to start a stint (NEW)
 *
 * Three possible outcomes:
 * 1. SUCCESS: Stint started, returns the new stint
 * 2. BLOCKED: Active stint exists, returns conflict error
 * 3. PAUSED_EXISTS: Paused stint exists but start is allowed,
 *    returns both the new stint AND paused stint info for UI
 */
export type StartStintResult =
  | { success: true; stint: StintRow; pausedStintInfo: null }
  | { success: true; stint: StintRow; pausedStintInfo: PausedStintInfo }
  | { success: false; error: StintConflictError };

/**
 * Enhanced return type for useStartStint mutation hook (MODIFIED)
 *
 * The hook now supports two modes:
 *
 * 1. SIMPLE MODE (default): Throws on active conflict, silently starts
 *    alongside paused stints. Use this if you don't need the conflict dialog.
 *
 * 2. DIALOG MODE: Call checkConflicts() first to get conflict info,
 *    show dialog, then call startStint() with user's choice.
 */
export interface UseStartStintReturn {
  /**
   * Check for conflicts before starting (for dialog mode)
   * Returns paused stint info without starting the stint
   */
  checkConflicts: (projectId: string) => Promise<PausedStintInfo | null>;

  /**
   * Start a stint (may throw StintConflictError if active stint exists)
   * If paused stint exists and no dialog shown, starts alongside it silently
   */
  mutateAsync: (input: StartStintInput) => Promise<StintRow>;

  /** Whether mutation is in progress */
  isPending: boolean;

  /** Error if mutation failed (may be StintConflictError) */
  error: Error | StintConflictError | null;
}
