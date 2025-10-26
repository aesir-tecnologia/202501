-- Add project organization fields: color tags and archiving
-- Migration created: 2025-10-26

-- Add color_tag field for project visual organization
ALTER TABLE public.projects
ADD COLUMN color_tag VARCHAR(20);

-- Add archived_at field (NULL means not archived, timestamp means archived)
ALTER TABLE public.projects
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the color_tag field
COMMENT ON COLUMN public.projects.color_tag IS 'TailwindCSS color name: red, orange, amber, green, teal, blue, purple, pink, or NULL';

-- Add comment to explain the archived_at field
COMMENT ON COLUMN public.projects.archived_at IS 'Timestamp when project was archived. NULL means project is not archived';

-- Add check constraint to ensure color_tag is one of the valid colors
ALTER TABLE public.projects
ADD CONSTRAINT projects_color_tag_check
CHECK (color_tag IS NULL OR color_tag IN ('red', 'orange', 'amber', 'green', 'teal', 'blue', 'purple', 'pink'));

-- Create partial index for archived projects (for efficient querying of archived projects)
CREATE INDEX idx_projects_archived ON public.projects(user_id, archived_at)
WHERE archived_at IS NOT NULL;

-- Create partial index for non-archived projects (for efficient querying of active/inactive projects)
CREATE INDEX idx_projects_not_archived ON public.projects(user_id, is_active, sort_order)
WHERE archived_at IS NULL;

-- Update existing index to exclude archived projects
-- Drop the old index and recreate with WHERE clause
DROP INDEX IF EXISTS idx_projects_user_active;
CREATE INDEX idx_projects_user_active ON public.projects(user_id, is_active)
WHERE archived_at IS NULL;

