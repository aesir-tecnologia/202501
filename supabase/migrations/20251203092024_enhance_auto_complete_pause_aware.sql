-- Migration: Enhance auto-complete function with pause-aware working time calculation
--
-- REPLACES: 20251120010455_add_auto_complete_function.sql (function only, keeps cron schedule)
--
-- FIX: Original function used wall-clock time (started_at + planned_duration)
--      New function uses working time (elapsed - paused_duration)
--
-- Formula: working_time = (now - started_at) - paused_duration
-- Completion: working_time >= planned_duration

-- Drop the old function (required because return type is changing)
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
    -- Complete if working time >= planned duration
    IF v_stint_record.working_seconds >= (v_stint_record.planned_duration * 60) THEN
      BEGIN
        PERFORM complete_stint(v_stint_record.id, 'auto'::completion_type, NULL);
        v_completed_count := v_completed_count + 1;
        v_completed_ids := array_append(v_completed_ids, v_stint_record.id);

        RAISE NOTICE 'Auto-completed stint % (working: % sec, planned: % min)',
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
  'Auto-completes active stints where working_time >= planned_duration. Working time accounts for paused_duration.';

-- Re-grant permissions (required after DROP/CREATE)
GRANT EXECUTE ON FUNCTION auto_complete_expired_stints() TO authenticated;
