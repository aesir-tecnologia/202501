-- Migration: Schedule daily account deletion cleanup cron job
-- Supports: 007-account-deletion-backend feature
--
-- Uses pg_net to invoke the process-account-deletions Edge Function daily.
-- The Edge Function handles two phases:
--   Phase 1: Permanently delete accounts past the 30-day grace period
--   Phase 2: Send 7-day reminder emails to users approaching deletion

-- ============================================================================
-- Enable pg_net Extension
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============================================================================
-- Cron Job: deletion-cleanup-job
-- ============================================================================

SELECT cron.unschedule('deletion-cleanup-job')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'deletion-cleanup-job'
);

-- Schedule daily at 03:00 UTC (low-traffic window)
SELECT cron.schedule(
  'deletion-cleanup-job',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/process-account-deletions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := jsonb_build_object('triggered_at', now()),
    timeout_milliseconds := 30000
  ) AS request_id;
  $$
);
