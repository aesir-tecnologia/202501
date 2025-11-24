-- Migration: Schedule auto-completion cron job
-- Date: 2025-11-20
-- Description: Sets up pg_cron extension and schedules the auto_complete_expired_stints()
--              function to run every 2 minutes for automatic stint completion.
--
-- NOTE: This migration is for LOCAL DEVELOPMENT ONLY
--       For production deployment, cron scheduling should be handled via:
--       - Supabase Platform Cron (if available)
--       - External cron job (GitHub Actions, etc.)
--       - Server-side scheduler
--
-- The pg_cron extension may not be available in all Supabase environments.

-- ============================================================================
-- Enable pg_cron Extension
-- ============================================================================
-- This extension allows PostgreSQL to schedule recurring jobs
-- Similar to Unix cron but runs within the database

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- Schedule Auto-Completion Job
-- ============================================================================
-- Runs every 2 minutes to complete expired stints
-- Only schedule if the job doesn't already exist

DO $$
BEGIN
  -- Check if the job already exists
  IF NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'auto-complete-stints'
  ) THEN
    -- Schedule the job
    PERFORM cron.schedule(
      'auto-complete-stints',
      '*/2 * * * *',  -- Every 2 minutes
      $job$ SELECT auto_complete_expired_stints(); $job$
    );

    RAISE NOTICE 'Scheduled auto-complete-stints cron job (runs every 2 minutes)';
  ELSE
    RAISE NOTICE 'auto-complete-stints cron job already exists, skipping';
  END IF;
END $$;

-- ============================================================================
-- Verification Query
-- ============================================================================
-- To verify the cron job is scheduled, run:
--
-- SELECT jobid, jobname, schedule, command, active
-- FROM cron.job
-- WHERE jobname = 'auto-complete-stints';
--
-- Expected output:
-- jobid | jobname              | schedule    | command                              | active
-- ------+----------------------+-------------+--------------------------------------+--------
--     1 | auto-complete-stints | */2 * * * * | SELECT auto_complete_expired_stints()| t

-- ============================================================================
-- Monitoring Cron Job Execution
-- ============================================================================
-- To monitor cron job execution history:
--
-- SELECT jobid, runid, job_pid, database, username, command, status,
--        return_message, start_time, end_time
-- FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-complete-stints')
-- ORDER BY start_time DESC
-- LIMIT 10;

-- ============================================================================
-- Unscheduling (for testing or removal)
-- ============================================================================
-- To unschedule the job:
--
-- SELECT cron.unschedule('auto-complete-stints');

-- ============================================================================
-- Production Deployment Notes
-- ============================================================================
-- For production, consider these alternatives:
--
-- 1. **Supabase Platform Cron** (if available):
--    Use Supabase dashboard to create a scheduled function call
--
-- 2. **GitHub Actions** (for projects hosted on GitHub):
--    Create a workflow that runs every 2 minutes:
--    ```yaml
--    name: Auto-Complete Stints
--    on:
--      schedule:
--        - cron: '*/2 * * * *'
--    jobs:
--      auto-complete:
--        runs-on: ubuntu-latest
--        steps:
--          - name: Call Auto-Complete Function
--            run: |
--              curl -X POST https://your-project.supabase.co/rest/v1/rpc/auto_complete_expired_stints \
--                   -H "apikey: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
--                   -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}"
--    ```
--
-- 3. **External Cron Job** (Linux/Mac server):
--    Add to crontab:
--    ```bash
--    */2 * * * * curl -X POST https://your-project.supabase.co/rest/v1/rpc/auto_complete_expired_stints \
--                     -H "apikey: YOUR_SERVICE_ROLE_KEY" \
--                     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
--    ```
--
-- 4. **Serverless Function** (Vercel, Netlify, etc.):
--    Deploy a scheduled serverless function that calls the Supabase RPC

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON EXTENSION pg_cron IS
'PostgreSQL cron scheduler for recurring jobs. Used to automatically complete expired stints every 2 minutes.';
