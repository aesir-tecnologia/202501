-- ============================================================================
-- Database Function Contracts for Stint Operations
-- ============================================================================
--
-- This file documents the PostgreSQL RPC function signatures and behaviors
-- used by the stint operations migration. These functions are EXISTING and
-- will NOT be modified during the migration (except auto_complete_expired_stints
-- which is NEW).
--
-- All functions enforce:
-- 1. User authentication via RLS policies
-- 2. Ownership verification (stint belongs to user)
-- 3. State transition validation
-- 4. Atomic operations with proper error handling

-- ============================================================================
-- validate_stint_start
-- ============================================================================
-- Purpose: Validate that a user can start a new stint
-- Used by: startStint() in app/lib/supabase/stints.ts
-- Status: EXISTING (no changes)
--
-- Checks:
-- 1. No active or paused stints exist for user
-- 2. User version matches (optimistic locking)
--
-- Returns:
-- - can_start: true if validation passed
-- - existing_stint_id: UUID of conflicting stint (if any)
-- - conflict_message: User-friendly error message (if conflict)

CREATE OR REPLACE FUNCTION validate_stint_start(
  p_user_id uuid,
  p_project_id uuid,
  p_version integer
)
RETURNS TABLE (
  can_start boolean,
  existing_stint_id uuid,
  conflict_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Implementation exists in database
  -- This is a contract specification only
END;
$$;

-- Example usage:
-- SELECT * FROM validate_stint_start(
--   '550e8400-e29b-41d4-a716-446655440000',
--   '650e8400-e29b-41d4-a716-446655440001',
--   5
-- );
--
-- Example result (success):
-- can_start | existing_stint_id | conflict_message
-- ----------|-------------------|------------------
-- true      | null              | null
--
-- Example result (conflict):
-- can_start | existing_stint_id                    | conflict_message
-- ----------|--------------------------------------|----------------------------------
-- false     | 750e8400-e29b-41d4-a716-446655440002 | An active stint already exists

-- ============================================================================
-- pause_stint
-- ============================================================================
-- Purpose: Pause an active stint
-- Used by: pauseStint() in app/lib/supabase/stints.ts
-- Status: EXISTING (no changes)
--
-- Validations:
-- 1. Stint exists
-- 2. Stint belongs to user (via RLS)
-- 3. Stint status = 'active'
--
-- Updates:
-- 1. Set paused_at = now()
-- 2. Set status = 'paused'
--
-- Returns: Complete updated stint record
-- Errors:
-- - "Stint not found" if invalid ID
-- - "Stint is not active and cannot be paused" if wrong status

CREATE OR REPLACE FUNCTION pause_stint(
  p_stint_id uuid
)
RETURNS stints
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Implementation exists in database
  -- This is a contract specification only
END;
$$;

-- Example usage:
-- SELECT * FROM pause_stint('750e8400-e29b-41d4-a716-446655440002');
--
-- Example result:
-- Returns entire stint record with:
-- - status = 'paused'
-- - paused_at = '2025-11-20T15:30:00Z'
-- - (other fields unchanged)

-- ============================================================================
-- resume_stint
-- ============================================================================
-- Purpose: Resume a paused stint
-- Used by: resumeStint() in app/lib/supabase/stints.ts
-- Status: EXISTING (no changes)
--
-- Validations:
-- 1. Stint exists
-- 2. Stint belongs to user (via RLS)
-- 3. Stint status = 'paused'
--
-- Updates:
-- 1. Calculate pause duration: now() - paused_at
-- 2. Add to paused_duration (cumulative)
-- 3. Clear paused_at (set to null)
-- 4. Set status = 'active'
--
-- Returns: Complete updated stint record
-- Errors:
-- - "Stint not found" if invalid ID
-- - "Stint is not paused and cannot be resumed" if wrong status

CREATE OR REPLACE FUNCTION resume_stint(
  p_stint_id uuid
)
RETURNS stints
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Implementation exists in database
  -- This is a contract specification only
END;
$$;

-- Example usage:
-- SELECT * FROM resume_stint('750e8400-e29b-41d4-a716-446655440002');
--
-- Example result:
-- Returns entire stint record with:
-- - status = 'active'
-- - paused_at = null
-- - paused_duration = 15 (if paused for 15 minutes)
-- - (other fields unchanged)

-- ============================================================================
-- complete_stint
-- ============================================================================
-- Purpose: Complete (stop) an active or paused stint
-- Used by: completeStint() in app/lib/supabase/stints.ts
-- Status: EXISTING (no changes)
--
-- Validations:
-- 1. Stint exists
-- 2. Stint belongs to user (via RLS)
-- 3. Stint status IN ('active', 'paused')
--
-- Updates:
-- 1. If status = 'paused', finalize paused_duration
-- 2. Set completed_at = now()
-- 3. Set completion_type (manual/auto/interrupted)
-- 4. Set notes if provided
-- 5. Set status = 'completed'
--
-- Returns: Complete updated stint record
-- Errors:
-- - "Stint not found" if invalid ID
-- - "Stint is not active or paused and cannot be completed" if wrong status

CREATE OR REPLACE FUNCTION complete_stint(
  p_stint_id uuid,
  p_completion_type text, -- 'manual' | 'auto' | 'interrupted'
  p_notes text DEFAULT NULL
)
RETURNS stints
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Implementation exists in database
  -- This is a contract specification only
END;
$$;

-- Example usage:
-- SELECT * FROM complete_stint(
--   '750e8400-e29b-41d4-a716-446655440002',
--   'manual',
--   'Great progress on feature X'
-- );
--
-- Example result:
-- Returns entire stint record with:
-- - status = 'completed'
-- - completed_at = '2025-11-20T17:45:00Z'
-- - completion_type = 'manual'
-- - notes = 'Great progress on feature X'
-- - (other fields set appropriately)

-- ============================================================================
-- auto_complete_expired_stints (NEW)
-- ============================================================================
-- Purpose: Auto-complete active stints that have exceeded their planned duration
-- Used by: PostgreSQL cron job (every 2 minutes)
-- Status: NEW (created during migration)
--
-- Algorithm:
-- 1. Find all active stints where: started_at + planned_duration <= now()
-- 2. For each expired stint:
--    - Call complete_stint(stint_id, 'auto', NULL)
--    - Log errors but continue processing others
-- 3. Return summary counts
--
-- Returns:
-- - completed_count: Number of successfully completed stints
-- - error_count: Number of stints that failed to complete
--
-- Error Handling:
-- - Individual stint failures logged as warnings
-- - Do NOT abort entire batch on single failure
-- - Return counts of both successes and failures

CREATE OR REPLACE FUNCTION auto_complete_expired_stints()
RETURNS TABLE (
  completed_count integer,
  error_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_completed_count integer := 0;
  v_error_count integer := 0;
  v_stint_record RECORD;
BEGIN
  -- Find all active stints that have exceeded their planned duration
  FOR v_stint_record IN
    SELECT
      id,
      user_id,
      started_at,
      planned_duration,
      status
    FROM stints
    WHERE status = 'active'
      AND planned_duration IS NOT NULL
      AND started_at IS NOT NULL
      AND (started_at + (planned_duration || ' minutes')::interval) <= now()
  LOOP
    BEGIN
      -- Attempt to complete the stint
      PERFORM complete_stint(
        v_stint_record.id,
        'auto',
        NULL
      );

      -- Increment success counter
      v_completed_count := v_completed_count + 1;

      -- Log success
      RAISE NOTICE 'Auto-completed stint % for user %',
        v_stint_record.id,
        v_stint_record.user_id;

    EXCEPTION WHEN OTHERS THEN
      -- Increment error counter
      v_error_count := v_error_count + 1;

      -- Log error but continue processing
      RAISE WARNING 'Failed to auto-complete stint %: %',
        v_stint_record.id,
        SQLERRM;
    END;
  END LOOP;

  -- Return summary
  RETURN QUERY SELECT v_completed_count, v_error_count;
END;
$$;

-- Example usage (manual trigger for testing):
-- SELECT * FROM auto_complete_expired_stints();
--
-- Example result:
-- completed_count | error_count
-- ----------------|--------------
-- 3               | 0
--
-- Cron schedule (pg_cron):
-- SELECT cron.schedule(
--   'auto-complete-stints',      -- Job name
--   '*/2 * * * *',                -- Every 2 minutes
--   $$ SELECT auto_complete_expired_stints(); $$
-- );

-- ============================================================================
-- Supporting Queries (Not Functions)
-- ============================================================================

-- Query: Get user's active or paused stint
-- Used by: getActiveStint() in app/lib/supabase/stints.ts
-- RLS enforces user_id = auth.uid()
--
-- SELECT *
-- FROM stints
-- WHERE user_id = auth.uid()
--   AND status IN ('active', 'paused')
-- LIMIT 1;

-- Query: Get user version for optimistic locking
-- Used by: startStint() in app/lib/supabase/stints.ts
-- RLS enforces user_id = auth.uid()
--
-- SELECT version
-- FROM user_profiles
-- WHERE id = auth.uid();

-- Query: Get project for stint start validation
-- Used by: startStint() in app/lib/supabase/stints.ts
-- RLS enforces user_id = auth.uid()
--
-- SELECT id, custom_stint_duration, archived_at
-- FROM projects
-- WHERE id = $1
--   AND user_id = auth.uid()
--   AND archived_at IS NULL;

-- ============================================================================
-- Database Constraints (Existing)
-- ============================================================================

-- Check: planned_duration must be positive
-- ALTER TABLE stints
-- ADD CONSTRAINT check_planned_duration_positive
-- CHECK (planned_duration > 0);

-- Check: paused_duration cannot exceed planned_duration
-- ALTER TABLE stints
-- ADD CONSTRAINT check_paused_duration_valid
-- CHECK (paused_duration IS NULL OR paused_duration <= planned_duration);

-- Check: completed stints must have completed_at
-- ALTER TABLE stints
-- ADD CONSTRAINT check_completed_at_required
-- CHECK (
--   (status = 'completed' AND completed_at IS NOT NULL) OR
--   (status != 'completed' AND completed_at IS NULL)
-- );

-- Check: paused stints must have paused_at
-- ALTER TABLE stints
-- ADD CONSTRAINT check_paused_at_required
-- CHECK (
--   (status = 'paused' AND paused_at IS NOT NULL) OR
--   (status != 'paused' AND paused_at IS NULL)
-- );

-- Unique: Only one active/paused stint per user
-- CREATE UNIQUE INDEX idx_one_active_stint_per_user
-- ON stints (user_id)
-- WHERE status IN ('active', 'paused');

-- ============================================================================
-- Row Level Security (RLS) Policies (Existing)
-- ============================================================================

-- Policy: Users can only select their own stints
-- CREATE POLICY stints_select_own
-- ON stints FOR SELECT
-- USING (user_id = auth.uid());

-- Policy: Users can only insert stints for themselves
-- CREATE POLICY stints_insert_own
-- ON stints FOR INSERT
-- WITH CHECK (user_id = auth.uid());

-- Policy: Users can only update their own stints
-- CREATE POLICY stints_update_own
-- ON stints FOR UPDATE
-- USING (user_id = auth.uid())
-- WITH CHECK (user_id = auth.uid());

-- Policy: Users can only delete their own stints
-- CREATE POLICY stints_delete_own
-- ON stints FOR DELETE
-- USING (user_id = auth.uid());

-- ============================================================================
-- Migration Plan for Database Functions
-- ============================================================================

-- Phase 1: Verify existing functions (no changes needed)
-- - validate_stint_start: Already exists, tested, working
-- - pause_stint: Already exists, tested, working
-- - resume_stint: Already exists, tested, working
-- - complete_stint: Already exists, tested, working

-- Phase 2: Create new auto-completion function
-- Migration file: supabase/migrations/[timestamp]_add_auto_complete_function.sql
--
-- 1. Create auto_complete_expired_stints() function
-- 2. Test manual execution
-- 3. Set up pg_cron job (if available) or document alternative scheduling

-- Phase 3: Verify RLS policies (no changes needed)
-- - All existing policies remain unchanged
-- - Client-side code inherits same security model as edge functions

-- Phase 4: Remove edge function cleanup (post-migration)
-- - No database changes required
-- - Edge functions are external to database
