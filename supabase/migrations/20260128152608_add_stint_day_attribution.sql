-- Migration: Add stint day attribution feature
-- Supports: Issue #53 - Allow users to control how midnight-spanning stints are counted
--
-- This migration adds:
-- 1. stint_day_attribution enum type for preference values
-- 2. stint_day_attribution column to user_profiles
-- 3. attributed_date column to stints table
-- 4. Updates to SQL functions to respect attributed_date

-- ============================================================================
-- Create enum type for stint day attribution preference
-- ============================================================================

CREATE TYPE stint_day_attribution AS ENUM ('start_date', 'end_date', 'ask');

COMMENT ON TYPE stint_day_attribution IS
  'User preference for how midnight-spanning stints are attributed to calendar days';

-- ============================================================================
-- Add column to user_profiles
-- ============================================================================

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS stint_day_attribution stint_day_attribution NOT NULL DEFAULT 'ask';

COMMENT ON COLUMN public.user_profiles.stint_day_attribution IS
  'How to attribute stints that span midnight: start_date (always start), end_date (always end), ask (prompt each time)';

-- ============================================================================
-- Add attributed_date column to stints
-- ============================================================================

ALTER TABLE public.stints
  ADD COLUMN IF NOT EXISTS attributed_date DATE;

COMMENT ON COLUMN public.stints.attributed_date IS
  'Explicitly set date for daily stats attribution. NULL means use ended_at date. Only set for midnight-spanning stints.';

-- ============================================================================
-- Update handle_new_user() trigger to include new default
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    timezone,
    default_stint_duration,
    celebration_animation,
    desktop_notifications,
    stint_day_attribution
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
    NULL,   -- Use system default (120 min)
    true,   -- Celebration animation enabled by default
    false,  -- Desktop notifications disabled by default (requires permission)
    'ask'   -- Prompt for midnight-spanning stints by default
  )
  ON CONFLICT (id) DO NOTHING;

  -- Also ensure user_streaks entry exists
  INSERT INTO public.user_streaks (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- Update complete_stint() to accept optional attributed_date parameter
-- ============================================================================

-- Drop old function signature to prevent overload ambiguity
DROP FUNCTION IF EXISTS complete_stint(UUID, completion_type, TEXT);

CREATE OR REPLACE FUNCTION complete_stint(
  p_stint_id UUID,
  p_completion_type completion_type,
  p_notes TEXT DEFAULT NULL,
  p_attributed_date DATE DEFAULT NULL
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
    RAISE EXCEPTION 'This stint is not active or paused and cannot be completed';
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
    attributed_date = p_attributed_date,
    updated_at = NOW()
  WHERE id = p_stint_id
  RETURNING * INTO v_stint;

  RETURN v_stint;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant permissions (function signature changed)
GRANT EXECUTE ON FUNCTION complete_stint(UUID, completion_type, TEXT, DATE) TO authenticated;

COMMENT ON FUNCTION complete_stint(UUID, completion_type, TEXT, DATE) IS
  'Completes a stint with optional notes and attributed_date for midnight-spanning stints. Idempotent.';

-- ============================================================================
-- Update aggregate_daily_summary() to use attributed_date
-- ============================================================================

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
    -- Default to UTC if no timezone set
    v_timezone := 'UTC';
  END IF;

  -- Aggregate stint totals for the given date
  -- Use attributed_date if set, otherwise fall back to ended_at date
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
    AND COALESCE(attributed_date, DATE(ended_at AT TIME ZONE v_timezone)) = p_date;

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
      AND COALESCE(s.attributed_date, DATE(s.ended_at AT TIME ZONE v_timezone)) = p_date
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
  'Aggregates a single user''s completed stints into a daily_summary record. Uses attributed_date if set, falls back to ended_at. Idempotent via UPSERT.';

-- ============================================================================
-- Update calculate_streak_with_tz() to use attributed_date
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_streak_with_tz(
  p_user_id UUID,
  p_timezone TEXT DEFAULT 'UTC'
) RETURNS TABLE (
  current_streak INTEGER,
  longest_streak INTEGER,
  last_stint_date DATE,
  is_at_risk BOOLEAN
) AS $$
DECLARE
  v_today DATE;
  v_last_stint_date DATE;
  v_current_streak INTEGER := 0;
  v_longest_streak INTEGER := 0;
  v_stored_longest INTEGER := 0;
  v_is_at_risk BOOLEAN := false;
  v_check_date DATE;
  v_prev_date DATE;
  v_stint_dates DATE[];
  v_date DATE;
  v_consecutive INTEGER := 0;
BEGIN
  -- Get current date in user's timezone
  SELECT DATE(now() AT TIME ZONE p_timezone) INTO v_today;

  -- Get all unique dates with completed stints for this user
  -- Use attributed_date if set, otherwise fall back to ended_at date
  SELECT ARRAY_AGG(DISTINCT effective_date ORDER BY effective_date DESC)
  INTO v_stint_dates
  FROM (
    SELECT COALESCE(attributed_date, DATE(ended_at AT TIME ZONE p_timezone)) AS effective_date
    FROM public.stints
    WHERE user_id = p_user_id
      AND status = 'completed'
      AND ended_at IS NOT NULL
  ) dates;

  -- If no completed stints, return zeros
  IF v_stint_dates IS NULL OR array_length(v_stint_dates, 1) IS NULL THEN
    RETURN QUERY SELECT 0, 0, NULL::DATE, false;
    RETURN;
  END IF;

  -- Get the most recent stint date
  v_last_stint_date := v_stint_dates[1];

  -- Get stored longest streak
  SELECT COALESCE(us.longest_streak, 0) INTO v_stored_longest
  FROM public.user_streaks us
  WHERE us.user_id = p_user_id;

  -- Calculate current streak with 1-day grace period
  -- Streak is valid if last stint was today, yesterday, or day before (grace period)
  IF v_last_stint_date >= v_today - INTERVAL '2 days' THEN
    -- Count consecutive days going backwards from the most recent stint date
    v_check_date := v_last_stint_date;
    v_prev_date := NULL;

    FOREACH v_date IN ARRAY v_stint_dates LOOP
      IF v_prev_date IS NULL THEN
        -- First date - start counting
        v_consecutive := 1;
        v_prev_date := v_date;
      ELSIF v_prev_date - v_date <= 2 THEN
        -- Within grace period (0, 1, or 2 day gap allowed for consecutive counting)
        -- But we only count it as extending the streak if gap is 0 or 1
        IF v_prev_date - v_date <= 1 THEN
          v_consecutive := v_consecutive + 1;
        END IF;
        v_prev_date := v_date;
      ELSE
        -- Gap too large, stop counting
        EXIT;
      END IF;
    END LOOP;

    v_current_streak := v_consecutive;

    -- Determine if at risk (last stint was yesterday or day before, not today)
    IF v_last_stint_date < v_today AND v_current_streak > 0 THEN
      v_is_at_risk := true;
    END IF;
  ELSE
    -- Last stint was more than 2 days ago - streak is broken
    v_current_streak := 0;
    v_is_at_risk := false;
  END IF;

  -- Calculate longest streak ever (iterate through all dates)
  v_longest_streak := 0;
  v_consecutive := 0;
  v_prev_date := NULL;

  FOREACH v_date IN ARRAY v_stint_dates LOOP
    IF v_prev_date IS NULL THEN
      v_consecutive := 1;
      v_prev_date := v_date;
    ELSIF v_prev_date - v_date = 1 THEN
      -- Consecutive day (no gap)
      v_consecutive := v_consecutive + 1;
      v_prev_date := v_date;
    ELSE
      -- Gap found - check if this was the longest streak
      IF v_consecutive > v_longest_streak THEN
        v_longest_streak := v_consecutive;
      END IF;
      v_consecutive := 1;
      v_prev_date := v_date;
    END IF;
  END LOOP;

  -- Check final streak
  IF v_consecutive > v_longest_streak THEN
    v_longest_streak := v_consecutive;
  END IF;

  -- Use stored longest if higher (historical record)
  IF v_stored_longest > v_longest_streak THEN
    v_longest_streak := v_stored_longest;
  END IF;

  RETURN QUERY SELECT v_current_streak, v_longest_streak, v_last_stint_date, v_is_at_risk;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION calculate_streak_with_tz(UUID, TEXT) IS
  'Calculates current streak with timezone support and 1-day grace period. Uses attributed_date if set, falls back to ended_at. Returns current_streak, longest_streak, last_stint_date, and is_at_risk flag.';

-- ============================================================================
-- Update get_daily_summaries() to use attributed_date for live today data
-- ============================================================================

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
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_timezone TEXT;
  v_today DATE;
BEGIN
  -- Get user's timezone (default to UTC if not set)
  SELECT COALESCE(up.timezone, 'UTC') INTO v_timezone
  FROM public.user_profiles up
  WHERE up.id = p_user_id;

  IF v_timezone IS NULL THEN
    v_timezone := 'UTC';
  END IF;

  -- Calculate today's date in user's timezone
  v_today := (now() AT TIME ZONE v_timezone)::date;

  RETURN QUERY

  -- Part 1: Historical data from daily_summaries (excludes today)
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
    AND ds.date < v_today

  UNION ALL

  -- Part 2: Live data for today (only if today is within requested range)
  -- Uses attributed_date if set, otherwise falls back to ended_at date
  SELECT
    gen_random_uuid() AS id,
    v_today AS date,
    COALESCE(live.total_stints, 0)::INTEGER AS total_stints,
    COALESCE(live.total_focus_seconds, 0)::INTEGER AS total_focus_seconds,
    COALESCE(live.total_pause_seconds, 0)::INTEGER AS total_pause_seconds,
    COALESCE(live.project_breakdown, '[]'::jsonb) AS project_breakdown,
    now() AS completed_at
  FROM (
    SELECT
      COUNT(*)::INTEGER AS total_stints,
      COALESCE(SUM(s.actual_duration), 0)::INTEGER AS total_focus_seconds,
      COALESCE(SUM(s.paused_duration), 0)::INTEGER AS total_pause_seconds,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'project_id', breakdown.project_id,
              'project_name', breakdown.project_name,
              'stint_count', breakdown.stint_count,
              'focus_seconds', breakdown.focus_seconds
            )
            ORDER BY breakdown.focus_seconds DESC
          )
          FROM (
            SELECT
              s2.project_id,
              p.name AS project_name,
              COUNT(*)::INTEGER AS stint_count,
              COALESCE(SUM(s2.actual_duration), 0)::INTEGER AS focus_seconds
            FROM public.stints s2
            JOIN public.projects p ON p.id = s2.project_id
            WHERE s2.user_id = p_user_id
              AND s2.status = 'completed'
              AND s2.ended_at IS NOT NULL
              AND COALESCE(s2.attributed_date, (s2.ended_at AT TIME ZONE v_timezone)::date) = v_today
            GROUP BY s2.project_id, p.name
          ) breakdown
        ),
        '[]'::jsonb
      ) AS project_breakdown
    FROM public.stints s
    WHERE s.user_id = p_user_id
      AND s.status = 'completed'
      AND s.ended_at IS NOT NULL
      AND COALESCE(s.attributed_date, (s.ended_at AT TIME ZONE v_timezone)::date) = v_today
  ) live
  WHERE v_today BETWEEN p_start_date AND p_end_date

  ORDER BY date DESC;
END;
$$;

COMMENT ON FUNCTION get_daily_summaries(UUID, DATE, DATE) IS
  'Retrieves daily summaries for a user within a date range. Returns live-calculated data for today (in user timezone), pre-aggregated data for past dates. Uses attributed_date if set, falls back to ended_at.';

-- ============================================================================
-- Update auto_complete_expired_stints() to set attributed_date based on preference
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_complete_expired_stints()
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
  v_user_preference stint_day_attribution;
  v_user_timezone TEXT;
  v_start_date DATE;
  v_end_date DATE;
  v_attributed_date DATE;
BEGIN
  FOR v_stint_record IN
    SELECT
      s.id,
      s.user_id,
      s.project_id,
      s.started_at,
      s.planned_duration,
      s.paused_duration,
      -- Working time = elapsed - paused (in seconds)
      EXTRACT(EPOCH FROM (now() - s.started_at))::INTEGER - COALESCE(s.paused_duration, 0) AS working_seconds
    FROM stints s
    WHERE s.status = 'active'
      AND s.planned_duration IS NOT NULL
      AND s.started_at IS NOT NULL
    ORDER BY s.started_at ASC
  LOOP
    -- Complete if working time >= planned duration
    IF v_stint_record.working_seconds >= (v_stint_record.planned_duration * 60) THEN
      BEGIN
        -- Get user's preference and timezone
        SELECT stint_day_attribution, COALESCE(timezone, 'UTC')
        INTO v_user_preference, v_user_timezone
        FROM user_profiles
        WHERE id = v_stint_record.user_id;

        -- Calculate start and end dates in user's timezone
        v_start_date := DATE(v_stint_record.started_at AT TIME ZONE v_user_timezone);
        v_end_date := DATE(now() AT TIME ZONE v_user_timezone);

        -- Determine attributed_date based on preference
        -- Only set if stint spans midnight AND user has a preference
        IF v_start_date != v_end_date THEN
          CASE v_user_preference
            WHEN 'start_date' THEN
              v_attributed_date := v_start_date;
            WHEN 'end_date' THEN
              v_attributed_date := v_end_date;
            ELSE
              -- 'ask' preference: leave NULL for auto-completed stints (defaults to end date behavior)
              v_attributed_date := NULL;
          END CASE;
        ELSE
          -- Same day, no attribution needed
          v_attributed_date := NULL;
        END IF;

        PERFORM complete_stint(v_stint_record.id, 'auto'::completion_type, NULL, v_attributed_date);
        v_completed_count := v_completed_count + 1;
        v_completed_ids := array_append(v_completed_ids, v_stint_record.id);

        RAISE NOTICE 'Auto-completed stint % (working: % sec, planned: % min, attributed: %)',
          v_stint_record.id,
          v_stint_record.working_seconds,
          v_stint_record.planned_duration,
          v_attributed_date;

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
  'Auto-completes active stints where working_time >= planned_duration. Sets attributed_date for midnight-spanning stints based on user preference.';
