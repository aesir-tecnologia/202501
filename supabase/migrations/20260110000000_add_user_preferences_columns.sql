-- Migration: Add user preference columns to user_profiles
-- Supports: User Preferences feature (persistent settings across devices)
--
-- Design decision: Extending user_profiles rather than creating a separate table
-- because we only have 3 preference fields. This avoids JOIN complexity and
-- leverages existing RLS policies.

-- ============================================================================
-- Add preference columns to user_profiles
-- ============================================================================

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS default_stint_duration INTEGER
    CHECK (default_stint_duration IS NULL OR (default_stint_duration >= 5 AND default_stint_duration <= 480)),
  ADD COLUMN IF NOT EXISTS celebration_animation BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS desktop_notifications BOOLEAN NOT NULL DEFAULT false;

-- ============================================================================
-- Column documentation
-- ============================================================================

COMMENT ON COLUMN public.user_profiles.default_stint_duration IS
  'Default stint duration in minutes (5-480). NULL means use system default (120 min).';

COMMENT ON COLUMN public.user_profiles.celebration_animation IS
  'Show confetti animation when daily goal is reached.';

COMMENT ON COLUMN public.user_profiles.desktop_notifications IS
  'Enable browser notifications for stint completion.';

-- ============================================================================
-- Update handle_new_user() trigger to include preference defaults
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
    desktop_notifications
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
    NULL,   -- Use system default (120 min)
    true,   -- Celebration animation enabled by default
    false   -- Desktop notifications disabled by default (requires permission)
  )
  ON CONFLICT (id) DO NOTHING;

  -- Also ensure user_streaks entry exists
  INSERT INTO public.user_streaks (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
