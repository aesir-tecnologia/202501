// Edge Function: stints-active
// Purpose: Get the user's active stint
// Route: GET /api/stints/active
//
// This function:
// 1. Authenticates the user
// 2. Calls get_active_stint() RPC function or queries stints table directly
// 3. Returns active stint (or null) with 200 status

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

    // Call get_active_stint RPC function
    const { data: activeStint, error: rpcError } = await supabase
      .rpc('get_active_stint', { p_user_id: user.id })
      .maybeSingle();

    // If RPC function doesn't exist or fails, fall back to direct query
    if (rpcError) {
      console.warn('RPC get_active_stint failed, falling back to direct query:', rpcError);
      const { data: stint, error: queryError } = await supabase
        .from('stints')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'paused'])
        .maybeSingle();

      if (queryError) {
        console.error('Query error:', queryError);
        return errorResponse(
          ErrorCodes.INTERNAL_ERROR,
          'Failed to get active stint',
          500,
          queryError.message,
        );
      }

      return jsonResponse(stint, 200);
    }

    return jsonResponse(activeStint, 200);
  }
  catch (error) {
    console.error('Unexpected error in stints-active:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Internal server error',
      500,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
});
