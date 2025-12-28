-- =============================================================================
-- DATABASE FUNCTION CONTRACTS: Pause and Switch
-- =============================================================================
-- This file documents the PostgreSQL function signatures and behaviors
-- for the Pause and Switch feature.
--
-- Implementation goes in: supabase/migrations/YYYYMMDDHHMMSS_pause_and_switch.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- NOTE: No new functions required
-- -----------------------------------------------------------------------------
-- The existing complete_stint function already supports stopping paused stints
-- with completion_type = 'interrupted'. No abandon_stint function needed.
-- -----------------------------------------------------------------------------


-- -----------------------------------------------------------------------------
-- FUNCTION: validate_stint_start (MODIFIED)
-- -----------------------------------------------------------------------------
-- Validates whether a new stint can be started.
--
-- BEHAVIOR CHANGE:
--   - Previously: Blocked if ANY active/paused stint existed
--   - Now: Only blocks if ACTIVE stint exists; returns paused stint info
--
-- RETURNS:
--   - can_start: true if no active stint exists
--   - existing_stint_id: ID of active or paused stint (if any)
--   - existing_stint_status: 'active' or 'paused' (if any)
--   - conflict_message: User-friendly message explaining the conflict
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION validate_stint_start(
  p_user_id UUID,
  p_project_id UUID,
  p_version INTEGER
)
RETURNS TABLE(
  can_start BOOLEAN,
  existing_stint_id UUID,
  existing_stint_status TEXT,
  conflict_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_version INTEGER;
  v_active_stint public.stints%ROWTYPE;
  v_paused_stint public.stints%ROWTYPE;
BEGIN
  -- Check version matches (optimistic locking)
  SELECT version INTO v_current_version
  FROM public.user_profiles
  WHERE id = p_user_id;

  IF v_current_version IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'User not found'::TEXT;
    RETURN;
  END IF;

  IF v_current_version != p_version THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'Version mismatch - concurrent operation detected'::TEXT;
    RETURN;
  END IF;

  -- Check for existing ACTIVE stint (this blocks starting)
  SELECT * INTO v_active_stint
  FROM public.stints
  WHERE user_id = p_user_id
    AND status = 'active'
  LIMIT 1;

  IF v_active_stint.id IS NOT NULL THEN
    RETURN QUERY SELECT
      false,
      v_active_stint.id,
      'active'::TEXT,
      'An active stint is already running. Pause or complete it first.'::TEXT;
    RETURN;
  END IF;

  -- Check for existing PAUSED stint (allowed, but return info for UI)
  SELECT * INTO v_paused_stint
  FROM public.stints
  WHERE user_id = p_user_id
    AND status = 'paused'
  LIMIT 1;

  IF v_paused_stint.id IS NOT NULL THEN
    -- Can start, but inform about paused stint
    RETURN QUERY SELECT
      true,
      v_paused_stint.id,
      'paused'::TEXT,
      'A paused stint exists. You can start a new stint alongside it.'::TEXT;
    RETURN;
  END IF;

  -- Verify project exists and belongs to user
  IF NOT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id
      AND user_id = p_user_id
      AND archived_at IS NULL
  ) THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'Project not found or archived'::TEXT;
    RETURN;
  END IF;

  -- Can start with no existing stints
  RETURN QUERY SELECT true, NULL::UUID, NULL::TEXT, NULL::TEXT;
END;
$$;

COMMENT ON FUNCTION validate_stint_start(UUID, UUID, INTEGER) IS
  'Validates stint start. Blocks only if active stint exists. Returns paused stint info for UI.';


-- -----------------------------------------------------------------------------
-- FUNCTION: resume_stint (MODIFIED)
-- -----------------------------------------------------------------------------
-- Resumes a paused stint.
--
-- BEHAVIOR CHANGE:
--   - Now checks for existing ACTIVE stint before allowing resume
--   - Prevents resuming while another stint is active
--
-- ERRORS (NEW):
--   - 'Cannot resume while another stint is active' if active stint exists
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION resume_stint(p_stint_id UUID)
RETURNS public.stints
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stint public.stints%ROWTYPE;
  v_active_stint public.stints%ROWTYPE;
  v_pause_start TIMESTAMP WITH TIME ZONE;
  v_pause_duration INTEGER;
BEGIN
  -- Get the stint to resume
  SELECT * INTO v_stint
  FROM public.stints
  WHERE id = p_stint_id
  FOR UPDATE;

  IF v_stint.id IS NULL THEN
    RAISE EXCEPTION 'Stint not found';
  END IF;

  IF v_stint.status != 'paused' THEN
    RAISE EXCEPTION 'Stint is not paused';
  END IF;

  -- NEW: Check for existing active stint
  SELECT * INTO v_active_stint
  FROM public.stints
  WHERE user_id = v_stint.user_id
    AND status = 'active'
    AND id != p_stint_id
  LIMIT 1;

  IF v_active_stint.id IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot resume while another stint is active';
  END IF;

  -- Calculate pause duration and accumulate
  v_pause_start := v_stint.paused_at;
  v_pause_duration := EXTRACT(EPOCH FROM (NOW() - v_pause_start))::INTEGER;

  -- Update stint to active and accumulate paused duration
  UPDATE public.stints
  SET
    status = 'active'::stint_status,
    paused_duration = paused_duration + v_pause_duration,
    paused_at = NULL,
    updated_at = NOW()
  WHERE id = p_stint_id
  RETURNING * INTO v_stint;

  RETURN v_stint;
END;
$$;

COMMENT ON FUNCTION resume_stint(UUID) IS
  'Resumes a paused stint. Fails if another active stint exists.';


-- -----------------------------------------------------------------------------
-- FUNCTION: pause_stint (MODIFIED)
-- -----------------------------------------------------------------------------
-- Pauses an active stint.
--
-- BEHAVIOR CHANGE:
--   - Now checks for existing PAUSED stint before allowing pause
--   - Prevents having two paused stints simultaneously (enforced by constraint
--     but with a friendly error message before hitting the constraint)
--
-- ERRORS (NEW):
--   - 'You already have a paused stint. Complete or abandon it first.' if
--     another paused stint exists
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION pause_stint(p_stint_id UUID)
RETURNS public.stints
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stint public.stints%ROWTYPE;
  v_paused_stint public.stints%ROWTYPE;
BEGIN
  -- Get the stint to pause
  SELECT * INTO v_stint
  FROM public.stints
  WHERE id = p_stint_id
  FOR UPDATE;

  IF v_stint.id IS NULL THEN
    RAISE EXCEPTION 'Stint not found';
  END IF;

  IF v_stint.status != 'active' THEN
    RAISE EXCEPTION 'Stint is not active';
  END IF;

  -- NEW: Check for existing paused stint (friendly error before constraint)
  SELECT * INTO v_paused_stint
  FROM public.stints
  WHERE user_id = v_stint.user_id
    AND status = 'paused'
    AND id != p_stint_id
  LIMIT 1;

  IF v_paused_stint.id IS NOT NULL THEN
    RAISE EXCEPTION 'You already have a paused stint. Complete or abandon it first.';
  END IF;

  -- Update stint to paused
  UPDATE public.stints
  SET
    status = 'paused'::stint_status,
    paused_at = NOW(),
    updated_at = NOW()
  WHERE id = p_stint_id
  RETURNING * INTO v_stint;

  RETURN v_stint;
END;
$$;

COMMENT ON FUNCTION pause_stint(UUID) IS
  'Pauses an active stint. Fails if another paused stint already exists.';
