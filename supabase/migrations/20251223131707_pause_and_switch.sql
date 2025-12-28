-- =============================================================================
-- MIGRATION: Pause and Switch
-- =============================================================================
-- Feature: 006-suspend-switch
-- Date: 2025-12-23
--
-- This migration enables users to have one active AND one paused stint
-- simultaneously, allowing them to pause current work and switch projects.
--
-- Changes:
-- 1. Replace combined unique index with two separate indexes
-- 2. Update pause_stint function to prevent double-pausing
-- 3. Update resume_stint function to prevent resuming while active stint exists
-- 4. Update validate_stint_start function to return paused stint info
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Replace Unique Constraint
-- -----------------------------------------------------------------------------
-- Current: Single index prevents more than 1 active OR paused stint
-- New: Two separate indexes allow 1 active AND 1 paused simultaneously

DROP INDEX IF EXISTS idx_stints_single_active_per_user;

CREATE UNIQUE INDEX idx_stints_single_active_per_user
ON public.stints(user_id)
WHERE status = 'active';

CREATE UNIQUE INDEX idx_stints_single_paused_per_user
ON public.stints(user_id)
WHERE status = 'paused';

COMMENT ON INDEX idx_stints_single_active_per_user IS
  'Enforces max 1 active stint per user (FR-001)';

COMMENT ON INDEX idx_stints_single_paused_per_user IS
  'Enforces max 1 paused stint per user (FR-002)';

-- -----------------------------------------------------------------------------
-- 2. Update pause_stint Function
-- -----------------------------------------------------------------------------
-- Now checks for existing paused stint before allowing pause

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

  -- Check for existing paused stint (friendly error before constraint)
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

-- -----------------------------------------------------------------------------
-- 3. Update resume_stint Function
-- -----------------------------------------------------------------------------
-- Now checks for existing active stint before allowing resume

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

  -- Check for existing active stint
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
-- 4. Update validate_stint_start Function
-- -----------------------------------------------------------------------------
-- Now only blocks on active stints; returns paused stint info for UI
-- Must DROP first because we're adding a new return column (existing_stint_status)

DROP FUNCTION IF EXISTS validate_stint_start(UUID, UUID, INTEGER);

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
