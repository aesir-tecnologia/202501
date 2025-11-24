-- Migration: Fix Stint Duration Constraint
-- Aligns database constraint with application validation (5-480 minutes)
-- Previous constraint: 10-120 minutes (too restrictive)
-- New constraint: 5-480 minutes (matches STINT.DURATION_MINUTES constants)

-- Drop the incorrect constraint
ALTER TABLE public.stints
DROP CONSTRAINT IF EXISTS valid_planned_duration;

-- Backfill any NULL planned_duration values with default (120 minutes)
-- This prepares the column to become NOT NULL
UPDATE public.stints
SET planned_duration = 120
WHERE planned_duration IS NULL;

-- Add the corrected constraint (5-480 minutes range)
ALTER TABLE public.stints
ADD CONSTRAINT valid_planned_duration
CHECK (planned_duration >= 5 AND planned_duration <= 480);

-- Make planned_duration NOT NULL (aligns with documentation)
ALTER TABLE public.stints
ALTER COLUMN planned_duration SET NOT NULL;

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT valid_planned_duration ON public.stints IS
  'Planned duration must be between 5 and 480 minutes (matches application validation)';
