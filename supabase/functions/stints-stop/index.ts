// Edge Function: stints-stop
// Purpose: Stop/complete a stint manually
// Route: PATCH /api/stints/:id/stop
//
// This function:
// 1. Authenticates the user
// 2. Verifies stint exists and belongs to user
// 3. Calls complete_stint() RPC function with completion_type: 'manual'
// 4. Returns completed stint with 200 status

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, errorResponse, jsonResponse, ErrorCodes } from '../_shared/responses.ts';
import { STINT_CONSTRAINTS } from '../_shared/constants.ts';

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

    // Parse request body to get stint ID and optional notes
    const body = await req.json();
    const { stintId, notes } = body;

    // Validate request body
    if (!stintId || typeof stintId !== 'string') {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'stintId is required and must be a string', 400);
    }

    if (notes !== undefined && typeof notes !== 'string') {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'notes must be a string', 400);
    }

    if (notes && notes.length > STINT_CONSTRAINTS.MAX_NOTES_LENGTH) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        `notes must not exceed ${STINT_CONSTRAINTS.MAX_NOTES_LENGTH} characters`,
        400,
      );
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

    // Call the complete_stint RPC function with manual completion type
    const { data: completedStint, error: completeError } = await supabase
      .rpc('complete_stint', {
        p_stint_id: stintId,
        p_completion_type: 'manual',
        p_notes: notes || null,
      })
      .single();

    if (completeError) {
      // Map database errors to appropriate HTTP status codes
      if (completeError.message?.includes('not active')) {
        return errorResponse(
          ErrorCodes.INVALID_STATE,
          'Stint is not active or paused and cannot be completed',
          400,
        );
      }
      if (completeError.message?.includes('not found')) {
        return errorResponse(ErrorCodes.NOT_FOUND, 'Stint not found', 404);
      }

      console.error('Complete error:', completeError);
      return errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to complete stint',
        500,
        completeError.message,
      );
    }

    return jsonResponse(completedStint, 200);
  }
  catch (error) {
    console.error('Unexpected error in stints-stop:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Internal server error',
      500,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
});
