# LifeStint - Database Schema & Data Models

**Product Name:** LifeStint  
**Document Version:** 3.0  
**Date:** October 24, 2025

---

## Schema Version: 1.0

---

## Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email_verified BOOLEAN NOT NULL DEFAULT false,
  last_active TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1, -- Optimistic locking
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT valid_timezone CHECK (timezone IN (SELECT name FROM pg_timezone_names))
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_active ON users(last_active);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Trigger for updated_at
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Field Descriptions:**
- `timezone`: IANA timezone (e.g., "America/New_York") for daily reset and exports
- `version`: Incremented on every update for optimistic locking (prevents race conditions)
- `email_verified`: Must be true to access dashboard
- `last_active`: Updated on each API request, used for inactive user cleanup

**Constraints:**
- Email must be valid format and unique
- Timezone must be valid IANA timezone

**Relationships:**
- One-to-many with `projects` (CASCADE on delete)
- One-to-many with `stints` (CASCADE on delete)
- One-to-one with `user_preferences` (CASCADE on delete)
- One-to-one with `user_streaks` (CASCADE on delete)
- One-to-many with `daily_summaries` (CASCADE on delete)

---

## Projects Table

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  expected_daily_stints INTEGER NOT NULL DEFAULT 2,
  custom_stint_duration INTEGER, -- Minutes, NULL means use default (50)
  color_tag TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  archived_at TIMESTAMPTZ, -- NULL if not archived
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_name CHECK (length(name) >= 1 AND length(name) <= 100),
  CONSTRAINT valid_daily_stints CHECK (expected_daily_stints >= 1 AND expected_daily_stints <= 8),
  CONSTRAINT valid_stint_duration CHECK (custom_stint_duration IS NULL OR 
    (custom_stint_duration >= 10 AND custom_stint_duration <= 120)),
  CONSTRAINT valid_color CHECK (color_tag IS NULL OR color_tag IN 
    ('red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray')),
  CONSTRAINT unique_name_per_user UNIQUE (user_id, name)
);

-- Indexes
CREATE INDEX idx_projects_user_active ON projects(user_id, is_active) WHERE archived_at IS NULL;
CREATE INDEX idx_projects_user_sort ON projects(user_id, sort_order);

-- RLS Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own projects" ON projects FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER set_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to count active projects per user
CREATE FUNCTION count_active_projects(p_user_id UUID) RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM projects 
  WHERE user_id = p_user_id AND is_active = true AND archived_at IS NULL;
$$ LANGUAGE SQL STABLE;
```

**Field Descriptions:**
- `custom_stint_duration`: Overrides default 50 minutes if set
- `color_tag`: Visual identifier in dashboard (8 preset colors)
- `archived_at`: Soft delete timestamp (NULL if active)
- `sort_order`: User-defined ordering (0 = first), future drag-to-reorder

**Constraints:**
- Project names must be unique per user
- Expected daily stints: 1-8
- Custom stint duration: 10-120 minutes if specified
- Maximum 25 active projects per user (enforced in application logic)

**Business Rules:**
- Archiving a project with active stint is prevented by application logic
- Archived projects excluded from daily totals and streak calculations

**Relationships:**
- Many-to-one with `users` (CASCADE on delete)
- One-to-many with `stints` (CASCADE on delete)

---

## Stints Table

```sql
CREATE TABLE stints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Denormalized for query performance
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  planned_duration INTEGER NOT NULL, -- Minutes
  actual_duration INTEGER, -- Seconds, calculated on completion
  paused_duration INTEGER NOT NULL DEFAULT 0, -- Seconds
  completion_type TEXT CHECK (completion_type IN ('manual', 'auto', 'interrupted')),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'interrupted')),
  paused_at TIMESTAMPTZ, -- Most recent pause time
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_planned_duration CHECK (planned_duration >= 10 AND planned_duration <= 120),
  CONSTRAINT valid_notes CHECK (notes IS NULL OR length(notes) <= 500),
  CONSTRAINT valid_ended CHECK (ended_at IS NULL OR ended_at >= started_at),
  CONSTRAINT completed_has_ended CHECK (status IN ('active', 'paused') OR ended_at IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_stints_user_date ON stints(user_id, started_at DESC);
CREATE INDEX idx_stints_project_date ON stints(project_id, started_at DESC);
CREATE INDEX idx_stints_active ON stints(user_id) WHERE status IN ('active', 'paused');
CREATE INDEX idx_stints_completed_date ON stints(user_id, DATE(started_at AT TIME ZONE (SELECT timezone FROM users WHERE id = stints.user_id)));

-- RLS Policies
ALTER TABLE stints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own stints" ON stints FOR ALL USING (auth.uid() = user_id);

-- Function to get active stint for user
CREATE FUNCTION get_active_stint(p_user_id UUID) RETURNS SETOF stints AS $$
  SELECT * FROM stints 
  WHERE user_id = p_user_id AND status IN ('active', 'paused')
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Function to complete stint
CREATE FUNCTION complete_stint(
  p_stint_id UUID,
  p_completion_type TEXT,
  p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_started_at TIMESTAMPTZ;
  v_paused_duration INTEGER;
BEGIN
  SELECT started_at, paused_duration INTO v_started_at, v_paused_duration
  FROM stints WHERE id = p_stint_id;
  
  UPDATE stints SET
    ended_at = now(),
    actual_duration = EXTRACT(EPOCH FROM (now() - v_started_at))::INTEGER - v_paused_duration,
    completion_type = p_completion_type,
    notes = p_notes,
    status = 'completed'
  WHERE id = p_stint_id;
END;
$$ LANGUAGE plpgsql;
```

**Field Descriptions:**
- `user_id`: Denormalized for faster queries (no join needed)
- `actual_duration`: Total seconds from start to end, minus pauses
- `paused_duration`: Cumulative pause time in seconds
- `status`: Current state (active, paused, completed, interrupted)
- `paused_at`: Timestamp of most recent pause (for calculating pause duration)

**Constraints:**
- Planned duration: 10-120 minutes
- Notes: Max 500 characters
- Completed stints must have ended_at

**Business Rules:**
- Only one active/paused stint per user (enforced by unique partial index)
- Auto-completion triggered by Edge Function when `started_at + planned_duration <= now()`
- Interrupted stints don't count toward daily progress but preserved in history

**Relationships:**
- Many-to-one with `projects` (CASCADE on delete)
- Many-to-one with `users` (CASCADE on delete)

---

## User Preferences Table

```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  default_stint_duration INTEGER NOT NULL DEFAULT 50,
  celebration_sound BOOLEAN NOT NULL DEFAULT true,
  celebration_animation BOOLEAN NOT NULL DEFAULT true,
  desktop_notifications BOOLEAN NOT NULL DEFAULT true,
  weekly_email_digest BOOLEAN NOT NULL DEFAULT false,
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_default_duration CHECK (default_stint_duration >= 10 AND default_stint_duration <= 120)
);

-- RLS Policy
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER set_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Field Descriptions:**
- `default_stint_duration`: Default for new projects (can be overridden per project)
- `celebration_*`: Control completion animations and sounds
- `desktop_notifications`: Browser notifications for stint completion
- `theme`: UI theme preference

**Relationships:**
- One-to-one with `users` (CASCADE on delete)

---

## Daily Summaries Table (Pre-Aggregated for Performance)

```sql
CREATE TABLE daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_stints INTEGER NOT NULL DEFAULT 0,
  total_focus_seconds INTEGER NOT NULL DEFAULT 0,
  total_pause_seconds INTEGER NOT NULL DEFAULT 0,
  projects_worked JSONB NOT NULL DEFAULT '[]', -- Array of {project_id, project_name, stint_count}
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- Indexes
CREATE INDEX idx_daily_summaries_user_date ON daily_summaries(user_id, date DESC);

-- RLS Policy
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own summaries" ON daily_summaries FOR SELECT USING (auth.uid() = user_id);

-- Function to aggregate daily summary (called by cron)
CREATE FUNCTION aggregate_daily_summary(p_user_id UUID, p_date DATE) RETURNS VOID AS $$
DECLARE
  v_timezone TEXT;
BEGIN
  SELECT timezone INTO v_timezone FROM users WHERE id = p_user_id;
  
  INSERT INTO daily_summaries (user_id, date, total_stints, total_focus_seconds, total_pause_seconds, projects_worked)
  SELECT 
    p_user_id,
    p_date,
    COUNT(*) as total_stints,
    SUM(actual_duration) as total_focus_seconds,
    SUM(paused_duration) as total_pause_seconds,
    jsonb_agg(jsonb_build_object(
      'project_id', project_id,
      'project_name', (SELECT name FROM projects WHERE id = project_id),
      'stint_count', COUNT(*)
    )) as projects_worked
  FROM stints
  WHERE user_id = p_user_id 
    AND status = 'completed'
    AND DATE(started_at AT TIME ZONE v_timezone) = p_date
  GROUP BY user_id
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_stints = EXCLUDED.total_stints,
    total_focus_seconds = EXCLUDED.total_focus_seconds,
    total_pause_seconds = EXCLUDED.total_pause_seconds,
    projects_worked = EXCLUDED.projects_worked,
    completed_at = now();
END;
$$ LANGUAGE plpgsql;
```

**Purpose:**
- Pre-aggregates daily stats for fast analytics queries
- Avoids expensive SUM() queries on stints table for every analytics page load
- Generated nightly by scheduled task

**Relationships:**
- Many-to-one with `users` (CASCADE on delete)

---

## Streak Tracking Table

```sql
CREATE TABLE user_streaks (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_stint_date DATE,
  streak_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policy
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own streaks" ON user_streaks FOR SELECT USING (auth.uid() = user_id);

-- Function to calculate streak
CREATE FUNCTION calculate_streak(p_user_id UUID) RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_current_date DATE;
  v_timezone TEXT;
  v_last_date DATE;
BEGIN
  SELECT timezone INTO v_timezone FROM users WHERE id = p_user_id;
  SELECT DATE(now() AT TIME ZONE v_timezone) INTO v_current_date;
  SELECT last_stint_date INTO v_last_date FROM user_streaks WHERE user_id = p_user_id;
  
  -- If last stint was today or yesterday, count streak
  IF v_last_date IS NOT NULL AND v_last_date >= v_current_date - INTERVAL '1 day' THEN
    -- Count consecutive days with stints going backwards from last_date
    SELECT COUNT(*) INTO v_streak FROM (
      SELECT DISTINCT DATE(started_at AT TIME ZONE v_timezone) as stint_date
      FROM stints
      WHERE user_id = p_user_id AND status = 'completed'
      ORDER BY stint_date DESC
    ) AS daily_stints
    WHERE stint_date >= v_current_date - INTERVAL '1 day' * v_streak;
  END IF;
  
  RETURN v_streak;
END;
$$ LANGUAGE plpgsql;
```

**Relationships:**
- One-to-one with `users` (CASCADE on delete)

---

## Audit Log Table (For Support & Debugging)

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'project', 'stint', 'user_preferences'
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- No RLS (internal only, accessed via Edge Functions with service role key)
```

**Purpose:**
- Track user actions for support investigations
- Debug stint conflicts and data inconsistencies
- Not exposed to users (internal only)

**Retention:**
- 90 days (cleanup via scheduled task)

---

## Row Level Security (RLS) Policies

### Users Table

```sql
-- Users can read own profile
CREATE POLICY "users_select_own" ON users FOR SELECT 
USING (auth.uid() = id);

-- Users can update own profile (except id, created_at)
CREATE POLICY "users_update_own" ON users FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (id = auth.uid() AND created_at = (SELECT created_at FROM users WHERE id = auth.uid()));
```

### Projects Table

```sql
-- Users can read own projects
CREATE POLICY "projects_select_own" ON projects FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert own projects
CREATE POLICY "projects_insert_own" ON projects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update own projects
CREATE POLICY "projects_update_own" ON projects FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete own projects (actually archives via application logic)
CREATE POLICY "projects_delete_own" ON projects FOR DELETE 
USING (auth.uid() = user_id);
```

### Stints Table

```sql
-- Users can read own stints
CREATE POLICY "stints_select_own" ON stints FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert own stints
CREATE POLICY "stints_insert_own" ON stints FOR INSERT 
WITH CHECK (auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()));

-- Users can update own stints (for pause/resume/stop)
CREATE POLICY "stints_update_own" ON stints FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users cannot delete stints (immutable record)
-- No DELETE policy = no deletions allowed
```

### Daily Summaries Table

```sql
-- Users can read own summaries
CREATE POLICY "summaries_select_own" ON daily_summaries FOR SELECT 
USING (auth.uid() = user_id);

-- Users cannot write summaries (generated by cron with service role key)
-- No INSERT/UPDATE policies = only system can write
```

### Service Role Bypass

- Edge Functions use service role key (bypasses RLS)
- Used for:
  - Auto-completing stints (cron job)
  - Generating daily summaries (cron job)
  - System maintenance operations
- Service role key stored in Supabase secrets, never exposed to frontend

### Testing RLS

```sql
-- Test as user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub = 'user-uuid-here';

-- Attempt to read another user's data (should return 0 rows)
SELECT * FROM projects WHERE user_id != 'user-uuid-here';

-- Attempt to insert with wrong user_id (should fail)
INSERT INTO projects (user_id, name) VALUES ('other-user-uuid', 'Test');
```

---

## Database Functions

### Utility Functions

**update_updated_at_column()**
- Automatically updates `updated_at` timestamp on row updates
- Used by triggers on all tables with `updated_at` field

### Business Logic Functions

**get_active_stint(p_user_id UUID)**
- Returns the active or paused stint for a user
- Used to check for existing active stints before starting new one

**complete_stint(p_stint_id UUID, p_completion_type TEXT, p_notes TEXT)**
- Completes a stint by calculating actual duration and updating status
- Used by both manual stop and auto-completion logic

**calculate_streak(p_user_id UUID)**
- Calculates current streak for a user based on completed stints
- Timezone-aware, includes grace period logic

**aggregate_daily_summary(p_user_id UUID, p_date DATE)**
- Pre-aggregates daily statistics for performance
- Called by cron job at midnight user time

**count_active_projects(p_user_id UUID)**
- Returns count of active (non-archived) projects for a user
- Used to enforce project limits

---

## Indexes Summary

**Performance-Critical Indexes:**
- `idx_users_email`: Fast user lookup by email
- `idx_projects_user_active`: Fast active project queries
- `idx_stints_user_date`: Fast stint history queries
- `idx_stints_active`: Fast active stint lookup
- `idx_daily_summaries_user_date`: Fast analytics queries

**Partial Indexes:**
- `idx_projects_user_active`: Only indexes non-archived projects
- `idx_stints_active`: Only indexes active/paused stints

---

**Related Documents:**
- [04-technical-architecture.md](./04-technical-architecture.md) - Technical architecture context
- [06-implementation-guide.md](./06-implementation-guide.md) - Implementation details using this schema
- [09-operations-compliance.md](./09-operations-compliance.md) - Database migration strategy

