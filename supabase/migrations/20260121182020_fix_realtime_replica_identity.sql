-- =============================================================================
-- MIGRATION: Fix Realtime Broadcasts for SECURITY DEFINER Operations
-- =============================================================================
-- Issue: pause_stint not triggering Realtime broadcasts
--
-- Root cause: SECURITY DEFINER functions bypass RLS for the actual UPDATE,
-- but Supabase Realtime still evaluates RLS to filter which clients receive
-- broadcasts. With REPLICA IDENTITY DEFAULT (only primary key in WAL events),
-- Realtime may not have enough data to properly evaluate the RLS policy.
--
-- Fix: Set REPLICA IDENTITY FULL to include all column values in WAL events,
-- enabling proper RLS evaluation for Realtime broadcast filtering.
--
-- Note: This increases WAL size slightly but is necessary for Realtime to
-- work correctly with SECURITY DEFINER functions and RLS policies.
-- =============================================================================

ALTER TABLE public.stints REPLICA IDENTITY FULL;

ALTER TABLE public.daily_summaries REPLICA IDENTITY FULL;
