-- Migration: Add deletion_requested_at column to user_profiles
-- Supports: Account deletion feature (soft-delete request tracking)

-- ============================================================================
-- Add deletion_requested_at column
-- ============================================================================

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- ============================================================================
-- Partial index for pending deletion queries
-- ============================================================================

CREATE INDEX idx_user_profiles_deletion_pending
ON public.user_profiles (deletion_requested_at)
WHERE deletion_requested_at IS NOT NULL;

COMMENT ON COLUMN public.user_profiles.deletion_requested_at IS
  'Timestamp when user requested account deletion. NULL means no pending request.';
