-- Migration: Update auto-completion cron interval
-- Date: 2026-01-26
-- Description: Updates the pg_cron auto-complete job from every 2 minutes to every 1 minute.
--              pg_cron supports a minimum interval of 1 minute, which reduces the maximum
--              delay for auto-completing stints, improving user experience.
--
-- Related: Issue #26

-- ============================================================================
-- Update Auto-Completion Cron Schedule
-- ============================================================================
-- Change from */2 * * * * (every 2 minutes) to * * * * * (every 1 minute)

DO $$
BEGIN
  -- Unschedule the existing job
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'auto-complete-stints'
  ) THEN
    PERFORM cron.unschedule('auto-complete-stints');
    RAISE NOTICE 'Unscheduled existing auto-complete-stints cron job';
  END IF;

  -- Reschedule with 1-minute interval
  PERFORM cron.schedule(
    'auto-complete-stints',
    '* * * * *',  -- Every 1 minute (pg_cron minimum interval)
    $job$ SELECT auto_complete_expired_stints(); $job$
  );

  RAISE NOTICE 'Scheduled auto-complete-stints cron job (now runs every 1 minute)';
END $$;

-- ============================================================================
-- Verification Query
-- ============================================================================
-- To verify the cron job schedule was updated, run:
--
-- SELECT jobid, jobname, schedule, active
-- FROM cron.job
-- WHERE jobname = 'auto-complete-stints';
--
-- Expected output:
-- jobid | jobname              | schedule  | active
-- ------+----------------------+-----------+--------
--     X | auto-complete-stints | * * * * * | t
