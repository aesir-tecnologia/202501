-- Migration: Add auto-completion function for expired stints
-- Date: 2025-11-20
-- Description: Creates the auto_complete_expired_stints() PostgreSQL function
--              that automatically completes stints when their planned duration expires.
--              This replaces the stint-auto-complete Edge Function with a server-side
--              PostgreSQL function that can be triggered by pg_cron or external scheduler.

-- ============================================================================
-- Function: auto_complete_expired_stints
-- ============================================================================
-- Purpose: Find and complete all active stints that have exceeded their planned duration
-- Returns: Summary of completed and failed completions
-- Trigger: Intended to run via pg_cron every 2 minutes
-- Security: SECURITY DEFINER to bypass RLS policies for cron execution

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
  -- Find all active stints where planned duration has expired
  -- Formula: started_at + planned_duration (minutes) <= now()
  FOR v_stint_record IN
    SELECT id, user_id, project_id, started_at, planned_duration
    FROM stints
    WHERE status = 'active'
      AND planned_duration IS NOT NULL
      AND started_at IS NOT NULL
      AND (started_at + (planned_duration || ' minutes')::interval) <= now()
    ORDER BY started_at ASC -- Complete oldest stints first
  LOOP
    BEGIN
      -- Call complete_stint RPC with completion_type='auto'
      -- This ensures all business logic and validation is preserved
      PERFORM complete_stint(v_stint_record.id, 'auto', NULL);

      v_completed_count := v_completed_count + 1;

      -- Log success for monitoring
      RAISE NOTICE 'Auto-completed stint % for user % (project: %, started: %)',
        v_stint_record.id,
        v_stint_record.user_id,
        v_stint_record.project_id,
        v_stint_record.started_at;

    EXCEPTION WHEN OTHERS THEN
      -- Catch and log errors but continue processing other stints
      v_error_count := v_error_count + 1;

      RAISE WARNING 'Failed to auto-complete stint %: % (SQLSTATE: %)',
        v_stint_record.id,
        SQLERRM,
        SQLSTATE;
    END;
  END LOOP;

  -- Return summary for monitoring and logging
  RETURN QUERY SELECT v_completed_count, v_error_count;
END;
$$;

-- ============================================================================
-- Permissions
-- ============================================================================
-- Grant EXECUTE permission to authenticated users (for testing)
-- In production, this will be called by pg_cron or external scheduler

GRANT EXECUTE ON FUNCTION auto_complete_expired_stints() TO authenticated;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION auto_complete_expired_stints() IS
'Automatically completes active stints that have exceeded their planned duration.
Intended to be called by pg_cron every 2 minutes or by external scheduler.
Returns summary of completed stints and any errors encountered.
Uses SECURITY DEFINER to bypass RLS for automated execution.';

-- ============================================================================
-- Testing Notes
-- ============================================================================
-- To test manually:
--
-- 1. Create a test stint with short duration that's already expired:
--    INSERT INTO stints (user_id, project_id, status, planned_duration, started_at)
--    VALUES (
--      auth.uid(),
--      'your-project-id',
--      'active',
--      1, -- 1 minute
--      now() - interval '5 minutes' -- Started 5 minutes ago (already expired)
--    );
--
-- 2. Run the auto-completion function:
--    SELECT * FROM auto_complete_expired_stints();
--
-- 3. Expected result:
--    completed_count | error_count
--    ----------------+-------------
--                  1 |           0
--
-- 4. Verify stint is completed:
--    SELECT id, status, completion_type, completed_at
--    FROM stints
--    WHERE status = 'completed' AND completion_type = 'auto'
--    ORDER BY completed_at DESC
--    LIMIT 5;

-- ============================================================================
-- Scheduling with pg_cron (if available)
-- ============================================================================
-- To schedule with pg_cron (requires pg_cron extension):
--
-- SELECT cron.schedule(
--   'auto-complete-stints',
--   '*/2 * * * *', -- Every 2 minutes
--   $$ SELECT auto_complete_expired_stints(); $$
-- );
--
-- To check scheduled jobs:
-- SELECT * FROM cron.job WHERE jobname = 'auto-complete-stints';
--
-- To unschedule:
-- SELECT cron.unschedule('auto-complete-stints');

-- ============================================================================
-- Alternative Scheduling (if pg_cron is not available)
-- ============================================================================
-- 1. External Cron Job (Linux/Mac):
--    Create a cron job that calls the Supabase API:
--    */2 * * * * curl -X POST https://your-project.supabase.co/rest/v1/rpc/auto_complete_expired_stints \
--                     -H "apikey: your-service-role-key" \
--                     -H "Authorization: Bearer your-service-role-key"
--
-- 2. GitHub Actions (for hosted projects):
--    Create a scheduled workflow that runs every 2 minutes
--
-- 3. Supabase Platform Cron (if supported):
--    Use Supabase dashboard to create a scheduled function call
