-- Migration: Enhance streak calculation functions with timezone support and grace period
-- Supports: 004-streak-counter feature
--
-- This migration adds:
-- 1. calculate_streak_with_tz() - Enhanced streak calculation with timezone support
-- 2. update_user_streak() - RPC function to update streak after stint completion
-- 3. RLS policy for streak updates via RPC

-- Drop existing function to replace with enhanced version
DROP FUNCTION IF EXISTS calculate_streak(UUID);

-- Function: Calculate streak with timezone support and grace period
-- Returns current streak, longest streak, last stint date, and at-risk status
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION calculate_streak_with_tz(UUID, TEXT) TO authenticated;

-- Comment
COMMENT ON FUNCTION calculate_streak_with_tz(UUID, TEXT) IS
  'Calculates current streak with timezone support and 1-day grace period. Returns current_streak, longest_streak, last_stint_date, and is_at_risk flag.';


-- Function: Update user streak after stint completion
-- This is called after a stint is completed to update the user_streaks table
CREATE OR REPLACE FUNCTION update_user_streak(
  p_user_id UUID,
  p_timezone TEXT DEFAULT 'UTC'
) RETURNS TABLE (
  current_streak INTEGER,
  longest_streak INTEGER,
  last_stint_date DATE
) AS $$
DECLARE
  v_result RECORD;
BEGIN
  -- Calculate current streak values
  SELECT * INTO v_result
  FROM calculate_streak_with_tz(p_user_id, p_timezone);

  -- Upsert into user_streaks table
  INSERT INTO public.user_streaks (
    user_id,
    current_streak,
    longest_streak,
    last_stint_date,
    streak_updated_at
  ) VALUES (
    p_user_id,
    v_result.current_streak,
    v_result.longest_streak,
    v_result.last_stint_date,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = EXCLUDED.current_streak,
    longest_streak = GREATEST(public.user_streaks.longest_streak, EXCLUDED.longest_streak),
    last_stint_date = EXCLUDED.last_stint_date,
    streak_updated_at = now();

  RETURN QUERY SELECT v_result.current_streak, v_result.longest_streak, v_result.last_stint_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_user_streak(UUID, TEXT) TO authenticated;

-- Comment
COMMENT ON FUNCTION update_user_streak(UUID, TEXT) IS
  'Updates user_streaks table after stint completion. Should be called via RPC after completeStint.';


-- Add RLS policy for INSERT (needed for upsert in update_user_streak)
-- The function runs as SECURITY DEFINER so it can insert/update
-- Users can only read their own streaks (existing policy)
-- Note: Using DO block to handle "policy already exists" gracefully
DO $$
BEGIN
  -- Drop existing policies if they exist to avoid conflicts
  DROP POLICY IF EXISTS "Users can insert own streaks" ON public.user_streaks;
  DROP POLICY IF EXISTS "Users can update own streaks" ON public.user_streaks;

  -- Create new policies
  CREATE POLICY "Users can insert own streaks" ON public.user_streaks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update own streaks" ON public.user_streaks
    FOR UPDATE USING (auth.uid() = user_id);
END $$;


-- Backward compatibility: Create alias for old function name
CREATE OR REPLACE FUNCTION calculate_streak(p_user_id UUID) RETURNS INTEGER AS $$
DECLARE
  v_result RECORD;
BEGIN
  SELECT * INTO v_result FROM calculate_streak_with_tz(p_user_id, 'UTC');
  RETURN v_result.current_streak;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION calculate_streak(UUID) TO authenticated;

COMMENT ON FUNCTION calculate_streak(UUID) IS
  'Backward-compatible wrapper for calculate_streak_with_tz. Uses UTC timezone.';
