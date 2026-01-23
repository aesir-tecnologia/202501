-- Migration: Fix STABLE violation in get_daily_summaries
--
-- Problem: gen_random_uuid() violates the STABLE contract because it returns
-- different values on each call, even within the same statement.
--
-- Solution: Generate a deterministic UUID for the live-today row using
-- uuid_generate_v5() with a fixed namespace and user_id + date as the name.

CREATE OR REPLACE FUNCTION get_daily_summaries(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE(
  id UUID,
  date DATE,
  total_stints INTEGER,
  total_focus_seconds INTEGER,
  total_pause_seconds INTEGER,
  project_breakdown JSONB,
  completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_timezone TEXT;
  v_today DATE;
  v_live_id UUID;
BEGIN
  -- Get user's timezone (default to UTC if not set)
  SELECT COALESCE(up.timezone, 'UTC') INTO v_timezone
  FROM public.user_profiles up
  WHERE up.id = p_user_id;

  IF v_timezone IS NULL THEN
    v_timezone := 'UTC';
  END IF;

  -- Calculate today's date in user's timezone
  v_today := (now() AT TIME ZONE v_timezone)::date;

  -- Generate deterministic UUID for live-today row
  -- Using DNS namespace (6ba7b810-9dad-11d1-80b4-00c04fd430c8) with user_id + date
  v_live_id := uuid_generate_v5(
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid,
    p_user_id::text || ':' || v_today::text
  );

  RETURN QUERY

  -- Part 1: Historical data from daily_summaries (excludes today)
  SELECT
    ds.id,
    ds.date,
    ds.total_stints,
    ds.total_focus_seconds,
    ds.total_pause_seconds,
    ds.project_breakdown,
    ds.completed_at
  FROM public.daily_summaries ds
  WHERE ds.user_id = p_user_id
    AND ds.date BETWEEN p_start_date AND p_end_date
    AND ds.date < v_today

  UNION ALL

  -- Part 2: Live data for today (only if today is within requested range)
  SELECT
    v_live_id AS id,
    v_today AS date,
    COALESCE(live.total_stints, 0)::INTEGER AS total_stints,
    COALESCE(live.total_focus_seconds, 0)::INTEGER AS total_focus_seconds,
    COALESCE(live.total_pause_seconds, 0)::INTEGER AS total_pause_seconds,
    COALESCE(live.project_breakdown, '[]'::jsonb) AS project_breakdown,
    now() AS completed_at
  FROM (
    SELECT
      COUNT(*)::INTEGER AS total_stints,
      COALESCE(SUM(s.actual_duration), 0)::INTEGER AS total_focus_seconds,
      COALESCE(SUM(s.paused_duration), 0)::INTEGER AS total_pause_seconds,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'project_id', breakdown.project_id,
              'project_name', breakdown.project_name,
              'stint_count', breakdown.stint_count,
              'focus_seconds', breakdown.focus_seconds
            )
            ORDER BY breakdown.focus_seconds DESC
          )
          FROM (
            SELECT
              s2.project_id,
              p.name AS project_name,
              COUNT(*)::INTEGER AS stint_count,
              COALESCE(SUM(s2.actual_duration), 0)::INTEGER AS focus_seconds
            FROM public.stints s2
            JOIN public.projects p ON p.id = s2.project_id
            WHERE s2.user_id = p_user_id
              AND s2.status = 'completed'
              AND s2.ended_at IS NOT NULL
              AND (s2.ended_at AT TIME ZONE v_timezone)::date = v_today
            GROUP BY s2.project_id, p.name
          ) breakdown
        ),
        '[]'::jsonb
      ) AS project_breakdown
    FROM public.stints s
    WHERE s.user_id = p_user_id
      AND s.status = 'completed'
      AND s.ended_at IS NOT NULL
      AND (s.ended_at AT TIME ZONE v_timezone)::date = v_today
  ) live
  WHERE v_today BETWEEN p_start_date AND p_end_date

  ORDER BY date DESC;
END;
$$;

COMMENT ON FUNCTION get_daily_summaries(UUID, DATE, DATE) IS
  'Retrieves daily summaries for a user within a date range. Returns live-calculated data for today (in user timezone), pre-aggregated data for past dates. Uses deterministic UUID for live row.';
