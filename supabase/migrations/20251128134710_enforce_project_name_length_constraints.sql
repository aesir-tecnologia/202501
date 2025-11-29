-- Migration: Enforce project name length constraints
-- Changes projects.name from TEXT to VARCHAR(100) and adds minimum length constraint
-- Date: 2025-11-28

-- First, verify no existing names exceed 100 characters
DO $$
DECLARE
  max_length INTEGER;
BEGIN
  SELECT MAX(LENGTH(name)) INTO max_length FROM projects;
  IF max_length > 100 THEN
    RAISE EXCEPTION 'Cannot migrate: Found project name with length % (max allowed: 100)', max_length;
  END IF;
END $$;

-- Trim and validate existing names meet minimum length requirement
UPDATE projects
SET name = TRIM(name)
WHERE name != TRIM(name);

-- Verify no names are empty after trimming
DO $$
DECLARE
  empty_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO empty_count FROM projects WHERE LENGTH(TRIM(name)) < 1;
  IF empty_count > 0 THEN
    RAISE EXCEPTION 'Cannot migrate: Found % project(s) with empty or whitespace-only names', empty_count;
  END IF;
END $$;

-- Change column type from TEXT to VARCHAR(100)
ALTER TABLE projects
ALTER COLUMN name TYPE VARCHAR(100);

-- Add CHECK constraint for minimum length (after trimming)
ALTER TABLE projects
ADD CONSTRAINT projects_name_length_check
CHECK (LENGTH(TRIM(name)) >= 1);

-- Add comment to document the constraint
COMMENT ON COLUMN projects.name IS 'Project name: 1-100 characters (enforced by VARCHAR(100) and CHECK constraint)';

