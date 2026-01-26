-- =============================================================================
-- MIGRATION: Make pause_stint and resume_stint Semi-Idempotent
-- =============================================================================
-- GitHub Issue: #24 (extension)
--
-- Problem:
-- Race condition between user pause/resume actions and auto-completion.
-- When user clicks pause/resume right as the stint is being auto-completed,
-- the function throws an error causing a confusing toast message.
--
-- Solution:
-- Make pause_stint and resume_stint semi-idempotent:
-- - If stint is already in terminal state (completed/interrupted), return it
-- - Still throw for invalid state transitions (e.g., pause → pause)
--
-- This follows the same pattern as complete_stint (migration 20251231212417).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Update pause_stint Function
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pause_stint(p_stint_id UUID)
RETURNS public.stints
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stint public.stints%ROWTYPE;
  v_current_user_id UUID;
BEGIN
  -- SECURITY: Get and verify authenticated user
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get the stint to pause with row-level lock
  SELECT * INTO v_stint
  FROM public.stints
  WHERE id = p_stint_id
  FOR UPDATE;

  IF v_stint.id IS NULL THEN
    RAISE EXCEPTION 'Stint not found';
  END IF;

  -- SECURITY: Verify ownership before any operations
  IF v_stint.user_id != v_current_user_id THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- SEMI-IDEMPOTENT: If already in terminal state, return gracefully
  -- This handles race condition when auto-complete runs during pause request
  IF v_stint.status IN ('completed', 'interrupted') THEN
    RETURN v_stint;
  END IF;

  -- Only active stints can be paused
  IF v_stint.status != 'active' THEN
    RAISE EXCEPTION 'Stint is not active';
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
  'Pauses an active stint for the authenticated owner. Multiple paused stints are allowed per user (Issue #46). Semi-idempotent: if the stint has already reached a terminal state (completed/interrupted), returns the current row without error (race condition handling for GitHub #24).';

-- -----------------------------------------------------------------------------
-- 2. Update resume_stint Function
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION resume_stint(p_stint_id UUID)
RETURNS public.stints
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stint public.stints%ROWTYPE;
  v_active_stint public.stints%ROWTYPE;
  v_pause_start TIMESTAMP WITH TIME ZONE;
  v_pause_duration INTEGER;
  v_current_user_id UUID;
BEGIN
  -- SECURITY: Get and verify authenticated user
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get the stint to resume
  SELECT * INTO v_stint
  FROM public.stints
  WHERE id = p_stint_id
  FOR UPDATE;

  IF v_stint.id IS NULL THEN
    RAISE EXCEPTION 'Stint not found';
  END IF;

  -- SECURITY: Verify ownership before any operations
  IF v_stint.user_id != v_current_user_id THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- SEMI-IDEMPOTENT: If already in terminal state, return gracefully
  -- This handles race condition when auto-complete runs during resume request
  IF v_stint.status IN ('completed', 'interrupted') THEN
    RETURN v_stint;
  END IF;

  -- Only paused stints can be resumed
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
  'Resumes a paused stint for the authenticated owner. Fails if the stint is not paused or another active stint exists for the user. Semi-idempotent: if the stint has already reached a terminal state (completed/interrupted), returns the current row without error (race condition handling for GitHub #24).';
