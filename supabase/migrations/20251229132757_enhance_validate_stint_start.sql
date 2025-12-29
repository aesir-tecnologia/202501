-- =============================================================================
-- MIGRATION: Enhance validate_stint_start Function
-- =============================================================================
-- Improvements:
-- 1. Add advisory lock to serialize start operations per user (prevents TOCTOU race)
-- 2. Add existing_project_name to return type for better UX
-- =============================================================================

DROP FUNCTION IF EXISTS validate_stint_start(UUID, INTEGER);

CREATE OR REPLACE FUNCTION validate_stint_start(
  p_project_id UUID,
  p_version INTEGER
)
RETURNS TABLE(
  can_start BOOLEAN,
  existing_stint_id UUID,
  existing_stint_status TEXT,
  existing_project_name TEXT,
  conflict_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_version INTEGER;
  v_active_stint_id UUID;
  v_paused_stint_id UUID;
  v_user_id UUID;
  v_project_name TEXT;
BEGIN
  -- SECURITY: Get user ID from auth context, not from parameter
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT, 'Authentication required'::TEXT;
    RETURN;
  END IF;

  -- SERIALIZATION: Acquire advisory lock to prevent TOCTOU race conditions
  -- Uses transaction-level lock that auto-releases on commit/rollback
  -- Lock key is derived from user ID to serialize only that user's operations
  PERFORM pg_advisory_xact_lock(hashtext('stint_start_' || v_user_id::text));

  -- Check version matches (optimistic locking)
  SELECT version INTO v_current_version
  FROM public.user_profiles
  WHERE id = v_user_id;

  IF v_current_version IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT, 'User not found'::TEXT;
    RETURN;
  END IF;

  IF v_current_version != p_version THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT, 'Version mismatch - concurrent operation detected'::TEXT;
    RETURN;
  END IF;

  -- Check for existing ACTIVE stint (this blocks starting)
  SELECT s.id, p.name INTO v_active_stint_id, v_project_name
  FROM public.stints s
  JOIN public.projects p ON p.id = s.project_id
  WHERE s.user_id = v_user_id
    AND s.status = 'active'
  LIMIT 1;

  IF v_active_stint_id IS NOT NULL THEN
    RETURN QUERY SELECT
      false,
      v_active_stint_id,
      'active'::TEXT,
      v_project_name,
      'An active stint is already running'::TEXT;
    RETURN;
  END IF;

  -- Check for existing PAUSED stint (allowed, but return info for UI)
  SELECT s.id, p.name INTO v_paused_stint_id, v_project_name
  FROM public.stints s
  JOIN public.projects p ON p.id = s.project_id
  WHERE s.user_id = v_user_id
    AND s.status = 'paused'
  LIMIT 1;

  IF v_paused_stint_id IS NOT NULL THEN
    -- Can start, but inform about paused stint
    RETURN QUERY SELECT
      true,
      v_paused_stint_id,
      'paused'::TEXT,
      v_project_name,
      'A paused stint exists. You can start a new stint alongside it.'::TEXT;
    RETURN;
  END IF;

  -- Verify project exists and belongs to user
  IF NOT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id
      AND user_id = v_user_id
      AND archived_at IS NULL
  ) THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT, 'Project not found or archived'::TEXT;
    RETURN;
  END IF;

  -- Can start with no existing stints
  RETURN QUERY SELECT true, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT;
END;
$$;

COMMENT ON FUNCTION validate_stint_start(UUID, INTEGER) IS
  'Validates stint start for the authenticated user. Uses advisory lock to prevent race conditions. Returns project name for UI display.';
