// Edge Function: stint-auto-complete
// Purpose: Auto-complete active stints that have reached their planned end time
// Runs: Every 30 seconds via Supabase cron
//
// This function:
// 1. Finds all active stints where started_at + planned_duration <= now()
// 2. Calls complete_stint() PostgreSQL function for each
// 3. Handles errors gracefully (logs but doesn't fail entire batch)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, errorResponse, jsonResponse, ErrorCodes } from '../_shared/responses.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get service role client (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find all active stints that should be completed
    // Query: started_at + (planned_duration * interval '1 minute') <= now()
    const { data: activeStints, error: fetchError } = await supabase
      .from('stints')
      .select('id, user_id, started_at, planned_duration, status')
      .eq('status', 'active')
      .not('planned_duration', 'is', null)
      .not('started_at', 'is', null);

    if (fetchError) {
      console.error('Error fetching active stints:', fetchError);
      return errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to fetch active stints',
        500,
        fetchError.message,
      );
    }

    if (!activeStints || activeStints.length === 0) {
      return jsonResponse({
        message: 'No active stints to complete',
        completed: 0,
      }, 200);
    }

    const now = new Date();
    const completedStints: string[] = [];
    const errors: Array<{ stintId: string, error: string }> = [];

    // Check each active stint
    for (const stint of activeStints) {
      if (!stint.started_at || !stint.planned_duration) {
        continue;
      }

      const startedAt = new Date(stint.started_at);
      const plannedEndTime = new Date(startedAt.getTime() + stint.planned_duration * 60 * 1000);

      // If planned end time has passed, complete the stint
      if (plannedEndTime <= now) {
        try {
          // Call complete_stint PostgreSQL function
          const { error: completeError } = await supabase.rpc('complete_stint', {
            p_stint_id: stint.id,
            p_completion_type: 'auto',
            p_notes: null,
          });

          if (completeError) {
            console.error(`Error completing stint ${stint.id}:`, completeError);
            errors.push({ stintId: stint.id, error: completeError.message });
          }
          else {
            completedStints.push(stint.id);
            console.log(`Auto-completed stint ${stint.id} for user ${stint.user_id}`);
          }
        }
        catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          console.error(`Exception completing stint ${stint.id}:`, err);
          errors.push({ stintId: stint.id, error: errorMessage });
        }
      }
    }

    return jsonResponse({
      message: 'Auto-completion check completed',
      completed: completedStints.length,
      completedStintIds: completedStints,
      errors: errors.length > 0 ? errors : undefined,
    }, 200);
  }
  catch (error) {
    console.error('Unexpected error in stint-auto-complete:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Internal server error',
      500,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
});
