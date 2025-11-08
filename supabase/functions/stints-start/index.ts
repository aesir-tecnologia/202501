// Edge Function: stints-start
// Purpose: Start a new stint with validation and conflict detection
// Route: POST /api/stints/start
//
// This function:
// 1. Authenticates the user
// 2. Validates the request body (projectId required)
// 3. Gets user version for optimistic locking
// 4. Calls validate_stint_start() RPC function
// 5. If validation fails, returns 409 Conflict with existing stint details
// 6. If validation passes, creates the stint
// 7. Returns created stint with 201 status

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    // Parse request body
    const body = await req.json()
    const { projectId, plannedDurationMinutes, notes } = body

    // Validate request body
    if (!projectId || typeof projectId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'projectId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Get user version for optimistic locking
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('version')
      .eq('id', user.id)
      .single<{ version: number }>()

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({ error: 'Failed to get user version' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Get project to determine planned duration
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('custom_stint_duration')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .is('archived_at', null)
      .single<{ custom_stint_duration: number | null }>()

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found or archived' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Determine planned duration: use provided, project custom, or default 50
    const plannedDuration = plannedDurationMinutes ?? project.custom_stint_duration ?? 50

    // Validate stint start using database function
    const { data: validation, error: validationError } = await supabase
      .rpc('validate_stint_start', {
        p_user_id: user.id,
        p_project_id: projectId,
        p_version: userProfile.version,
      })
      .single<{
        can_start: boolean
        existing_stint_id: string | null
        conflict_message: string | null
      }>()

    if (validationError) {
      console.error('Validation error:', validationError)
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validationError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // If validation fails, return conflict error
    if (!validation.can_start) {
      // Fetch the existing stint details
      const { data: existingStint, error: stintError } = await supabase
        .from('stints')
        .select('*')
        .eq('id', validation.existing_stint_id!)
        .eq('user_id', user.id)
        .single()

      if (stintError || !existingStint) {
        return new Response(
          JSON.stringify({
            error: 'CONFLICT',
            message: validation.conflict_message || 'Cannot start stint: conflict detected',
            existingStint: null,
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      return new Response(
        JSON.stringify({
          error: 'CONFLICT',
          message: validation.conflict_message || 'An active stint already exists',
          existingStint,
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Validation passed, create the stint
    const { data: newStint, error: createError } = await supabase
      .from('stints')
      .insert({
        project_id: projectId,
        user_id: user.id,
        status: 'active',
        planned_duration: plannedDuration,
        started_at: new Date().toISOString(),
        notes: notes || null,
      })
      .select('*')
      .single()

    if (createError) {
      // Check if conflict occurred (race condition)
      if (createError.code === '23505') {
        // Unique constraint violation - another stint was started concurrently
        const { data: activeStint } = await supabase
          .from('stints')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['active', 'paused'])
          .maybeSingle()

        if (activeStint) {
          return new Response(
            JSON.stringify({
              error: 'CONFLICT',
              message: 'Another stint was started concurrently',
              existingStint: activeStint,
            }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }
      }

      console.error('Create error:', createError)
      return new Response(
        JSON.stringify({ error: 'Failed to create stint', details: createError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify(newStint),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
  catch (error) {
    console.error('Unexpected error in stints-start:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

