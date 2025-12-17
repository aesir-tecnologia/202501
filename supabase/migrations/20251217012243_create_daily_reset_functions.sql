-- Migration: Create daily reset functions for aggregating stint data
-- Supports: 005-daily-reset feature
--
-- This migration creates:
-- 1. aggregate_daily_summary() - Aggregates one user's daily data
-- 2. process_daily_reset() - Orchestrates reset for all eligible users
-- 3. get_daily_summaries() - Client-facing query function

-- ============================================================================
-- Function: aggregate_daily_summary
-- ============================================================================
-- Aggregates a single user's completed stints from a specific date into a
-- daily_summary record. Uses UPSERT for idempotency.

CREATE OR REPLACE FUNCTION aggregate_daily_summary(
  p_user_id UUID,
  p_date DATE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_timezone TEXT;
  v_total_stints INTEGER := 0;
  v_total_focus_seconds INTEGER := 0;
  v_total_pause_seconds INTEGER := 0;
  v_project_breakdown JSONB := '[]'::jsonb;
  v_summary_id UUID;
BEGIN
  -- Get user's timezone
  SELECT timezone INTO v_timezone
  FROM public.user_profiles
  WHERE id = p_user_id;

  IF v_timezone IS NULL THEN
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_user_id) THEN
      RETURN jsonb_build_object(
        'success', false,
        'summary_id', NULL,
        'total_stints', 0,
        'total_focus_seconds', 0,
        'error', 'User not found'
      );
    END IF;
    -- Default to UTC if no timezone set
    v_timezone := 'UTC';
  END IF;

  -- Aggregate stint totals for the given date
  -- Note: Stints count towards the day they END, not start
  SELECT
    COUNT(*)::INTEGER,
    COALESCE(SUM(actual_duration), 0)::INTEGER,
    COALESCE(SUM(paused_duration), 0)::INTEGER
  INTO
    v_total_stints,
    v_total_focus_seconds,
    v_total_pause_seconds
  FROM public.stints
  WHERE user_id = p_user_id
    AND status = 'completed'
    AND ended_at IS NOT NULL
    AND DATE(ended_at AT TIME ZONE v_timezone) = p_date;

  -- Build project breakdown JSONB array
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'project_id', project_id,
        'project_name', project_name,
        'stint_count', stint_count,
        'focus_seconds', focus_seconds
      )
      ORDER BY focus_seconds DESC
    ),
    '[]'::jsonb
  ) INTO v_project_breakdown
  FROM (
    SELECT
      s.project_id,
      p.name AS project_name,
      COUNT(*)::INTEGER AS stint_count,
      COALESCE(SUM(s.actual_duration), 0)::INTEGER AS focus_seconds
    FROM public.stints s
    JOIN public.projects p ON p.id = s.project_id
    WHERE s.user_id = p_user_id
      AND s.status = 'completed'
      AND s.ended_at IS NOT NULL
      AND DATE(s.ended_at AT TIME ZONE v_timezone) = p_date
    GROUP BY s.project_id, p.name
  ) breakdown;

  -- Upsert the daily summary (idempotent)
  INSERT INTO public.daily_summaries (
    user_id,
    date,
    total_stints,
    total_focus_seconds,
    total_pause_seconds,
    project_breakdown,
    completed_at
  ) VALUES (
    p_user_id,
    p_date,
    v_total_stints,
    v_total_focus_seconds,
    v_total_pause_seconds,
    v_project_breakdown,
    now()
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_stints = EXCLUDED.total_stints,
    total_focus_seconds = EXCLUDED.total_focus_seconds,
    total_pause_seconds = EXCLUDED.total_pause_seconds,
    project_breakdown = EXCLUDED.project_breakdown,
    completed_at = now()
  RETURNING id INTO v_summary_id;

  RETURN jsonb_build_object(
    'success', true,
    'summary_id', v_summary_id,
    'total_stints', v_total_stints,
    'total_focus_seconds', v_total_focus_seconds,
    'error', NULL
  );
END;
$$;

COMMENT ON FUNCTION aggregate_daily_summary(UUID, DATE) IS
  'Aggregates a single user''s completed stints into a daily_summary record. Idempotent via UPSERT.';


-- ============================================================================
-- Function: process_daily_reset
-- ============================================================================
-- Orchestrates the daily reset for all users whose local midnight has passed
-- in the last hour. Called by hourly cron job.

CREATE OR REPLACE FUNCTION process_daily_reset()
RETURNS TABLE(
  users_processed INTEGER,
  summaries_created INTEGER,
  streaks_updated INTEGER,
  errors JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_yesterday DATE;
  v_aggregate_result JSONB;
  v_users_processed INTEGER := 0;
  v_summaries_created INTEGER := 0;
  v_streaks_updated INTEGER := 0;
  v_errors JSONB := '[]'::jsonb;
BEGIN
  -- Find users whose local time is 00:00-00:59 (midnight hour)
  -- and who don't already have a summary for yesterday
  FOR v_user IN
    SELECT u.id, u.timezone
    FROM public.user_profiles u
    WHERE u.timezone IS NOT NULL
      AND EXTRACT(HOUR FROM now() AT TIME ZONE u.timezone) = 0
      AND NOT EXISTS (
        SELECT 1 FROM public.daily_summaries ds
        WHERE ds.user_id = u.id
          AND ds.date = (DATE(now() AT TIME ZONE u.timezone) - INTERVAL '1 day')::date
      )
  LOOP
    v_users_processed := v_users_processed + 1;

    -- Calculate yesterday's date in user's timezone
    v_yesterday := (DATE(now() AT TIME ZONE v_user.timezone) - INTERVAL '1 day')::date;

    -- Aggregate yesterday's stints
    BEGIN
      v_aggregate_result := aggregate_daily_summary(v_user.id, v_yesterday);

      IF (v_aggregate_result->>'success')::boolean THEN
        v_summaries_created := v_summaries_created + 1;

        -- Update user's streak
        BEGIN
          PERFORM update_user_streak(v_user.id, v_user.timezone);
          v_streaks_updated := v_streaks_updated + 1;
        EXCEPTION WHEN OTHERS THEN
          v_errors := v_errors || jsonb_build_object(
            'user_id', v_user.id,
            'error', 'STREAK_UPDATE_FAILED: ' || SQLERRM
          );
        END;
      ELSE
        v_errors := v_errors || jsonb_build_object(
          'user_id', v_user.id,
          'error', v_aggregate_result->>'error'
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'user_id', v_user.id,
        'error', 'AGGREGATION_FAILED: ' || SQLERRM
      );
    END;
  END LOOP;

  RETURN QUERY SELECT v_users_processed, v_summaries_created, v_streaks_updated, v_errors;
END;
$$;

COMMENT ON FUNCTION process_daily_reset() IS
  'Orchestrates daily reset for all users whose local midnight passed. Called hourly by cron.';


-- ============================================================================
-- Function: get_daily_summaries
-- ============================================================================
-- Client-facing query function for retrieving daily summaries within a date range.
-- Uses SECURITY INVOKER so RLS policies apply.

CREATE OR REPLACE FUNCTION get_daily_summaries(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE(
  id UUID,
  date DATE,
  total_stints INTEGER,
  total_focus_seconds INTEGER,
  total_pause_seconds INTEGER,
  project_breakdown JSONB,
  completed_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    ds.id,
    ds.date,
    ds.total_stints,
    ds.total_focus_seconds,
    ds.total_pause_seconds,
    ds.project_breakdown,
    ds.completed_at
  FROM public.daily_summaries ds
  WHERE ds.user_id = p_user_id
    AND ds.date BETWEEN p_start_date AND p_end_date
  ORDER BY ds.date DESC;
$$;

COMMENT ON FUNCTION get_daily_summaries(UUID, DATE, DATE) IS
  'Retrieves daily summaries for a user within a date range. RLS applies (SECURITY INVOKER).';


-- ============================================================================
-- Permissions
-- ============================================================================

-- aggregate_daily_summary and process_daily_reset are SECURITY DEFINER
-- They should NOT be callable by regular users - only by cron/service role

-- get_daily_summaries is SECURITY INVOKER and can be called by authenticated users
GRANT EXECUTE ON FUNCTION get_daily_summaries(UUID, DATE, DATE) TO authenticated;
