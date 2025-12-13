-- ============================================================================
-- LifeStint Development Seed Data
-- ============================================================================
-- This seed file creates realistic test data for development and testing.
-- It includes multiple user profiles with varying usage patterns to test
-- different scenarios like active users, new users, and power users.
--
-- IMPORTANT: This file is for LOCAL DEVELOPMENT ONLY.
-- Never run this on production databases.
--
-- Usage: supabase db reset (automatically runs this file)
-- ============================================================================

-- First, we need to create test users in auth.users
-- The trigger will automatically create user_profiles entries

-- Developer Account (Marco)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  aud,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'marco.machado@gmail.com',
  crypt('password', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Marco Machado"}',
  now() - interval '30 days',
  now(),
  '',
  '',
  '',
  '',
  'authenticated',
  'authenticated'
);

-- Test User 1: Power User (heavy usage, multiple projects, long history)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  aud,
  role
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'power.user@example.com',
  crypt('password123', gen_salt('bf')),
  now() - interval '90 days',
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Alex Power"}',
  now() - interval '90 days',
  now(),
  '',
  '',
  '',
  '',
  'authenticated',
  'authenticated'
);

-- Test User 2: Regular User (moderate usage)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  aud,
  role
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'regular.user@example.com',
  crypt('password123', gen_salt('bf')),
  now() - interval '30 days',
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Sam Regular"}',
  now() - interval '30 days',
  now(),
  '',
  '',
  '',
  '',
  'authenticated',
  'authenticated'
);

-- Test User 3: New User (just started, minimal data)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  aud,
  role
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'new.user@example.com',
  crypt('password123', gen_salt('bf')),
  now() - interval '2 days',
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Jordan New"}',
  now() - interval '2 days',
  now(),
  '',
  '',
  '',
  '',
  'authenticated',
  'authenticated'
);

-- Test User 4: Inactive User (had activity but stopped)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  aud,
  role
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  '00000000-0000-0000-0000-000000000000',
  'inactive.user@example.com',
  crypt('password123', gen_salt('bf')),
  now() - interval '60 days',
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Chris Inactive"}',
  now() - interval '60 days',
  now(),
  '',
  '',
  '',
  '',
  'authenticated',
  'authenticated'
);

-- ============================================================================
-- PROJECTS
-- ============================================================================
-- Projects represent client work or personal tasks that users track stints for.
-- Each project has customizable settings like expected daily stints and duration.

-- Power User Projects (6 projects with varied settings)
INSERT INTO public.projects (id, user_id, name, expected_daily_stints, custom_stint_duration, color_tag, is_active, sort_order, created_at)
VALUES
  -- Active client projects
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Acme Corp Website Redesign', 4, 90, 'blue', true, 0, now() - interval '85 days'),
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'TechStart Mobile App', 3, 60, 'green', true, 1, now() - interval '60 days'),
  ('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Global Finance Dashboard', 2, 120, 'purple', true, 2, now() - interval '45 days'),
  ('a4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Personal Blog', 1, NULL, 'orange', true, 3, now() - interval '80 days'),
  -- Archived project
  ('a5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Legacy System Migration', 2, 90, 'red', false, 4, now() - interval '70 days'),
  -- No color tag project
  ('a6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Open Source Contributions', 1, 45, NULL, true, 5, now() - interval '30 days');

-- Regular User Projects (3 projects)
INSERT INTO public.projects (id, user_id, name, expected_daily_stints, custom_stint_duration, color_tag, is_active, sort_order, created_at)
VALUES
  ('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Freelance Design Work', 2, 60, 'pink', true, 0, now() - interval '25 days'),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'E-commerce Store Build', 3, 90, 'teal', true, 1, now() - interval '20 days'),
  ('b3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Side Project: Recipe App', 1, NULL, 'amber', true, 2, now() - interval '15 days');

-- New User Projects (1 project - just getting started)
INSERT INTO public.projects (id, user_id, name, expected_daily_stints, custom_stint_duration, color_tag, is_active, sort_order, created_at)
VALUES
  ('c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'My First Project', 2, NULL, 'green', true, 0, now() - interval '1 day');

-- Inactive User Projects (2 projects - both inactive now)
INSERT INTO public.projects (id, user_id, name, expected_daily_stints, custom_stint_duration, color_tag, is_active, sort_order, created_at)
VALUES
  ('d1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Client Website', 2, 60, 'blue', false, 0, now() - interval '55 days'),
  ('d2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Marketing Campaign', 1, 45, 'orange', false, 1, now() - interval '50 days');

-- Marco's Dev Account Projects (realistic work projects)
INSERT INTO public.projects (id, user_id, name, expected_daily_stints, custom_stint_duration, color_tag, is_active, sort_order, created_at)
VALUES
  ('e1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'LifeStint Development', 3, 90, 'purple', true, 0, now() - interval '25 days'),
  ('e2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Client: Startup MVP', 2, 60, 'blue', true, 1, now() - interval '20 days'),
  ('e3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Learning & Research', 1, 45, 'green', true, 2, now() - interval '15 days'),
  ('e4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', 'Admin & Planning', 1, 30, 'amber', true, 3, now() - interval '10 days');

-- ============================================================================
-- STINTS
-- ============================================================================
-- Stints are focused work sessions. We create a realistic history showing
-- various patterns: completed sessions, interrupted sessions, different
-- durations, and varying completion types.

-- Helper function to generate timestamps for stints
-- (This creates more natural-looking work patterns)

-- Power User Stints: Heavy usage over 3 months
-- We'll create stints for workdays, avoiding weekends for realism

-- Week 1 of current month (recent completed stints)
INSERT INTO public.stints (id, user_id, project_id, planned_duration, actual_duration, status, completion_type, started_at, ended_at, paused_duration, notes, created_at)
VALUES
  -- Yesterday - 3 completed stints
  ('10000001-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111',
   90, 5450, 'completed', 'manual',
   (now() - interval '1 day')::date + time '09:00:00',
   (now() - interval '1 day')::date + time '10:30:50',
   0, 'Finalized homepage hero section design', now() - interval '1 day'),

  ('10000001-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111',
   90, 5400, 'completed', 'auto',
   (now() - interval '1 day')::date + time '11:00:00',
   (now() - interval '1 day')::date + time '12:30:00',
   0, 'Responsive breakpoints for navigation', now() - interval '1 day'),

  ('10000001-0001-0001-0001-000000000003', '11111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222',
   60, 3650, 'completed', 'manual',
   (now() - interval '1 day')::date + time '14:00:00',
   (now() - interval '1 day')::date + time '15:01:00',
   0, 'User authentication flow UI', now() - interval '1 day'),

  -- 2 days ago - mixed completion types
  ('10000001-0001-0001-0001-000000000004', '11111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333',
   120, 7200, 'completed', 'auto',
   (now() - interval '2 days')::date + time '09:30:00',
   (now() - interval '2 days')::date + time '11:30:00',
   0, 'Dashboard charts implementation', now() - interval '2 days'),

  ('10000001-0001-0001-0001-000000000005', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111',
   90, 2700, 'interrupted', 'interrupted',
   (now() - interval '2 days')::date + time '13:00:00',
   (now() - interval '2 days')::date + time '13:45:00',
   0, 'Client call interrupted session', now() - interval '2 days'),

  ('10000001-0001-0001-0001-000000000006', '11111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222',
   60, 3600, 'completed', 'manual',
   (now() - interval '2 days')::date + time '15:00:00',
   (now() - interval '2 days')::date + time '16:00:00',
   0, 'Push notification setup', now() - interval '2 days'),

  -- 3 days ago
  ('10000001-0001-0001-0001-000000000007', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111',
   90, 5700, 'completed', 'manual',
   (now() - interval '3 days')::date + time '10:00:00',
   (now() - interval '3 days')::date + time '11:35:00',
   300, 'Footer redesign with pause for coffee', now() - interval '3 days'),

  ('10000001-0001-0001-0001-000000000008', '11111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333',
   120, 7200, 'completed', 'auto',
   (now() - interval '3 days')::date + time '14:00:00',
   (now() - interval '3 days')::date + time '16:00:00',
   0, 'Data table sorting and filtering', now() - interval '3 days'),

  -- 4 days ago
  ('10000001-0001-0001-0001-000000000009', '11111111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444',
   120, 4500, 'completed', 'manual',
   (now() - interval '4 days')::date + time '19:00:00',
   (now() - interval '4 days')::date + time '20:15:00',
   0, 'Blog post: TypeScript best practices', now() - interval '4 days'),

  ('10000001-0001-0001-0001-000000000010', '11111111-1111-1111-1111-111111111111', 'a6666666-6666-6666-6666-666666666666',
   45, 2700, 'completed', 'auto',
   (now() - interval '4 days')::date + time '21:00:00',
   (now() - interval '4 days')::date + time '21:45:00',
   0, 'PR review for vue-use', now() - interval '4 days'),

  -- 5 days ago
  ('10000001-0001-0001-0001-000000000011', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111',
   90, 5400, 'completed', 'auto',
   (now() - interval '5 days')::date + time '09:00:00',
   (now() - interval '5 days')::date + time '10:30:00',
   0, 'Contact form validation', now() - interval '5 days'),

  ('10000001-0001-0001-0001-000000000012', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111',
   90, 5400, 'completed', 'manual',
   (now() - interval '5 days')::date + time '11:00:00',
   (now() - interval '5 days')::date + time '12:30:00',
   0, 'Services page layout', now() - interval '5 days'),

  ('10000001-0001-0001-0001-000000000013', '11111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222',
   60, 3600, 'completed', 'auto',
   (now() - interval '5 days')::date + time '14:30:00',
   (now() - interval '5 days')::date + time '15:30:00',
   0, 'App onboarding screens', now() - interval '5 days');

-- Week 2-4 of previous months (historical data for analytics)
-- Adding more stints for a realistic 60-day history

INSERT INTO public.stints (id, user_id, project_id, planned_duration, actual_duration, status, completion_type, started_at, ended_at, paused_duration, notes, created_at)
SELECT
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  (CASE (random() * 4)::int
    WHEN 0 THEN 'a1111111-1111-1111-1111-111111111111'
    WHEN 1 THEN 'a2222222-2222-2222-2222-222222222222'
    WHEN 2 THEN 'a3333333-3333-3333-3333-333333333333'
    WHEN 3 THEN 'a4444444-4444-4444-4444-444444444444'
    ELSE 'a6666666-6666-6666-6666-666666666666'
  END)::uuid,
  90,   -- 90 min planned (minutes)
  5400, -- 90 min actual (seconds)
  'completed',
  CASE (random() * 2)::int
    WHEN 0 THEN 'manual'
    ELSE 'auto'
  END::completion_type,
  base_time,
  base_time + interval '90 minutes',
  0,
  CASE (random() * 5)::int
    WHEN 0 THEN 'Deep work session'
    WHEN 1 THEN 'Code review and refactoring'
    WHEN 2 THEN 'Feature implementation'
    WHEN 3 THEN 'Bug fixes and testing'
    ELSE NULL
  END,
  date_trunc('day', base_time)
FROM (
  SELECT
    generate_series,
    date_trunc('day', now() - (generate_series * interval '1 day')) + (time '09:00:00' + (random() * interval '4 hours')) as base_time
  FROM generate_series(6, 60)
  WHERE EXTRACT(DOW FROM now() - (generate_series * interval '1 day')) NOT IN (0, 6)
) as day_data;

-- Regular User Stints (2 weeks of history)
INSERT INTO public.stints (id, user_id, project_id, planned_duration, actual_duration, status, completion_type, started_at, ended_at, paused_duration, notes, created_at)
VALUES
  -- Yesterday
  ('20000002-0001-0001-0001-000000000001', '22222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111',
   60, 3600, 'completed', 'manual',
   (now() - interval '1 day')::date + time '10:00:00',
   (now() - interval '1 day')::date + time '11:00:00',
   0, 'Logo concepts for client', now() - interval '1 day'),

  ('20000002-0001-0001-0001-000000000002', '22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222',
   90, 5400, 'completed', 'auto',
   (now() - interval '1 day')::date + time '14:00:00',
   (now() - interval '1 day')::date + time '15:30:00',
   0, 'Product listing page', now() - interval '1 day'),

  -- 2 days ago
  ('20000002-0001-0001-0001-000000000003', '22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222',
   90, 5400, 'completed', 'manual',
   (now() - interval '2 days')::date + time '09:00:00',
   (now() - interval '2 days')::date + time '10:30:00',
   0, 'Shopping cart functionality', now() - interval '2 days'),

  ('20000002-0001-0001-0001-000000000004', '22222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111',
   60, 2400, 'interrupted', 'interrupted',
   (now() - interval '2 days')::date + time '15:00:00',
   (now() - interval '2 days')::date + time '15:40:00',
   0, 'Had to pick up kids', now() - interval '2 days'),

  -- 3 days ago
  ('20000002-0001-0001-0001-000000000005', '22222222-2222-2222-2222-222222222222', 'b3333333-3333-3333-3333-333333333333',
   120, 5400, 'completed', 'manual',
   (now() - interval '3 days')::date + time '20:00:00',
   (now() - interval '3 days')::date + time '21:30:00',
   0, 'Recipe API integration', now() - interval '3 days'),

  -- 4-7 days ago
  ('20000002-0001-0001-0001-000000000006', '22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222',
   90, 5400, 'completed', 'auto',
   (now() - interval '4 days')::date + time '10:00:00',
   (now() - interval '4 days')::date + time '11:30:00',
   0, 'Checkout flow design', now() - interval '4 days'),

  ('20000002-0001-0001-0001-000000000007', '22222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111',
   60, 3600, 'completed', 'manual',
   (now() - interval '5 days')::date + time '14:00:00',
   (now() - interval '5 days')::date + time '15:00:00',
   0, 'Brand style guide finalization', now() - interval '5 days'),

  ('20000002-0001-0001-0001-000000000008', '22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222',
   90, 5400, 'completed', 'auto',
   (now() - interval '6 days')::date + time '09:30:00',
   (now() - interval '6 days')::date + time '11:00:00',
   0, 'Payment gateway setup', now() - interval '6 days'),

  ('20000002-0001-0001-0001-000000000009', '22222222-2222-2222-2222-222222222222', 'b3333333-3333-3333-3333-333333333333',
   120, 7200, 'completed', 'manual',
   (now() - interval '7 days')::date + time '19:00:00',
   (now() - interval '7 days')::date + time '21:00:00',
   0, 'Database schema for recipes', now() - interval '7 days');

-- New User Stints (just a couple from yesterday and today)
INSERT INTO public.stints (id, user_id, project_id, planned_duration, actual_duration, status, completion_type, started_at, ended_at, paused_duration, notes, created_at)
VALUES
  ('30000003-0001-0001-0001-000000000001', '33333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111',
   120, 7200, 'completed', 'manual',
   (now() - interval '1 day')::date + time '10:00:00',
   (now() - interval '1 day')::date + time '12:00:00',
   0, 'Getting started with the project setup', now() - interval '1 day'),

  ('30000003-0001-0001-0001-000000000002', '33333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111',
   120, 4200, 'completed', 'manual',
   (now() - interval '1 day')::date + time '14:00:00',
   (now() - interval '1 day')::date + time '15:10:00',
   0, 'Reading documentation and planning', now() - interval '1 day');

-- Inactive User Stints (old completed stints, nothing recent)
INSERT INTO public.stints (id, user_id, project_id, planned_duration, actual_duration, status, completion_type, started_at, ended_at, paused_duration, notes, created_at)
VALUES
  ('40000004-0001-0001-0001-000000000001', '44444444-4444-4444-4444-444444444444', 'd1111111-1111-1111-1111-111111111111',
   60, 3600, 'completed', 'auto',
   (now() - interval '45 days')::date + time '10:00:00',
   (now() - interval '45 days')::date + time '11:00:00',
   0, 'Initial wireframes', now() - interval '45 days'),

  ('40000004-0001-0001-0001-000000000002', '44444444-4444-4444-4444-444444444444', 'd1111111-1111-1111-1111-111111111111',
   60, 3600, 'completed', 'manual',
   (now() - interval '44 days')::date + time '14:00:00',
   (now() - interval '44 days')::date + time '15:00:00',
   0, 'Homepage design', now() - interval '44 days'),

  ('40000004-0001-0001-0001-000000000003', '44444444-4444-4444-4444-444444444444', 'd2222222-2222-2222-2222-222222222222',
   45, 2700, 'completed', 'auto',
   (now() - interval '43 days')::date + time '11:00:00',
   (now() - interval '43 days')::date + time '11:45:00',
   0, 'Campaign brief review', now() - interval '43 days'),

  ('40000004-0001-0001-0001-000000000004', '44444444-4444-4444-4444-444444444444', 'd1111111-1111-1111-1111-111111111111',
   60, 1800, 'interrupted', 'interrupted',
   (now() - interval '42 days')::date + time '09:00:00',
   (now() - interval '42 days')::date + time '09:30:00',
   0, 'Project cancelled mid-session', now() - interval '42 days');

-- Marco's Dev Account Stints (realistic recent work history)
INSERT INTO public.stints (id, user_id, project_id, planned_duration, actual_duration, status, completion_type, started_at, ended_at, paused_duration, notes, created_at)
VALUES
  -- Yesterday - LifeStint development
  ('50000005-0001-0001-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'e1111111-1111-1111-1111-111111111111',
   90, 5400, 'completed', 'manual',
   (now() - interval '1 day')::date + time '09:00:00',
   (now() - interval '1 day')::date + time '10:30:00',
   0, 'Seed data generator implementation', now() - interval '1 day'),

  ('50000005-0001-0001-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'e1111111-1111-1111-1111-111111111111',
   90, 5400, 'completed', 'auto',
   (now() - interval '1 day')::date + time '11:00:00',
   (now() - interval '1 day')::date + time '12:30:00',
   0, 'Timer component refactoring', now() - interval '1 day'),

  ('50000005-0001-0001-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'e2222222-2222-2222-2222-222222222222',
   60, 3600, 'completed', 'manual',
   (now() - interval '1 day')::date + time '14:00:00',
   (now() - interval '1 day')::date + time '15:00:00',
   0, 'Client feedback implementation', now() - interval '1 day'),

  -- 2 days ago
  ('50000005-0001-0001-0001-000000000004', '00000000-0000-0000-0000-000000000001', 'e1111111-1111-1111-1111-111111111111',
   90, 5400, 'completed', 'auto',
   (now() - interval '2 days')::date + time '09:30:00',
   (now() - interval '2 days')::date + time '11:00:00',
   0, 'Dashboard analytics charts', now() - interval '2 days'),

  ('50000005-0001-0001-0001-000000000005', '00000000-0000-0000-0000-000000000001', 'e3333333-3333-3333-3333-333333333333',
   45, 2700, 'completed', 'manual',
   (now() - interval '2 days')::date + time '15:00:00',
   (now() - interval '2 days')::date + time '15:45:00',
   0, 'TanStack Query v5 docs review', now() - interval '2 days'),

  -- 3 days ago
  ('50000005-0001-0001-0001-000000000006', '00000000-0000-0000-0000-000000000001', 'e2222222-2222-2222-2222-222222222222',
   60, 3600, 'completed', 'auto',
   (now() - interval '3 days')::date + time '10:00:00',
   (now() - interval '3 days')::date + time '11:00:00',
   0, 'API endpoints implementation', now() - interval '3 days'),

  ('50000005-0001-0001-0001-000000000007', '00000000-0000-0000-0000-000000000001', 'e2222222-2222-2222-2222-222222222222',
   60, 2400, 'interrupted', 'interrupted',
   (now() - interval '3 days')::date + time '14:00:00',
   (now() - interval '3 days')::date + time '14:40:00',
   0, 'Emergency client call', now() - interval '3 days'),

  ('50000005-0001-0001-0001-000000000008', '00000000-0000-0000-0000-000000000001', 'e1111111-1111-1111-1111-111111111111',
   90, 5400, 'completed', 'manual',
   (now() - interval '3 days')::date + time '16:00:00',
   (now() - interval '3 days')::date + time '17:30:00',
   0, 'Stint completion modal', now() - interval '3 days'),

  -- 4 days ago
  ('50000005-0001-0001-0001-000000000009', '00000000-0000-0000-0000-000000000001', 'e4444444-4444-4444-4444-444444444444',
   30, 1800, 'completed', 'auto',
   (now() - interval '4 days')::date + time '09:00:00',
   (now() - interval '4 days')::date + time '09:30:00',
   0, 'Weekly planning session', now() - interval '4 days'),

  ('50000005-0001-0001-0001-000000000010', '00000000-0000-0000-0000-000000000001', 'e1111111-1111-1111-1111-111111111111',
   90, 5700, 'completed', 'manual',
   (now() - interval '4 days')::date + time '10:00:00',
   (now() - interval '4 days')::date + time '11:35:00',
   300, 'Database migrations with coffee break', now() - interval '4 days'),

  -- 5 days ago
  ('50000005-0001-0001-0001-000000000011', '00000000-0000-0000-0000-000000000001', 'e3333333-3333-3333-3333-333333333333',
   45, 2700, 'completed', 'auto',
   (now() - interval '5 days')::date + time '19:00:00',
   (now() - interval '5 days')::date + time '19:45:00',
   0, 'Nuxt 4 migration guide', now() - interval '5 days'),

  ('50000005-0001-0001-0001-000000000012', '00000000-0000-0000-0000-000000000001', 'e1111111-1111-1111-1111-111111111111',
   90, 5400, 'completed', 'manual',
   (now() - interval '5 days')::date + time '14:00:00',
   (now() - interval '5 days')::date + time '15:30:00',
   0, 'Project settings page', now() - interval '5 days');

-- ============================================================================
-- USER STREAKS
-- ============================================================================
-- Streak data is automatically maintained by triggers, but we set initial values
-- to reflect the seeded stint history.

INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_stint_date, streak_updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 5, 8, (now() - interval '1 day')::date, now()),
  ('11111111-1111-1111-1111-111111111111', 5, 12, (now() - interval '1 day')::date, now()),
  ('22222222-2222-2222-2222-222222222222', 3, 7, (now() - interval '1 day')::date, now()),
  ('33333333-3333-3333-3333-333333333333', 1, 1, (now() - interval '1 day')::date, now()),
  ('44444444-4444-4444-4444-444444444444', 0, 4, (now() - interval '42 days')::date, now() - interval '42 days')
ON CONFLICT (user_id) DO UPDATE
SET
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  last_stint_date = EXCLUDED.last_stint_date,
  streak_updated_at = EXCLUDED.streak_updated_at;

-- ============================================================================
-- VERIFICATION QUERIES (for debugging - can be removed in production)
-- ============================================================================
-- These queries help verify the seed data was inserted correctly.
-- Run them manually in the Supabase SQL editor if needed.

-- SELECT 'Users created:' as info, count(*) as count FROM auth.users;
-- SELECT 'User profiles created:' as info, count(*) as count FROM public.user_profiles;
-- SELECT 'Projects created:' as info, count(*) as count FROM public.projects;
-- SELECT 'Stints created:' as info, count(*) as count FROM public.stints;
-- SELECT 'Streaks created:' as info, count(*) as count FROM public.user_streaks;

-- Per-user breakdown:
-- SELECT
--   u.email,
--   (SELECT count(*) FROM public.projects p WHERE p.user_id = u.id) as projects,
--   (SELECT count(*) FROM public.stints s WHERE s.user_id = u.id) as stints,
--   (SELECT current_streak FROM public.user_streaks us WHERE us.user_id = u.id) as streak
-- FROM auth.users u
-- ORDER BY u.email;
