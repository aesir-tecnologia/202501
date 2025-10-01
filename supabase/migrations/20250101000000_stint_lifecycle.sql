-- Stint Lifecycle State Machine Migration
-- Adds RPC functions for atomic stint lifecycle operations with single-active enforcement

-- Function: Start a new stint
-- Enforces single-active constraint by stopping any existing active stint
CREATE OR REPLACE FUNCTION start_stint(
  p_project_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_started_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  id UUID,
  project_id UUID,
  user_id UUID,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  is_completed BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_user_id UUID;
  v_active_stint_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Verify project belongs to user
  IF NOT EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = p_project_id
    AND projects.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Project not found or access denied';
  END IF;

  -- Find any active stint for this user
  SELECT stints.id INTO v_active_stint_id
  FROM public.stints
  WHERE stints.user_id = v_user_id
    AND stints.is_completed = false
    AND stints.ended_at IS NULL
  LIMIT 1;

  -- If active stint exists, stop it automatically
  IF v_active_stint_id IS NOT NULL THEN
    UPDATE public.stints
    SET
      ended_at = NOW(),
      duration_minutes = EXTRACT(EPOCH FROM (NOW() - started_at)) / 60,
      is_completed = true,
      updated_at = NOW()
    WHERE stints.id = v_active_stint_id;
  END IF;

  -- Create and return new active stint
  RETURN QUERY
  INSERT INTO public.stints (
    project_id,
    user_id,
    started_at,
    notes,
    is_completed
  ) VALUES (
    p_project_id,
    v_user_id,
    p_started_at,
    p_notes,
    false
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Stop an active stint
CREATE OR REPLACE FUNCTION stop_stint(
  p_stint_id UUID,
  p_ended_at TIMESTAMPTZ DEFAULT NOW(),
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  project_id UUID,
  user_id UUID,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  is_completed BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_user_id UUID;
  v_stint_row RECORD;
  v_duration_minutes INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get stint and verify ownership
  SELECT * INTO v_stint_row
  FROM public.stints
  WHERE stints.id = p_stint_id
    AND stints.user_id = v_user_id;

  IF v_stint_row IS NULL THEN
    RAISE EXCEPTION 'Stint not found or access denied';
  END IF;

  -- Check if already completed
  IF v_stint_row.is_completed = true OR v_stint_row.ended_at IS NOT NULL THEN
    RAISE EXCEPTION 'Stint is already completed';
  END IF;

  -- Calculate duration
  v_duration_minutes := EXTRACT(EPOCH FROM (p_ended_at - v_stint_row.started_at)) / 60;

  -- Validate duration (5-720 minutes)
  IF v_duration_minutes < 5 THEN
    RAISE EXCEPTION 'Stint duration must be at least 5 minutes';
  END IF;

  IF v_duration_minutes > 720 THEN
    RAISE EXCEPTION 'Stint duration cannot exceed 12 hours';
  END IF;

  -- Update and return stint
  RETURN QUERY
  UPDATE public.stints
  SET
    ended_at = p_ended_at,
    duration_minutes = v_duration_minutes,
    notes = COALESCE(p_notes, stints.notes),
    is_completed = true,
    updated_at = NOW()
  WHERE stints.id = p_stint_id
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Pause an active stint
-- Temporarily stops stint with option to resume
CREATE OR REPLACE FUNCTION pause_stint(
  p_stint_id UUID,
  p_paused_at TIMESTAMPTZ DEFAULT NOW(),
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  project_id UUID,
  user_id UUID,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  is_completed BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_user_id UUID;
  v_stint_row RECORD;
  v_duration_minutes INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get stint and verify ownership
  SELECT * INTO v_stint_row
  FROM public.stints
  WHERE stints.id = p_stint_id
    AND stints.user_id = v_user_id;

  IF v_stint_row IS NULL THEN
    RAISE EXCEPTION 'Stint not found or access denied';
  END IF;

  -- Check if already paused or completed
  IF v_stint_row.is_completed = true THEN
    RAISE EXCEPTION 'Cannot pause a completed stint';
  END IF;

  IF v_stint_row.ended_at IS NOT NULL THEN
    RAISE EXCEPTION 'Stint is already paused';
  END IF;

  -- Calculate duration so far
  v_duration_minutes := EXTRACT(EPOCH FROM (p_paused_at - v_stint_row.started_at)) / 60;

  -- Update and return stint (paused state: ended_at set but not completed)
  RETURN QUERY
  UPDATE public.stints
  SET
    ended_at = p_paused_at,
    duration_minutes = v_duration_minutes,
    notes = COALESCE(p_notes, stints.notes),
    updated_at = NOW()
  WHERE stints.id = p_stint_id
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Resume a paused stint
-- Creates a new stint record continuing from where the previous one left off
CREATE OR REPLACE FUNCTION resume_stint(
  p_paused_stint_id UUID,
  p_resumed_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  id UUID,
  project_id UUID,
  user_id UUID,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  is_completed BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_user_id UUID;
  v_paused_stint RECORD;
  v_active_stint_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get paused stint and verify ownership
  SELECT * INTO v_paused_stint
  FROM public.stints
  WHERE stints.id = p_paused_stint_id
    AND stints.user_id = v_user_id;

  IF v_paused_stint IS NULL THEN
    RAISE EXCEPTION 'Stint not found or access denied';
  END IF;

  -- Verify stint is actually paused (has ended_at but not completed)
  IF v_paused_stint.ended_at IS NULL THEN
    RAISE EXCEPTION 'Stint is not paused';
  END IF;

  IF v_paused_stint.is_completed = true THEN
    RAISE EXCEPTION 'Cannot resume a completed stint';
  END IF;

  -- Find any active stint for this user
  SELECT stints.id INTO v_active_stint_id
  FROM public.stints
  WHERE stints.user_id = v_user_id
    AND stints.is_completed = false
    AND stints.ended_at IS NULL
  LIMIT 1;

  -- If active stint exists, stop it automatically
  IF v_active_stint_id IS NOT NULL THEN
    UPDATE public.stints
    SET
      ended_at = NOW(),
      duration_minutes = EXTRACT(EPOCH FROM (NOW() - started_at)) / 60,
      is_completed = true,
      updated_at = NOW()
    WHERE stints.id = v_active_stint_id;
  END IF;

  -- Mark the paused stint as completed (resume creates a new stint)
  UPDATE public.stints
  SET
    is_completed = true,
    updated_at = NOW()
  WHERE stints.id = p_paused_stint_id;

  -- Create and return new active stint continuing from paused one
  RETURN QUERY
  INSERT INTO public.stints (
    project_id,
    user_id,
    started_at,
    notes,
    is_completed
  ) VALUES (
    v_paused_stint.project_id,
    v_user_id,
    p_resumed_at,
    v_paused_stint.notes,
    false
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION start_stint TO authenticated;
GRANT EXECUTE ON FUNCTION stop_stint TO authenticated;
GRANT EXECUTE ON FUNCTION pause_stint TO authenticated;
GRANT EXECUTE ON FUNCTION resume_stint TO authenticated;
