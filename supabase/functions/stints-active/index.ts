// Edge Function: stints-active
// Purpose: Get the user's active stint
// Route: GET /api/stints/active
//
// This function:
// 1. Authenticates the user
// 2. Calls get_active_stint() RPC function or queries stints table directly
// 3. Returns active stint (or null) with 200 status

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Call get_active_stint RPC function
    const { data: activeStint, error: rpcError } = await supabase
      .rpc('get_active_stint', { p_user_id: user.id })
      .maybeSingle()

    // If RPC function doesn't exist or fails, fall back to direct query
    if (rpcError) {
      console.warn('RPC get_active_stint failed, falling back to direct query:', rpcError)
      const { data: stint, error: queryError } = await supabase
        .from('stints')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'paused'])
        .maybeSingle()

      if (queryError) {
        console.error('Query error:', queryError)
        return new Response(
          JSON.stringify({ error: 'Failed to get active stint', details: queryError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      return new Response(
        JSON.stringify(stint),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify(activeStint),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
  catch (error) {
    console.error('Unexpected error in stints-active:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
