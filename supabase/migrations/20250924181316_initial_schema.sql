-- Database Schema for Time Tracking Application
-- Initial schema migration

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
-- This extends the built-in auth.users with additional profile data
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  expected_daily_stints INTEGER DEFAULT 2,
  custom_stint_duration INTEGER, -- in minutes, nullable for default duration
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stints table
CREATE TABLE IF NOT EXISTS public.stints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE, -- nullable for active stints
  duration_minutes INTEGER, -- calculated field, nullable for active stints
  notes TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at on record changes
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stints_updated_at BEFORE UPDATE ON public.stints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance optimization
-- Index on users.email for authentication lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Index on projects.user_id for user-specific project queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

-- Composite index on projects for active project filtering
CREATE INDEX IF NOT EXISTS idx_projects_user_active ON public.projects(user_id, is_active);

-- Index on stints.project_id for stint queries by project
CREATE INDEX IF NOT EXISTS idx_stints_project_id ON public.stints(project_id);

-- Composite index on stints for user timeline queries
CREATE INDEX IF NOT EXISTS idx_stints_user_started ON public.stints(user_id, started_at);

-- Index on stints.started_at for date-based filtering and ordering
CREATE INDEX IF NOT EXISTS idx_stints_started_at ON public.stints(started_at);

-- Partial index for active stints (performance optimization for real-time queries)
CREATE INDEX IF NOT EXISTS idx_stints_active ON public.stints(user_id, started_at)
WHERE ended_at IS NULL;

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stints ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Users can only read/update their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for projects table
-- Users can only CRUD their own projects
CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for stints table
-- Users can only CRUD stints for their own projects
CREATE POLICY "Users can view own stints" ON public.stints
  FOR SELECT USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = stints.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own stints" ON public.stints
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own stints" ON public.stints
  FOR UPDATE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = stints.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own stints" ON public.stints
  FOR DELETE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = stints.project_id
      AND projects.user_id = auth.uid()
    )
  );