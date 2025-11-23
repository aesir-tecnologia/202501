-- Migration: Remove Deprecated Stint Fields
-- Removes backward-compatibility fields that have been replaced:
-- - is_completed (replaced by status enum: 'active', 'paused', 'completed', 'interrupted')
-- - duration_minutes (replaced by actual_duration in seconds)
--
-- These fields were marked as deprecated in migration 20251029223752
-- and are no longer used by the application layer.

-- Remove deprecated is_completed column (replaced by status enum)
ALTER TABLE public.stints
DROP COLUMN IF EXISTS is_completed;

-- Remove deprecated duration_minutes column (replaced by actual_duration in seconds)
ALTER TABLE public.stints
DROP COLUMN IF EXISTS duration_minutes;

-- Add comments documenting the migration
COMMENT ON TABLE public.stints IS
  'Stint tracking table. Uses status enum (active/paused/completed/interrupted) and actual_duration (seconds) as of migration 20251122000002';
