-- Migration: Stint Management Core
-- Enhances stints table with status tracking, pause/resume, and optimistic locking

-- Create enum types for stint status and completion type
CREATE TYPE stint_status AS ENUM ('active', 'paused', 'completed', 'interrupted');
CREATE TYPE completion_type AS ENUM ('manual', 'auto', 'interrupted');

-- Add version column to user_profiles for optimistic locking
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Add new columns to stints table
ALTER TABLE public.stints
  ADD COLUMN IF NOT EXISTS status stint_status,
  ADD COLUMN IF NOT EXISTS planned_duration INTEGER,
  ADD COLUMN IF NOT EXISTS actual_duration INTEGER, -- seconds, calculated on completion
  ADD COLUMN IF NOT EXISTS paused_duration INTEGER NOT NULL DEFAULT 0, -- cumulative seconds
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS completion_type completion_type;

-- Migrate existing data: convert is_completed to status
UPDATE public.stints
SET status = CASE
  WHEN is_completed = true THEN 'completed'::stint_status
  WHEN ended_at IS NULL THEN 'active'::stint_status
  ELSE 'completed'::stint_status
END
WHERE status IS NULL;

-- Set default status for existing active stints that might not have ended_at set
UPDATE public.stints
SET status = 'active'::stint_status
WHERE status IS NULL AND ended_at IS NULL;

-- Set default status for completed stints
UPDATE public.stints
SET status = 'completed'::stint_status
WHERE status IS NULL AND ended_at IS NOT NULL;

-- Set status NOT NULL now that we've migrated data
ALTER TABLE public.stints
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'active'::stint_status;

-- Add constraints
ALTER TABLE public.stints
  ADD CONSTRAINT valid_planned_duration CHECK (planned_duration IS NULL OR (planned_duration >= 10 AND planned_duration <= 120)),
  ADD CONSTRAINT valid_notes CHECK (notes IS NULL OR length(notes) <= 500),
  ADD CONSTRAINT valid_ended CHECK (ended_at IS NULL OR ended_at >= started_at),
  ADD CONSTRAINT completed_has_ended CHECK (status IN ('active', 'paused') OR ended_at IS NOT NULL);

-- Drop old index that used ended_at IS NULL
DROP INDEX IF EXISTS idx_stints_active;

-- Create partial unique index to enforce single active/paused stint per user
CREATE UNIQUE INDEX idx_stints_single_active_per_user
ON public.stints(user_id)
WHERE status IN ('active', 'paused');

-- Create index for auto-completion queries
CREATE INDEX idx_stints_status_started
ON public.stints(status, started_at)
WHERE status = 'active';

-- Index for pause/resume queries
CREATE INDEX idx_stints_user_status
ON public.stints(user_id, status)
WHERE status IN ('active', 'paused');

-- Function: Calculate actual duration in seconds
CREATE OR REPLACE FUNCTION calculate_actual_duration(
  p_started_at TIMESTAMP WITH TIME ZONE,
  p_ended_at TIMESTAMP WITH TIME ZONE,
  p_paused_duration INTEGER
) RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(EPOCH FROM (p_ended_at - p_started_at))::INTEGER - COALESCE(p_paused_duration, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Get active stint for user
CREATE OR REPLACE FUNCTION get_active_stint(p_user_id UUID)
RETURNS SETOF public.stints AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.stints
  WHERE user_id = p_user_id
    AND status IN ('active', 'paused')
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Validate stint start (checks for conflicts and implements optimistic locking)
CREATE OR REPLACE FUNCTION validate_stint_start(
  p_user_id UUID,
  p_project_id UUID,
  p_version INTEGER
)
RETURNS TABLE(
  can_start BOOLEAN,
  existing_stint_id UUID,
  conflict_message TEXT
) AS $$
DECLARE
  v_current_version INTEGER;
  v_existing_stint public.stints%ROWTYPE;
BEGIN
  -- Check version matches (optimistic locking)
  SELECT version INTO v_current_version
  FROM public.user_profiles
  WHERE id = p_user_id;

  IF v_current_version IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 'User not found'::TEXT;
    RETURN;
  END IF;

  IF v_current_version != p_version THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Version mismatch - concurrent operation detected'::TEXT;
    RETURN;
  END IF;

  -- Check for existing active/paused stint
  SELECT * INTO v_existing_stint
  FROM public.stints
  WHERE user_id = p_user_id
    AND status IN ('active', 'paused')
  LIMIT 1;

  IF v_existing_stint.id IS NOT NULL THEN
    RETURN QUERY SELECT false, v_existing_stint.id, 'Active stint already exists'::TEXT;
    RETURN;
  END IF;

  -- Verify project exists and belongs to user
  IF NOT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id
      AND user_id = p_user_id
      AND archived_at IS NULL
  ) THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Project not found or archived'::TEXT;
    RETURN;
  END IF;

  -- Can start
  RETURN QUERY SELECT true, NULL::UUID, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Complete stint (calculates actual duration and sets completion fields)
CREATE OR REPLACE FUNCTION complete_stint(
  p_stint_id UUID,
  p_completion_type completion_type,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.stints AS $$
DECLARE
  v_stint public.stints%ROWTYPE;
  v_actual_duration INTEGER;
BEGIN
  -- Get the stint
  SELECT * INTO v_stint
  FROM public.stints
  WHERE id = p_stint_id;

  IF v_stint.id IS NULL THEN
    RAISE EXCEPTION 'Stint not found';
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

-- Function: Pause stint
CREATE OR REPLACE FUNCTION pause_stint(p_stint_id UUID)
RETURNS public.stints AS $$
DECLARE
  v_stint public.stints%ROWTYPE;
BEGIN
  -- Get the stint
  SELECT * INTO v_stint
  FROM public.stints
  WHERE id = p_stint_id;

  IF v_stint.id IS NULL THEN
    RAISE EXCEPTION 'Stint not found';
  END IF;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Resume stint (accumulates paused duration)
CREATE OR REPLACE FUNCTION resume_stint(p_stint_id UUID)
RETURNS public.stints AS $$
DECLARE
  v_stint public.stints%ROWTYPE;
  v_pause_start TIMESTAMP WITH TIME ZONE;
  v_pause_duration INTEGER;
BEGIN
  -- Get the stint
  SELECT * INTO v_stint
  FROM public.stints
  WHERE id = p_stint_id;

  IF v_stint.id IS NULL THEN
    RAISE EXCEPTION 'Stint not found';
  END IF;

  IF v_stint.status != 'paused' THEN
    RAISE EXCEPTION 'Stint is not paused';
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Increment user version (for optimistic locking)
CREATE OR REPLACE FUNCTION increment_user_version(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_new_version INTEGER;
BEGIN
  UPDATE public.user_profiles
  SET version = version + 1,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING version INTO v_new_version;

  RETURN v_new_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Increment user version when stint changes (start/pause/resume/stop)
-- This helps with optimistic locking
CREATE OR REPLACE FUNCTION trigger_increment_user_version_on_stint_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment version when stint status changes
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status IN ('active', 'paused') THEN
    PERFORM increment_user_version(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS increment_version_on_stint_change ON public.stints;
CREATE TRIGGER increment_version_on_stint_change
  AFTER INSERT OR UPDATE OF status ON public.stints
  FOR EACH ROW
  WHEN (NEW.status IN ('active', 'paused'))
  EXECUTE FUNCTION trigger_increment_user_version_on_stint_change();

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_active_stint(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_stint_start(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_stint(UUID, completion_type, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION pause_stint(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION resume_stint(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_actual_duration(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, INTEGER) TO authenticated;

-- Comment: is_completed column is deprecated but kept for backward compatibility
-- New code should use status column instead
COMMENT ON COLUMN public.stints.is_completed IS 'Deprecated: Use status column instead. Kept for backward compatibility.';

