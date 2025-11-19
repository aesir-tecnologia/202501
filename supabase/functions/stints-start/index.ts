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

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, errorResponse, jsonResponse, ErrorCodes } from '../_shared/responses.ts';
import { STINT_CONSTRAINTS } from '../_shared/constants.ts';

// PostgreSQL error codes
const POSTGRES_UNIQUE_VIOLATION = '23505';

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

    // Parse request body
    const body = await req.json();
    const { projectId, plannedDurationMinutes } = body;

    // Validate request body
    if (!projectId || typeof projectId !== 'string') {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'projectId is required and must be a string', 400);
    }

    if (plannedDurationMinutes !== undefined
      && (typeof plannedDurationMinutes !== 'number' || !Number.isInteger(plannedDurationMinutes))) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'plannedDurationMinutes must be an integer', 400);
    }

    // Get user version for optimistic locking
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('version')
      .eq('id', user.id)
      .single<{ version: number }>();

    if (profileError || !userProfile) {
      return errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to get user version',
        500,
        profileError?.message,
      );
    }

    // Get project to determine planned duration
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('custom_stint_duration')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .is('archived_at', null)
      .single<{ custom_stint_duration: number | null }>();

    if (projectError || !project) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Project not found or archived', 404);
    }

    // Determine planned duration: use provided, project custom, or default 120
    const plannedDuration = plannedDurationMinutes ?? project.custom_stint_duration ?? STINT_CONSTRAINTS.DEFAULT_DURATION;

    // Validate planned duration bounds (5-480 minutes)
    if (plannedDuration < STINT_CONSTRAINTS.MIN_DURATION || plannedDuration > STINT_CONSTRAINTS.MAX_DURATION) {
      return errorResponse(
        ErrorCodes.INVALID_DURATION,
        `Planned duration must be between ${STINT_CONSTRAINTS.MIN_DURATION} and ${STINT_CONSTRAINTS.MAX_DURATION} minutes`,
        400,
      );
    }

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
    }>();

    if (validationError) {
      console.error('Validation error:', validationError);
      return errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Validation failed',
        500,
        validationError.message,
      );
    }

    // If validation fails, return conflict error
    if (!validation.can_start) {
      // If no existing stint ID provided, return generic conflict
      if (!validation.existing_stint_id) {
        return errorResponse(
          ErrorCodes.CONFLICT,
          validation.conflict_message || 'Cannot start stint: conflict detected',
          409,
          undefined,
          { existingStint: null },
        );
      }

      // Fetch the existing stint details
      const { data: existingStint, error: stintError } = await supabase
        .from('stints')
        .select('*')
        .eq('id', validation.existing_stint_id)
        .eq('user_id', user.id)
        .single();

      if (stintError || !existingStint) {
        return errorResponse(
          ErrorCodes.CONFLICT,
          validation.conflict_message || 'Cannot start stint: conflict detected',
          409,
          undefined,
          { existingStint: null },
        );
      }

      return errorResponse(
        ErrorCodes.CONFLICT,
        validation.conflict_message || 'An active stint already exists',
        409,
        undefined,
        { existingStint },
      );
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
      })
      .select('*')
      .single();

    if (createError) {
      // Check if conflict occurred (race condition)
      if (createError.code === POSTGRES_UNIQUE_VIOLATION) {
        // Unique constraint violation - another stint was started concurrently
        const { data: activeStint } = await supabase
          .from('stints')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['active', 'paused'])
          .maybeSingle();

        if (activeStint) {
          return errorResponse(
            ErrorCodes.CONFLICT,
            'Another stint was started concurrently',
            409,
            undefined,
            { existingStint: activeStint },
          );
        }
      }

      console.error('Create error:', createError);
      return errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to create stint',
        500,
        createError.message,
      );
    }

    return jsonResponse(newStint, 201);
  }
  catch (error) {
    console.error('Unexpected error in stints-start:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Internal server error',
      500,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
});
