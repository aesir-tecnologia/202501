-- Fix RLS Policy Performance Issues
-- Replace auth.uid() with (select auth.uid()) to prevent re-evaluation per row

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

DROP POLICY IF EXISTS "Users can view own stints" ON public.stints;
DROP POLICY IF EXISTS "Users can insert own stints" ON public.stints;
DROP POLICY IF EXISTS "Users can update own stints" ON public.stints;
DROP POLICY IF EXISTS "Users can delete own stints" ON public.stints;

-- Create optimized RLS Policies for users table
-- Users can only read/update their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- Create optimized RLS Policies for projects table
-- Users can only CRUD their own projects
CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own projects" ON public.projects
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Create optimized RLS Policies for stints table
-- Users can only CRUD stints for their own projects
CREATE POLICY "Users can view own stints" ON public.stints
  FOR SELECT USING (
    (select auth.uid()) = user_id AND
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = stints.project_id
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own stints" ON public.stints
  FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id AND
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_id
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own stints" ON public.stints
  FOR UPDATE USING (
    (select auth.uid()) = user_id AND
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = stints.project_id
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own stints" ON public.stints
  FOR DELETE USING (
    (select auth.uid()) = user_id AND
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = stints.project_id
      AND projects.user_id = (select auth.uid())
    )
  );