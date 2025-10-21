-- Migration: Add sort_order and case-insensitive name uniqueness
-- Feature: Dashboard Project Management (001-create-and-manage)
-- Date: 2025-10-04

-- Add sort_order column (nullable initially for backfill)
ALTER TABLE projects ADD COLUMN sort_order INTEGER;

-- Backfill existing projects with ID-based order (0-indexed)
UPDATE projects
SET sort_order = numbered.row_number - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at, id) AS row_number
  FROM projects
) AS numbered
WHERE projects.id = numbered.id;

-- Create a function to auto-assign sort_order (max + 1 per user)
CREATE OR REPLACE FUNCTION auto_assign_project_sort_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sort_order IS NULL THEN
    SELECT COALESCE(MAX(sort_order), -1) + 1
    INTO NEW.sort_order
    FROM projects
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign sort_order on insert
DROP TRIGGER IF EXISTS auto_assign_project_sort_order_trigger ON projects;
CREATE TRIGGER auto_assign_project_sort_order_trigger
BEFORE INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION auto_assign_project_sort_order();

-- Add index for efficient ordered list queries
CREATE INDEX IF NOT EXISTS projects_user_id_sort_order_idx ON projects (user_id, sort_order);

-- Add unique constraint for case-insensitive name uniqueness per user
CREATE UNIQUE INDEX IF NOT EXISTS projects_name_user_id_lower_idx ON projects (user_id, LOWER(name));
