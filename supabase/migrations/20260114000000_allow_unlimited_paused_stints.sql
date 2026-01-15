-- =============================================================================
-- MIGRATION: Allow Unlimited Paused Stints Per User
-- =============================================================================
-- GitHub Issue #46
--
-- Changes:
-- 1. Drop idx_stints_single_paused_per_user unique index
-- 2. Add non-unique performance index for paused stints
-- 3. Update pause_stint() to remove existing paused stint check
--
-- Note: resume_stint() is NOT modified - it still prevents resuming when
-- another active stint exists, which is the correct behavior.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Drop the unique constraint on paused stints
-- -----------------------------------------------------------------------------
DROP INDEX IF EXISTS idx_stints_single_paused_per_user;

-- -----------------------------------------------------------------------------
-- 2. Add non-unique index for performance (querying paused stints by user)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_stints_paused_per_user
ON public.stints(user_id)
WHERE status = 'paused';

COMMENT ON INDEX idx_stints_paused_per_user IS
  'Performance index for querying paused stints by user_id. Partial index filters on status=paused to match getPausedStints query pattern (Issue #46).';

-- -----------------------------------------------------------------------------
-- 3. Update pause_stint Function - Remove existing paused stint check
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pause_stint(p_stint_id UUID)
RETURNS public.stints
LANGUAGE plpgsql
SECURITY DEFINER
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

  IF v_stint.status != 'active' THEN
    RAISE EXCEPTION 'Stint is not active';
  END IF;

  -- NOTE: Removed check for existing paused stint (Issue #46)
  -- Users can now have multiple paused stints simultaneously

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
  'Pauses an active stint. Multiple paused stints are now allowed per user (Issue #46).';
