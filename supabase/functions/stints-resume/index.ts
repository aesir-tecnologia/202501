// Edge Function: stints-resume
// Purpose: Resume a paused stint
// Route: PATCH /api/stints/:id/resume
//
// This function:
// 1. Authenticates the user
// 2. Verifies stint exists and belongs to user
// 3. Calls resume_stint() RPC function
// 4. Returns updated stint with 200 status

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

    // Parse request body to get stint ID
    const body = await req.json()
    const { stintId } = body

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

    // Call the resume_stint RPC function
    const { data: resumedStint, error: resumeError } = await supabase
      .rpc('resume_stint', { p_stint_id: stintId })
      .single()

    if (resumeError) {
      // Map database errors to appropriate HTTP status codes
      if (resumeError.message?.includes('not paused')) {
        return new Response(
          JSON.stringify({ error: 'Stint is not paused and cannot be resumed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      if (resumeError.message?.includes('not found')) {
        return new Response(
          JSON.stringify({ error: 'Stint not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      console.error('Resume error:', resumeError)
      return new Response(
        JSON.stringify({ error: 'Failed to resume stint', details: resumeError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify(resumedStint),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
  catch (error) {
    console.error('Unexpected error in stints-resume:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
