-- Enable Realtime subscriptions for stints and daily_summaries tables
-- This allows clients to receive instant updates when rows change

-- Add stints table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.stints;

-- Add daily_summaries table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_summaries;

-- Note: RLS policies already exist on these tables, so Realtime will
-- automatically filter events to only send changes the user can see.
