-- Migration: Add is_at_risk to update_user_streak return type
-- Fixes: Inefficient double fetch in updateStreakAfterCompletion
--
-- The update_user_streak function already internally calls calculate_streak_with_tz
-- which computes is_at_risk, but was not including it in the return type.
-- This caused the TypeScript layer to make an additional RPC call just to get is_at_risk.

-- Must drop first because CREATE OR REPLACE cannot change return type
DROP FUNCTION IF EXISTS update_user_streak(UUID, TEXT);

CREATE OR REPLACE FUNCTION update_user_streak(
  p_user_id UUID,
  p_timezone TEXT DEFAULT 'UTC'
) RETURNS TABLE (
  current_streak INTEGER,
  longest_streak INTEGER,
  last_stint_date DATE,
  is_at_risk BOOLEAN
) AS $$
DECLARE
  v_result RECORD;
BEGIN
  -- Calculate current streak values (already includes is_at_risk)
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

  -- Now includes is_at_risk in the return
  RETURN QUERY SELECT v_result.current_streak, v_result.longest_streak, v_result.last_stint_date, v_result.is_at_risk;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant execute permission after DROP
GRANT EXECUTE ON FUNCTION update_user_streak(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION update_user_streak(UUID, TEXT) IS
  'Updates user_streaks table after stint completion. Returns current_streak, longest_streak, last_stint_date, and is_at_risk.';
