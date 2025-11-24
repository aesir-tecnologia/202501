-- Migration: Add Missing Stint Indexes
-- Adds indexes documented in schema but missing from implementation
-- Improves query performance for timeline and project-based queries

-- Drop existing index without DESC ordering
DROP INDEX IF EXISTS idx_stints_user_started;

-- Create user timeline index with DESC ordering for recent-first queries
CREATE INDEX IF NOT EXISTS idx_stints_user_date
ON public.stints(user_id, started_at DESC);

-- Create project timeline index with DESC ordering
CREATE INDEX IF NOT EXISTS idx_stints_project_date
ON public.stints(project_id, started_at DESC);

-- Add comments explaining the indexes
COMMENT ON INDEX idx_stints_user_date IS
  'Optimizes user stint history queries ordered by most recent first';

COMMENT ON INDEX idx_stints_project_date IS
  'Optimizes project stint history queries ordered by most recent first';

-- Note: Timezone-aware completed date index (idx_stints_completed_date)
-- is deferred until user timezone support is fully implemented in user_profiles table
