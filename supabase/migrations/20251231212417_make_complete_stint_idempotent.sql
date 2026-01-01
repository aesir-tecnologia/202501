-- Migration: Make complete_stint() idempotent
--
-- FIX: Race condition between client timer, server cron, and manual completion
-- GitHub Issue: #24
--
-- BEFORE: Throws exception if stint is not active/paused
-- AFTER:  Returns the stint if already in terminal state (completed/interrupted)
--
-- This prevents console errors when multiple actors attempt to complete
-- the same stint simultaneously.
--
-- IMPORTANT: This migration builds on 20251229114229_fix_complete_stint_security.sql
-- and preserves the security checks (auth.uid() and ownership verification).

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

  -- IDEMPOTENT: If already in terminal state, return the existing stint
  -- This prevents race condition errors when multiple actors
  -- (client timer, server cron, manual) try to complete simultaneously
  IF v_stint.status IN ('completed', 'interrupted') THEN
    RETURN v_stint;
  END IF;

  -- Only active or paused stints can be completed
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
  'Completes an active or paused stint owned by the authenticated user. Idempotent: returns existing stint if already in terminal state (completed/interrupted).';
