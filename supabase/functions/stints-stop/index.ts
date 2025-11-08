// Edge Function: stints-stop
// Purpose: Stop/complete a stint manually
// Route: PATCH /api/stints/:id/stop
//
// This function:
// 1. Authenticates the user
// 2. Verifies stint exists and belongs to user
// 3. Calls complete_stint() RPC function with completion_type: 'manual'
// 4. Returns completed stint with 200 status

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
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

    // Parse request body to get stint ID and optional notes
    const body = await req.json()
    const { stintId, notes } = body

    // Validate request body
    if (!stintId || typeof stintId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'stintId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Verify stint exists and belongs to user
    const { data: stint, error: stintError } = await supabase
      .from('stints')
      .select('*')
      .eq('id', stintId)
      .eq('user_id', user.id)
      .single()

    if (stintError || !stint) {
      return new Response(
        JSON.stringify({ error: 'Stint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Call the complete_stint RPC function with manual completion type
    const { data: completedStint, error: completeError } = await supabase
      .rpc('complete_stint', {
        p_stint_id: stintId,
        p_completion_type: 'manual',
        p_notes: notes || null,
      })
      .single()

    if (completeError) {
      // Map database errors to appropriate HTTP status codes
      if (completeError.message?.includes('not active')) {
        return new Response(
          JSON.stringify({ error: 'Stint is not active or paused and cannot be completed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      if (completeError.message?.includes('not found')) {
        return new Response(
          JSON.stringify({ error: 'Stint not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      console.error('Complete error:', completeError)
      return new Response(
        JSON.stringify({ error: 'Failed to complete stint', details: completeError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify(completedStint),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
  catch (error) {
    console.error('Unexpected error in stints-stop:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
