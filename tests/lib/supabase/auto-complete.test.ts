import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { getTestUser } from '../../setup';
import type { TypedSupabaseClient } from '~/utils/supabase';
import { createProject } from '~/lib/supabase/projects';

let client: TypedSupabaseClient;
let testProjectId: string;
let _testUserId: string;

beforeAll(async () => {
  // Use test user 1 (requires USE_MOCK_SUPABASE=false for integration tests)
  const { client: testClient, user } = await getTestUser(1);
  client = testClient;
  _testUserId = user.id;

  // Create test project using database layer function
  const { data: newProject, error: createError } = await createProject(client, {
    name: 'Test Project for Auto-Complete',
    expected_daily_stints: 3,
  });

  if (createError || !newProject) {
    throw new Error(`Failed to create test project: ${createError?.message}`);
  }

  testProjectId = newProject.id;
});

afterEach(async () => {
  // Clean up test stints after each test
  await client
    .from('stints')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
});

describe('auto_complete_expired_stints', () => {
  it('completes an expired active stint', async () => {
    // Create an expired active stint (started 3 hours ago, duration 120 minutes)
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

    const { data: stint, error: createError } = await client
      .from('stints')
      .insert({
        project_id: testProjectId,
        status: 'active',
        planned_duration: 120,
        started_at: threeHoursAgo,
        paused_duration: 0,
      })
      .select()
      .single();

    expect(createError).toBeNull();
    expect(stint).toBeTruthy();
    expect(stint?.status).toBe('active');

    // Run auto-complete function
    const { data: result, error: fnError } = await client
      .rpc('auto_complete_expired_stints');

    expect(fnError).toBeNull();
    expect(result).toBeTruthy();
    expect(result?.completed_count).toBe(1);
    expect(result?.error_count).toBe(0);

    // Verify stint was completed
    const { data: completedStint, error: verifyError } = await client
      .from('stints')
      .select('*')
      .eq('id', stint!.id)
      .single();

    expect(verifyError).toBeNull();
    expect(completedStint).toBeTruthy();
    expect(completedStint?.status).toBe('completed');
    expect(completedStint?.completion_type).toBe('auto');
    expect(completedStint?.ended_at).toBeTruthy();
    expect(completedStint?.notes).toBeNull();
  });

  it('does NOT complete a paused expired stint', async () => {
    // Create a paused stint that would be expired if it were active
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: stint, error: createError } = await client
      .from('stints')
      .insert({
        project_id: testProjectId,
        status: 'paused',
        planned_duration: 60,
        started_at: threeHoursAgo,
        paused_at: twoHoursAgo,
        paused_duration: 1800,
      })
      .select()
      .single();

    expect(createError).toBeNull();
    expect(stint).toBeTruthy();

    // Run auto-complete function
    const { data: result, error: fnError } = await client
      .rpc('auto_complete_expired_stints');

    expect(fnError).toBeNull();
    expect(result).toBeTruthy();
    expect(result?.completed_count).toBe(0);
    expect(result?.error_count).toBe(0);

    // Verify stint is still paused
    const { data: pausedStint, error: verifyError } = await client
      .from('stints')
      .select('*')
      .eq('id', stint!.id)
      .single();

    expect(verifyError).toBeNull();
    expect(pausedStint).toBeTruthy();
    expect(pausedStint?.status).toBe('paused');
    expect(pausedStint?.completion_type).toBeNull();
  });

  it('does NOT complete a non-expired active stint', async () => {
    // Create an active stint that started 30 minutes ago with 120 minute duration
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: stint, error: createError } = await client
      .from('stints')
      .insert({
        project_id: testProjectId,
        status: 'active',
        planned_duration: 120,
        started_at: thirtyMinutesAgo,
        paused_duration: 0,
      })
      .select()
      .single();

    expect(createError).toBeNull();
    expect(stint).toBeTruthy();

    // Run auto-complete function
    const { data: result, error: fnError } = await client
      .rpc('auto_complete_expired_stints');

    expect(fnError).toBeNull();
    expect(result).toBeTruthy();
    expect(result?.completed_count).toBe(0);
    expect(result?.error_count).toBe(0);

    // Verify stint is still active
    const { data: activeStint, error: verifyError } = await client
      .from('stints')
      .select('*')
      .eq('id', stint!.id)
      .single();

    expect(verifyError).toBeNull();
    expect(activeStint).toBeTruthy();
    expect(activeStint?.status).toBe('active');
    expect(activeStint?.completion_type).toBeNull();
  });

  it('does NOT complete a stint without planned_duration', async () => {
    // Create an active stint without planned_duration
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

    const { data: stint, error: createError } = await client
      .from('stints')
      .insert({
        project_id: testProjectId,
        status: 'active',
        planned_duration: null,
        started_at: threeHoursAgo,
        paused_duration: 0,
      })
      .select()
      .single();

    expect(createError).toBeNull();
    expect(stint).toBeTruthy();

    // Run auto-complete function
    const { data: result, error: fnError } = await client
      .rpc('auto_complete_expired_stints');

    expect(fnError).toBeNull();
    expect(result).toBeTruthy();
    expect(result?.completed_count).toBe(0);
    expect(result?.error_count).toBe(0);

    // Verify stint is still active
    const { data: activeStint, error: verifyError } = await client
      .from('stints')
      .select('*')
      .eq('id', stint!.id)
      .single();

    expect(verifyError).toBeNull();
    expect(activeStint).toBeTruthy();
    expect(activeStint?.status).toBe('active');
    expect(activeStint?.completion_type).toBeNull();
  });

  it('returns 0 completed when no expired stints exist', async () => {
    // Don't create any stints, just run the function
    const { data: result, error: fnError } = await client
      .rpc('auto_complete_expired_stints');

    expect(fnError).toBeNull();
    expect(result).toBeTruthy();
    expect(result?.completed_count).toBe(0);
    expect(result?.error_count).toBe(0);
  });

  it('sets ended_at to current timestamp on auto-completion', async () => {
    const beforeTest = new Date();
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

    const { data: stint, error: createError } = await client
      .from('stints')
      .insert({
        project_id: testProjectId,
        status: 'active',
        planned_duration: 120,
        started_at: threeHoursAgo,
        paused_duration: 0,
      })
      .select()
      .single();

    expect(createError).toBeNull();

    // Run auto-complete function
    await client.rpc('auto_complete_expired_stints');

    const afterTest = new Date();

    // Verify ended_at is set to current time (within test execution window)
    const { data: completedStint } = await client
      .from('stints')
      .select('*')
      .eq('id', stint!.id)
      .single();

    expect(completedStint?.ended_at).toBeTruthy();
    const endedAt = new Date(completedStint!.ended_at!);

    // ended_at should be between beforeTest and afterTest
    expect(endedAt.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
    expect(endedAt.getTime()).toBeLessThanOrEqual(afterTest.getTime());
  });

  it('preserves existing notes on auto-completion', async () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const existingNotes = 'Work in progress';

    const { data: stint, error: createError } = await client
      .from('stints')
      .insert({
        project_id: testProjectId,
        status: 'active',
        planned_duration: 120,
        started_at: threeHoursAgo,
        paused_duration: 0,
        notes: existingNotes,
      })
      .select()
      .single();

    expect(createError).toBeNull();

    // Run auto-complete function
    await client.rpc('auto_complete_expired_stints');

    // Verify notes are preserved
    const { data: completedStint } = await client
      .from('stints')
      .select('*')
      .eq('id', stint!.id)
      .single();

    expect(completedStint?.notes).toBe(existingNotes);
  });
});

// Note: Cron job configuration is verified via direct psql queries
// See: PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
//   -c "SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'auto-complete-stints';"
