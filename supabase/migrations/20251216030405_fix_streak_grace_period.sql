-- Migration: Fix grace period from 2 days to 1 day
-- Fixes: Inconsistent grace period logic in calculate_streak_with_tz
--
-- PROBLEM:
-- The outer condition allowed 2-day gaps (INTERVAL '2 days') but inner counter
-- only incremented for 1-day gaps (<= 1). This created "zombie streaks" that
-- appeared active but had incorrect counts.
--
-- FIX:
-- Per spec (docs/03-feature-requirements.md:241): "Grace period: 1 day"
-- - Outer condition: INTERVAL '2 days' → INTERVAL '1 day'
-- - Loop condition: <= 2 → <= 1
-- - Remove redundant nested IF (was only incrementing for <= 1 anyway)

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

  -- Get all unique dates with completed stints for this user (in user's timezone)
  SELECT ARRAY_AGG(DISTINCT DATE(ended_at AT TIME ZONE p_timezone) ORDER BY DATE(ended_at AT TIME ZONE p_timezone) DESC)
  INTO v_stint_dates
  FROM public.stints
  WHERE user_id = p_user_id
    AND status = 'completed'
    AND ended_at IS NOT NULL;

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
  -- Streak is valid if last stint was today or yesterday (1-day grace)
  IF v_last_stint_date >= v_today - INTERVAL '1 day' THEN
    -- Count consecutive days going backwards from the most recent stint date
    v_check_date := v_last_stint_date;
    v_prev_date := NULL;

    FOREACH v_date IN ARRAY v_stint_dates LOOP
      IF v_prev_date IS NULL THEN
        -- First date - start counting
        v_consecutive := 1;
        v_prev_date := v_date;
      ELSIF v_prev_date - v_date <= 1 THEN
        -- Within grace period (0 or 1 day gap allowed for consecutive counting)
        v_consecutive := v_consecutive + 1;
        v_prev_date := v_date;
      ELSE
        -- Gap too large, stop counting
        EXIT;
      END IF;
    END LOOP;

    v_current_streak := v_consecutive;

    -- Determine if at risk (last stint was yesterday, not today)
    IF v_last_stint_date < v_today AND v_current_streak > 0 THEN
      v_is_at_risk := true;
    END IF;
  ELSE
    -- Last stint was more than 1 day ago - streak is broken
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
  'Calculates current streak with timezone support and 1-day grace period. Returns current_streak, longest_streak, last_stint_date, and is_at_risk flag.';
