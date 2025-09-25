-- Fix Function Security - Set search_path to empty string
-- This prevents potential SQL injection through search_path manipulation

-- Drop existing triggers that depend on the function
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
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
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stints_updated_at BEFORE UPDATE ON public.stints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();