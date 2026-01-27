-- Migration: Standardize all duration fields to seconds
-- Issue: #28 - Standardize time unit documentation
--
-- BEFORE: Mixed units
--   - stints.planned_duration: minutes (5-480)
--   - stints.paused_duration: seconds
--   - stints.actual_duration: seconds
--   - projects.custom_stint_duration: minutes (5-480)
--   - user_profiles.default_stint_duration: minutes (5-480)
--
-- AFTER: All seconds
--   - stints.planned_duration: seconds (300-28800)
--   - stints.paused_duration: seconds (unchanged)
--   - stints.actual_duration: seconds (unchanged)
--   - projects.custom_stint_duration: seconds (300-28800)
--   - user_profiles.default_stint_duration: seconds (300-28800)
--
-- Conversion: 5 min = 300 sec, 480 min = 28800 sec

BEGIN;

-- ============================================================================
-- Step 1: Convert stints.planned_duration from minutes to seconds
-- ============================================================================

-- Drop the old constraint first
ALTER TABLE public.stints
DROP CONSTRAINT IF EXISTS valid_planned_duration;

-- Convert existing data: minutes → seconds
UPDATE public.stints
SET planned_duration = planned_duration * 60
WHERE planned_duration IS NOT NULL;

-- Add new constraint with seconds-based bounds (300-28800)
ALTER TABLE public.stints
ADD CONSTRAINT valid_planned_duration
CHECK (planned_duration >= 300 AND planned_duration <= 28800);

COMMENT ON CONSTRAINT valid_planned_duration ON public.stints IS
  'Planned duration must be between 300 and 28800 seconds (5-480 minutes)';

-- ============================================================================
-- Step 2: Convert projects.custom_stint_duration from minutes to seconds
-- ============================================================================

-- Drop the old constraint
ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS valid_stint_duration;

-- Convert existing data: minutes → seconds
UPDATE public.projects
SET custom_stint_duration = custom_stint_duration * 60
WHERE custom_stint_duration IS NOT NULL;

-- Add new constraint with seconds-based bounds (300-28800)
ALTER TABLE public.projects
ADD CONSTRAINT valid_stint_duration
CHECK (custom_stint_duration IS NULL OR (custom_stint_duration >= 300 AND custom_stint_duration <= 28800));

COMMENT ON CONSTRAINT valid_stint_duration ON public.projects IS
  'Custom stint duration must be between 300 and 28800 seconds (5-480 minutes) or NULL';

-- ============================================================================
-- Step 3: Convert user_profiles.default_stint_duration from minutes to seconds
-- ============================================================================

-- Drop the old check constraint (inline constraint, need to find its name)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.user_profiles'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%default_stint_duration%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.user_profiles DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- Convert existing data: minutes → seconds
UPDATE public.user_profiles
SET default_stint_duration = default_stint_duration * 60
WHERE default_stint_duration IS NOT NULL;

-- Add new constraint with seconds-based bounds (300-28800)
ALTER TABLE public.user_profiles
ADD CONSTRAINT valid_default_stint_duration
CHECK (default_stint_duration IS NULL OR (default_stint_duration >= 300 AND default_stint_duration <= 28800));

COMMENT ON CONSTRAINT valid_default_stint_duration ON public.user_profiles IS
  'Default stint duration must be between 300 and 28800 seconds (5-480 minutes) or NULL';

-- Update column comment
COMMENT ON COLUMN public.user_profiles.default_stint_duration IS
  'Default stint duration in seconds (300-28800). NULL means use system default (7200 = 2 hours)';

-- ============================================================================
-- Step 4: Update auto_complete_expired_stints function
-- ============================================================================
-- The function previously compared: working_seconds >= planned_duration * 60
-- Now planned_duration is already in seconds, so: working_seconds >= planned_duration

DROP FUNCTION IF EXISTS auto_complete_expired_stints();

CREATE FUNCTION auto_complete_expired_stints()
RETURNS TABLE (
  completed_count INTEGER,
  error_count INTEGER,
  completed_stint_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completed_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_completed_ids UUID[] := ARRAY[]::UUID[];
  v_stint_record RECORD;
BEGIN
  FOR v_stint_record IN
    SELECT
      id,
      user_id,
      project_id,
      started_at,
      planned_duration,
      paused_duration,
      -- Working time = elapsed - paused (in seconds)
      EXTRACT(EPOCH FROM (now() - started_at))::INTEGER - COALESCE(paused_duration, 0) AS working_seconds
    FROM stints
    WHERE status = 'active'
      AND planned_duration IS NOT NULL
      AND started_at IS NOT NULL
    ORDER BY started_at ASC
  LOOP
    -- Complete if working time >= planned duration (both now in seconds)
    IF v_stint_record.working_seconds >= v_stint_record.planned_duration THEN
      BEGIN
        PERFORM complete_stint(v_stint_record.id, 'auto'::completion_type, NULL);
        v_completed_count := v_completed_count + 1;
        v_completed_ids := array_append(v_completed_ids, v_stint_record.id);

        RAISE NOTICE 'Auto-completed stint % (working: % sec, planned: % sec)',
          v_stint_record.id,
          v_stint_record.working_seconds,
          v_stint_record.planned_duration;

      EXCEPTION WHEN OTHERS THEN
        v_error_count := v_error_count + 1;
        RAISE WARNING 'Failed to auto-complete stint %: % (SQLSTATE: %)',
          v_stint_record.id,
          SQLERRM,
          SQLSTATE;
      END;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_completed_count, v_error_count, v_completed_ids;
END;
$$;

COMMENT ON FUNCTION auto_complete_expired_stints() IS
  'Auto-completes active stints where working_time >= planned_duration. All durations in seconds.';

GRANT EXECUTE ON FUNCTION auto_complete_expired_stints() TO authenticated;

-- ============================================================================
-- Step 5: Update column comments for clarity
-- ============================================================================

COMMENT ON COLUMN public.stints.planned_duration IS
  'Planned stint duration in seconds (300-28800, i.e., 5-480 minutes)';

COMMENT ON COLUMN public.stints.actual_duration IS
  'Actual working time in seconds, calculated on completion';

COMMENT ON COLUMN public.stints.paused_duration IS
  'Cumulative pause time in seconds';

COMMENT ON COLUMN public.projects.custom_stint_duration IS
  'Custom stint duration in seconds (300-28800). NULL means use system default (7200 = 2 hours)';

COMMIT;
