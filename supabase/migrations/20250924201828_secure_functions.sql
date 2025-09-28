-- Fix Function Security - Set search_path to empty string
-- This prevents potential SQL injection through search_path manipulation

-- Drop existing triggers that depend on the function
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
DROP TRIGGER IF EXISTS update_stints_updated_at ON public.stints;

-- Drop existing function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Recreate function with secure search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate triggers with the secure function
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stints_updated_at BEFORE UPDATE ON public.stints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
