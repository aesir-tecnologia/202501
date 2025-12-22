-- Migration: Secure daily reset functions and improve error handling
-- Supports: 005-daily-reset feature (PR review fixes)
--
-- This migration:
-- 1. Revokes execute permissions on SECURITY DEFINER functions from authenticated users
-- 2. Adds RAISE WARNING for UTC timezone fallback
-- 3. Improves exception handling with SQLSTATE and critical error re-raising

-- ============================================================================
-- Security: Revoke execute permissions from authenticated users
-- ============================================================================
-- These functions should only be called by cron job (service role), not directly by users

REVOKE EXECUTE ON FUNCTION aggregate_daily_summary(UUID, DATE) FROM authenticated;
REVOKE EXECUTE ON FUNCTION aggregate_daily_summary(UUID, DATE) FROM public;

REVOKE EXECUTE ON FUNCTION process_daily_reset() FROM authenticated;
REVOKE EXECUTE ON FUNCTION process_daily_reset() FROM public;


-- ============================================================================
-- Function: aggregate_daily_summary (updated)
-- ============================================================================
-- Changes:
-- - Added RAISE WARNING when defaulting to UTC timezone

CREATE OR REPLACE FUNCTION aggregate_daily_summary(
  p_user_id UUID,
  p_date DATE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    -- Log warning and default to UTC if no timezone set
    RAISE WARNING 'User % has no timezone set, defaulting to UTC for daily summary on %', p_user_id, p_date;
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


-- ============================================================================
-- Function: process_daily_reset (updated)
-- ============================================================================
-- Changes:
-- - Added SQLSTATE to error JSONB for debugging
-- - Added re-raise for critical errors (out of memory, disk full, etc.)

CREATE OR REPLACE FUNCTION process_daily_reset()
RETURNS TABLE(
  users_processed INTEGER,
  summaries_created INTEGER,
  streaks_updated INTEGER,
  errors JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
            'error', 'STREAK_UPDATE_FAILED: ' || SQLERRM,
            'sqlstate', SQLSTATE
          );
          -- Re-raise critical errors (out of memory, disk full, connection issues)
          IF SQLSTATE IN ('53100', '53200', '53300', '57P01', '57P02', '57P03', '58030') THEN
            RAISE;
          END IF;
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
        'error', 'AGGREGATION_FAILED: ' || SQLERRM,
        'sqlstate', SQLSTATE
      );
      -- Re-raise critical errors
      IF SQLSTATE IN ('53100', '53200', '53300', '57P01', '57P02', '57P03', '58030') THEN
        RAISE;
      END IF;
    END;
  END LOOP;

  RETURN QUERY SELECT v_users_processed, v_summaries_created, v_streaks_updated, v_errors;
END;
$$;
