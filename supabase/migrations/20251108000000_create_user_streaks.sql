-- Migration: Create user_streaks table for streak tracking
-- Supports Phase 3: Stint Management Core
-- Note: Full streak calculation requires timezone support (to be added later)

-- Create user_streaks table
CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_stint_date DATE,
  streak_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for streak queries
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON public.user_streaks(user_id);

-- Enable RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read own streaks
CREATE POLICY "Users can read own streaks" ON public.user_streaks
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users cannot directly insert/update streaks (system-managed)
-- Streaks will be updated via database functions or application logic

-- Function: Calculate streak for a user
-- Note: Simplified version using UTC timezone. Will be enhanced when timezone column is added to user_profiles
CREATE OR REPLACE FUNCTION calculate_streak(p_user_id UUID) RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_current_date DATE;
  v_last_date DATE;
  v_consecutive_days INTEGER := 0;
BEGIN
  -- Get current date in UTC (will be enhanced to use user's timezone later)
  SELECT DATE(now() AT TIME ZONE 'UTC') INTO v_current_date;
  
  -- Get last stint date from user_streaks
  SELECT last_stint_date INTO v_last_date 
  FROM public.user_streaks 
  WHERE user_id = p_user_id;
  
  -- If no last stint date, return 0
  IF v_last_date IS NULL THEN
    RETURN 0;
  END IF;
  
  -- If last stint was today or yesterday, start counting
  IF v_last_date >= v_current_date - INTERVAL '1 day' THEN
    -- Count consecutive days with completed stints going backwards from last_date
    -- This is a simplified algorithm - will be enhanced with proper timezone support
    SELECT COUNT(*) INTO v_consecutive_days
    FROM (
      SELECT DISTINCT DATE(started_at AT TIME ZONE 'UTC') as stint_date
      FROM public.stints
      WHERE user_id = p_user_id 
        AND status = 'completed'
        AND DATE(started_at AT TIME ZONE 'UTC') <= v_last_date
        AND DATE(started_at AT TIME ZONE 'UTC') >= v_current_date - INTERVAL '30 days'
      ORDER BY stint_date DESC
    ) AS daily_stints
    WHERE stint_date >= v_current_date - INTERVAL '1 day' * v_consecutive_days;
    
    -- Simple consecutive day check (allows 1 day grace period)
    v_streak := v_consecutive_days;
  END IF;
  
  RETURN GREATEST(0, v_streak);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION calculate_streak(UUID) TO authenticated;

-- Comment explaining the function
COMMENT ON FUNCTION calculate_streak(UUID) IS
  'Calculates current streak for a user. Simplified version using UTC timezone. Will be enhanced when timezone column is added to user_profiles table.';



