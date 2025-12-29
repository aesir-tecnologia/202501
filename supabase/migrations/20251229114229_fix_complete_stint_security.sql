-- Fix complete_stint security vulnerability
-- =========================================
--
-- Problem:
-- The complete_stint function uses SECURITY DEFINER but doesn't verify
-- that the authenticated user owns the stint being completed. This allows
-- any authenticated user to complete any other user's stint.
--
-- Solution:
-- Add ownership verification at the start of the function, consistent with
-- the fix applied to pause_stint and resume_stint in migration 20251228190335.

CREATE OR REPLACE FUNCTION complete_stint(
  p_stint_id UUID,
  p_completion_type completion_type,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.stints AS $$
DECLARE
  v_current_user_id UUID;
  v_stint public.stints%ROWTYPE;
  v_actual_duration INTEGER;
BEGIN
  -- SECURITY: Get and verify authenticated user
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get the stint
  SELECT * INTO v_stint
  FROM public.stints
  WHERE id = p_stint_id;

  IF v_stint.id IS NULL THEN
    RAISE EXCEPTION 'Stint not found';
  END IF;

  -- SECURITY: Verify ownership before any operations
  IF v_stint.user_id != v_current_user_id THEN
    RAISE EXCEPTION 'You do not have permission to complete this stint.';
  END IF;

  IF v_stint.status NOT IN ('active', 'paused') THEN
    RAISE EXCEPTION 'Stint is not active or paused';
  END IF;

  -- Calculate actual duration
  v_actual_duration := calculate_actual_duration(
    v_stint.started_at,
    NOW(),
    v_stint.paused_duration
  );

  -- Update stint
  UPDATE public.stints
  SET
    status = 'completed'::stint_status,
    ended_at = NOW(),
    actual_duration = v_actual_duration,
    completion_type = p_completion_type,
    notes = COALESCE(p_notes, v_stint.notes),
    updated_at = NOW()
  WHERE id = p_stint_id
  RETURNING * INTO v_stint;

  RETURN v_stint;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION complete_stint(UUID, completion_type, TEXT) IS
  'Completes an active or paused stint owned by the authenticated user. Calculates actual duration and sets completion fields.';
