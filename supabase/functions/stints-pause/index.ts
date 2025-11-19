// Edge Function: stints-pause
// Purpose: Pause an active stint
// Route: PATCH /api/stints/:id/pause
//
// This function:
// 1. Authenticates the user
// 2. Verifies stint exists and belongs to user
// 3. Calls pause_stint() RPC function
// 4. Returns updated stint with 200 status

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, errorResponse, jsonResponse, ErrorCodes } from '../_shared/responses.ts';

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
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401);
    }

    // Parse request body to get stint ID
    const body = await req.json();
    const { stintId } = body;

    // Validate request body
    if (!stintId || typeof stintId !== 'string') {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'stintId is required and must be a string', 400);
    }

    // Verify stint exists and belongs to user
    const { data: stint, error: stintError } = await supabase
      .from('stints')
      .select('*')
      .eq('id', stintId)
      .eq('user_id', user.id)
      .single();

    if (stintError || !stint) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Stint not found or access denied', 404);
    }

    // Call the pause_stint RPC function
    const { data: pausedStint, error: pauseError } = await supabase
      .rpc('pause_stint', { p_stint_id: stintId })
      .single();

    if (pauseError) {
      // Map database errors to appropriate HTTP status codes
      if (pauseError.message?.includes('not active')) {
        return errorResponse(
          ErrorCodes.INVALID_STATE,
          'Stint is not active and cannot be paused',
          400,
        );
      }
      if (pauseError.message?.includes('not found')) {
        return errorResponse(ErrorCodes.NOT_FOUND, 'Stint not found', 404);
      }

      console.error('Pause error:', pauseError);
      return errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to pause stint',
        500,
        pauseError.message,
      );
    }

    return jsonResponse(pausedStint, 200);
  }
  catch (error) {
    console.error('Unexpected error in stints-pause:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Internal server error',
      500,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
});
