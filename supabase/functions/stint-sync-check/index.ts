// Edge Function: stint-sync-check
// Purpose: Check timer drift and correct if needed
// Called by: Frontend every 60 seconds during active stints
//
// This function:
// 1. Receives current client-side timer remaining time
// 2. Calculates server-side remaining time based on started_at + planned_duration
// 3. Returns the correct remaining time if drift exceeds threshold
// 4. Also handles paused stints correctly
//
// NOTE: Drift threshold must match TIMER_DRIFT_THRESHOLD_SECONDS in app/composables/useStintTimer.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Must match TIMER_DRIFT_THRESHOLD_SECONDS in app/composables/useStintTimer.ts
const TIMER_DRIFT_THRESHOLD_SECONDS = 5;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Get query parameters
    const url = new URL(req.url);
    const clientRemaining = parseInt(url.searchParams.get('remaining') || '0', 10);
    const stintId = url.searchParams.get('stintId');

    if (!stintId) {
      return new Response(
        JSON.stringify({ error: 'stintId parameter required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Fetch the active stint
    const { data: stint, error: stintError } = await supabase
      .from('stints')
      .select('id, started_at, planned_duration, paused_at, paused_duration, status')
      .eq('id', stintId)
      .eq('user_id', user.id)
      .single();

    if (stintError || !stint) {
      return new Response(
        JSON.stringify({ error: 'Stint not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // If stint is not active or paused, return error
    if (stint.status !== 'active' && stint.status !== 'paused') {
      return new Response(
        JSON.stringify({ error: 'Stint is not active or paused' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Calculate server-side remaining time
    let serverRemaining = 0;

    if (stint.status === 'paused' && stint.paused_at) {
      // For paused stints, remaining time is based on paused_duration
      // Remaining = planned_duration - elapsed_before_pause
      const pausedAt = new Date(stint.paused_at);
      const startedAt = new Date(stint.started_at);
      const elapsedBeforePause = Math.floor((pausedAt.getTime() - startedAt.getTime()) / 1000);
      const remainingBeforePause = (stint.planned_duration || 0) * 60 - elapsedBeforePause;
      serverRemaining = Math.max(0, remainingBeforePause);
    }
    else if (stint.status === 'active') {
      // For active stints, calculate based on started_at + planned_duration - now
      const startedAt = new Date(stint.started_at);
      const now = new Date();
      const plannedEndTime = new Date(startedAt.getTime() + (stint.planned_duration || 0) * 60 * 1000);
      serverRemaining = Math.max(0, Math.floor((plannedEndTime.getTime() - now.getTime()) / 1000));
    }

    // Calculate drift
    const drift = Math.abs(serverRemaining - clientRemaining);

    return new Response(
      JSON.stringify({
        secondsRemaining: serverRemaining,
        clientRemaining,
        drift,
        needsCorrection: drift > TIMER_DRIFT_THRESHOLD_SECONDS,
        status: stint.status,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
  catch (error) {
    console.error('Unexpected error in stint-sync-check:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
