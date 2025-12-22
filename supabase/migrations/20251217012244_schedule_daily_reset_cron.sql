-- Migration: Schedule daily reset cron job
-- Supports: 005-daily-reset feature
--
-- Schedules an hourly cron job that calls process_daily_reset() to aggregate
-- daily summaries for users whose local midnight has passed.

-- ============================================================================
-- Cron Job: daily-reset-job
-- ============================================================================

-- Remove existing job if present (for idempotency during development)
SELECT cron.unschedule('daily-reset-job')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-reset-job'
);

-- Schedule hourly job at :00
-- This catches all timezone boundaries within 1 hour
SELECT cron.schedule(
  'daily-reset-job',           -- Job name
  '0 * * * *',                 -- Every hour at :00
  $$ SELECT process_daily_reset(); $$
);

-- ============================================================================
-- Verification Query (for manual testing)
-- ============================================================================

-- To verify the job was created:
-- SELECT jobid, jobname, schedule FROM cron.job WHERE jobname = 'daily-reset-job';

-- To check recent job runs:
-- SELECT * FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-reset-job')
-- ORDER BY start_time DESC
-- LIMIT 10;
