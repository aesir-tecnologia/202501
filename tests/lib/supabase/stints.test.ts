import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listStints,
  getStintById,
  getActiveStint,
  createStint,
  updateStint,
  deleteStint,
  startStint,
  pauseStint,
  resumeStint,
  completeStint,
  syncStintCheck,
  type StintRow,
} from '~/lib/supabase/stints';
import type { TypedSupabaseClient } from '~/utils/supabase';

const userId = 'user-123';

const baseStint: StintRow = {
  id: 'stint-1',
  user_id: userId,
  project_id: 'project-1',
  started_at: '2024-01-01T00:00:00.000Z',
  ended_at: null,
  duration_minutes: null,
  is_completed: false,
  notes: null,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: null,
};

type Builder = ReturnType<typeof createQueryBuilder>;

function createQueryBuilder() {
  const builder: Record<string, unknown> = {};

  builder.select = vi.fn().mockReturnValue(builder);
  builder.eq = vi.fn().mockReturnValue(builder);
  builder.in = vi.fn().mockReturnValue(builder);
  builder.order = vi.fn().mockReturnValue(builder);
  builder.insert = vi.fn().mockReturnValue(builder);
  builder.update = vi.fn().mockReturnValue(builder);
  builder.delete = vi.fn().mockReturnValue(builder);
  builder.single = vi.fn();
  builder.maybeSingle = vi.fn();
  builder.is = vi.fn().mockReturnValue(builder);
  builder.then = vi.fn();

  return builder;
}

function createClient(builder: Builder, userResponse = { data: { user: { id: userId } }, error: null }) {
  const authGetUser = vi.fn().mockResolvedValue(userResponse);
  const from = vi.fn().mockReturnValue(builder);

  const client = {
    auth: { getUser: authGetUser },
    from,
  } as unknown as TypedSupabaseClient;

  return { client, authGetUser, from };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('stints data helpers', () => {
  it('lists stints for the current user', async () => {
    const builder = createQueryBuilder();
    builder.then.mockImplementation(resolve => resolve({ data: [baseStint], error: null }));

    const { client, from } = createClient(builder);
    const { data, error } = await listStints(client);

    expect(from).toHaveBeenCalledWith('stints');
    expect(builder.eq).toHaveBeenCalledWith('user_id', userId);
    expect(error).toBeNull();
    expect(data).toEqual([baseStint]);
  });

  it('applies project filter when provided', async () => {
    const builder = createQueryBuilder();
    builder.then.mockImplementation(resolve => resolve({ data: [baseStint], error: null }));

    const { client } = createClient(builder);
    await listStints(client, { projectId: baseStint.project_id });

    expect(builder.eq).toHaveBeenNthCalledWith(1, 'user_id', userId);
    expect(builder.eq).toHaveBeenNthCalledWith(2, 'project_id', baseStint.project_id);
  });

  it('applies active-only filters correctly', async () => {
    const builder = createQueryBuilder();
    builder.then.mockImplementation(resolve => resolve({ data: [baseStint], error: null }));

    const { client } = createClient(builder);
    await listStints(client, { activeOnly: true });

    expect(builder.eq).toHaveBeenNthCalledWith(1, 'user_id', userId);
    expect(builder.in).toHaveBeenCalledWith('status', ['active', 'paused']);
  });

  it('fetches a stint by id scoped to the user', async () => {
    const builder = createQueryBuilder();
    builder.maybeSingle.mockResolvedValue({ data: baseStint, error: null });

    const { client } = createClient(builder);
    const { data, error } = await getStintById(client, baseStint.id);

    expect(builder.eq).toHaveBeenNthCalledWith(1, 'user_id', userId);
    expect(builder.eq).toHaveBeenNthCalledWith(2, 'id', baseStint.id);
    expect(error).toBeNull();
    expect(data).toEqual(baseStint);
  });

  it('fetches the active stint for the user', async () => {
    const builder = createQueryBuilder();
    builder.maybeSingle.mockResolvedValue({ data: baseStint, error: null });

    const { client } = createClient(builder);
    const { data, error } = await getActiveStint(client);

    expect(builder.eq).toHaveBeenCalledWith('user_id', userId);
    expect(builder.in).toHaveBeenCalledWith('status', ['active', 'paused']);
    expect(builder.maybeSingle).toHaveBeenCalled();
    expect(error).toBeNull();
    expect(data).toEqual(baseStint);
  });

  it('returns null when no active stint exists', async () => {
    const builder = createQueryBuilder();
    builder.maybeSingle.mockResolvedValue({ data: null, error: null });

    const { client } = createClient(builder);
    const { data, error } = await getActiveStint(client);

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it('creates a stint with the current user id injected', async () => {
    const builder = createQueryBuilder();
    builder.single.mockResolvedValue({ data: baseStint, error: null });

    const { client } = createClient(builder);
    const { data, error } = await createStint(client, {
      project_id: baseStint.project_id,
      started_at: baseStint.started_at,
      ended_at: baseStint.ended_at,
      duration_minutes: baseStint.duration_minutes,
      is_completed: baseStint.is_completed,
      notes: baseStint.notes,
      created_at: baseStint.created_at,
      updated_at: baseStint.updated_at,
      id: baseStint.id,
    });

    expect(builder.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: userId }));
    expect(error).toBeNull();
    expect(data).toEqual(baseStint);
  });

  it('updates a stint scoped to the user and id', async () => {
    const builder = createQueryBuilder();
    const updated = { ...baseStint, notes: 'Updated' };
    builder.single.mockResolvedValue({ data: updated, error: null });

    const { client } = createClient(builder);
    const { data } = await updateStint(client, baseStint.id, { notes: 'Updated' });

    expect(builder.update).toHaveBeenCalledWith({ notes: 'Updated' });
    expect(builder.eq).toHaveBeenNthCalledWith(1, 'user_id', userId);
    expect(builder.eq).toHaveBeenNthCalledWith(2, 'id', baseStint.id);
    expect(data).toEqual(updated);
  });

  it('deletes a stint scoped to the user', async () => {
    const builder = createQueryBuilder();
    builder.maybeSingle.mockResolvedValue({ data: baseStint, error: null });
    builder.then.mockImplementation(resolve => resolve({ data: null, error: null }));

    const { client } = createClient(builder);
    const { data, error } = await deleteStint(client, baseStint.id);

    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('user_id', userId);
    expect(builder.eq).toHaveBeenCalledWith('id', baseStint.id);
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it('returns an error response when no user session is present', async () => {
    const builder = createQueryBuilder();
    builder.then.mockImplementation(resolve => resolve({ data: [baseStint], error: null }));

    const { client } = createClient(builder, { data: { user: null }, error: null });

    const { data, error } = await listStints(client);

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toMatch(/authenticated/i);
  });
});

describe('startStint', () => {
  const projectId = 'project-1';
  const userVersion = 5;
  const newStint: StintRow = {
    id: 'stint-new',
    user_id: userId,
    project_id: projectId,
    status: 'active',
    started_at: '2024-01-01T12:00:00.000Z',
    planned_duration: 120,
    paused_at: null,
    paused_duration: 0,
    completed_at: null,
    completion_type: null,
    notes: null,
    created_at: '2024-01-01T12:00:00.000Z',
    updated_at: null,
  };

  function createStartStintClient(overrides = {}) {
    const builder = createQueryBuilder();
    const rpc = vi.fn();
    const authGetUser = vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null });
    const from = vi.fn().mockReturnValue(builder);

    const client = {
      auth: { getUser: authGetUser },
      from,
      rpc,
      ...overrides,
    } as unknown as TypedSupabaseClient;

    return { client, authGetUser, from, rpc, builder };
  }

  it('starts a stint successfully with all validations passing', async () => {
    const { client, from, rpc, builder } = createStartStintClient();

    // Mock getUserVersion response
    const versionBuilder = createQueryBuilder();
    versionBuilder.single.mockResolvedValue({ data: { version: userVersion }, error: null });

    // Mock project query response
    const projectBuilder = createQueryBuilder();
    projectBuilder.maybeSingle.mockResolvedValue({
      data: { id: projectId, custom_stint_duration: null, archived_at: null },
      error: null,
    });

    // Mock validate_stint_start RPC response
    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { can_start: true, existing_stint_id: null, conflict_message: null },
        error: null,
      }),
    });

    // Mock insert response
    const insertBuilder = createQueryBuilder();
    insertBuilder.single.mockResolvedValue({ data: newStint, error: null });

    from.mockImplementation((table: string) => {
      if (table === 'user_profiles') return versionBuilder;
      if (table === 'projects') return projectBuilder;
      if (table === 'stints') return insertBuilder;
      return builder;
    });

    const result = await startStint(client, projectId);

    expect(result.error).toBeNull();
    expect(result.data).toEqual(newStint);
    expect(rpc).toHaveBeenCalledWith('validate_stint_start', {
      p_user_id: userId,
      p_project_id: projectId,
      p_version: userVersion,
    });
  });

  it('uses project custom duration when no plannedDurationMinutes provided', async () => {
    const { client, from, rpc, builder } = createStartStintClient();
    const customDuration = 90;

    const versionBuilder = createQueryBuilder();
    versionBuilder.single.mockResolvedValue({ data: { version: userVersion }, error: null });

    const projectBuilder = createQueryBuilder();
    projectBuilder.maybeSingle.mockResolvedValue({
      data: { id: projectId, custom_stint_duration: customDuration, archived_at: null },
      error: null,
    });

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { can_start: true, existing_stint_id: null, conflict_message: null },
        error: null,
      }),
    });

    const insertBuilder = createQueryBuilder();
    insertBuilder.single.mockResolvedValue({
      data: { ...newStint, planned_duration: customDuration },
      error: null,
    });

    from.mockImplementation((table: string) => {
      if (table === 'user_profiles') return versionBuilder;
      if (table === 'projects') return projectBuilder;
      if (table === 'stints') return insertBuilder;
      return builder;
    });

    const result = await startStint(client, projectId);

    expect(result.error).toBeNull();
    expect(insertBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ planned_duration: customDuration }),
    );
  });

  it('uses provided plannedDurationMinutes over project custom duration', async () => {
    const { client, from, rpc, builder } = createStartStintClient();
    const requestedDuration = 60;

    const versionBuilder = createQueryBuilder();
    versionBuilder.single.mockResolvedValue({ data: { version: userVersion }, error: null });

    const projectBuilder = createQueryBuilder();
    projectBuilder.maybeSingle.mockResolvedValue({
      data: { id: projectId, custom_stint_duration: 90, archived_at: null },
      error: null,
    });

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { can_start: true, existing_stint_id: null, conflict_message: null },
        error: null,
      }),
    });

    const insertBuilder = createQueryBuilder();
    insertBuilder.single.mockResolvedValue({
      data: { ...newStint, planned_duration: requestedDuration },
      error: null,
    });

    from.mockImplementation((table: string) => {
      if (table === 'user_profiles') return versionBuilder;
      if (table === 'projects') return projectBuilder;
      if (table === 'stints') return insertBuilder;
      return builder;
    });

    const result = await startStint(client, projectId, requestedDuration);

    expect(result.error).toBeNull();
    expect(insertBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ planned_duration: requestedDuration }),
    );
  });

  it('returns conflict error when validation fails', async () => {
    const { client, from, rpc, builder } = createStartStintClient();
    const existingStintId = 'existing-stint-id';
    const existingStint: StintRow = { ...newStint, id: existingStintId };

    const versionBuilder = createQueryBuilder();
    versionBuilder.single.mockResolvedValue({ data: { version: userVersion }, error: null });

    const projectBuilder = createQueryBuilder();
    projectBuilder.maybeSingle.mockResolvedValue({
      data: { id: projectId, custom_stint_duration: null, archived_at: null },
      error: null,
    });

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: {
          can_start: false,
          existing_stint_id: existingStintId,
          conflict_message: 'An active stint already exists',
        },
        error: null,
      }),
    });

    const existingStintBuilder = createQueryBuilder();
    existingStintBuilder.single.mockResolvedValue({ data: existingStint, error: null });

    from.mockImplementation((table: string) => {
      if (table === 'user_profiles') return versionBuilder;
      if (table === 'projects') return projectBuilder;
      if (table === 'stints') return existingStintBuilder;
      return builder;
    });

    const result = await startStint(client, projectId);

    expect(result.data).toBeNull();
    expect(result.error).toMatchObject({
      code: 'CONFLICT',
      existingStint,
      message: 'An active stint already exists',
    });
  });

  it('returns error when project is archived', async () => {
    const { client, from, rpc, builder } = createStartStintClient();

    const versionBuilder = createQueryBuilder();
    versionBuilder.single.mockResolvedValue({ data: { version: userVersion }, error: null });

    const projectBuilder = createQueryBuilder();
    projectBuilder.maybeSingle.mockResolvedValue({
      data: { id: projectId, custom_stint_duration: null, archived_at: '2024-01-01T00:00:00.000Z' },
      error: null,
    });

    from.mockImplementation((table: string) => {
      if (table === 'user_profiles') return versionBuilder;
      if (table === 'projects') return projectBuilder;
      return builder;
    });

    const result = await startStint(client, projectId);

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toMatch(/archived/i);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('returns error when project not found', async () => {
    const { client, from, rpc, builder } = createStartStintClient();

    const versionBuilder = createQueryBuilder();
    versionBuilder.single.mockResolvedValue({ data: { version: userVersion }, error: null });

    const projectBuilder = createQueryBuilder();
    projectBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

    from.mockImplementation((table: string) => {
      if (table === 'user_profiles') return versionBuilder;
      if (table === 'projects') return projectBuilder;
      return builder;
    });

    const result = await startStint(client, projectId);

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toMatch(/not found/i);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('returns error when duration is below minimum', async () => {
    const { client, from, rpc, builder } = createStartStintClient();

    const versionBuilder = createQueryBuilder();
    versionBuilder.single.mockResolvedValue({ data: { version: userVersion }, error: null });

    const projectBuilder = createQueryBuilder();
    projectBuilder.maybeSingle.mockResolvedValue({
      data: { id: projectId, custom_stint_duration: null, archived_at: null },
      error: null,
    });

    from.mockImplementation((table: string) => {
      if (table === 'user_profiles') return versionBuilder;
      if (table === 'projects') return projectBuilder;
      return builder;
    });

    const result = await startStint(client, projectId, 2);

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toMatch(/between/i);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('returns error when duration exceeds maximum', async () => {
    const { client, from, rpc, builder } = createStartStintClient();

    const versionBuilder = createQueryBuilder();
    versionBuilder.single.mockResolvedValue({ data: { version: userVersion }, error: null });

    const projectBuilder = createQueryBuilder();
    projectBuilder.maybeSingle.mockResolvedValue({
      data: { id: projectId, custom_stint_duration: null, archived_at: null },
      error: null,
    });

    from.mockImplementation((table: string) => {
      if (table === 'user_profiles') return versionBuilder;
      if (table === 'projects') return projectBuilder;
      return builder;
    });

    const result = await startStint(client, projectId, 500);

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toMatch(/between/i);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('handles race condition on insert (23505 error)', async () => {
    const { client, from, rpc, builder } = createStartStintClient();
    const conflictingStint: StintRow = { ...newStint, id: 'conflicting-stint' };

    const versionBuilder = createQueryBuilder();
    versionBuilder.single.mockResolvedValue({ data: { version: userVersion }, error: null });

    const projectBuilder = createQueryBuilder();
    projectBuilder.maybeSingle.mockResolvedValue({
      data: { id: projectId, custom_stint_duration: null, archived_at: null },
      error: null,
    });

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { can_start: true, existing_stint_id: null, conflict_message: null },
        error: null,
      }),
    });

    const insertBuilder = createQueryBuilder();
    insertBuilder.single.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });

    const conflictStintBuilder = createQueryBuilder();
    conflictStintBuilder.maybeSingle.mockResolvedValue({ data: conflictingStint, error: null });

    let callCount = 0;
    from.mockImplementation((table: string) => {
      if (table === 'user_profiles') return versionBuilder;
      if (table === 'projects') return projectBuilder;
      if (table === 'stints') {
        callCount++;
        return callCount === 1 ? insertBuilder : conflictStintBuilder;
      }
      return builder;
    });

    const result = await startStint(client, projectId);

    expect(result.data).toBeNull();
    expect(result.error).toMatchObject({
      code: 'CONFLICT',
      existingStint: conflictingStint,
      message: 'An active stint already exists',
    });
  });

  it('returns error when user is not authenticated', async () => {
    const { client } = createStartStintClient();
    client.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });

    const result = await startStint(client, projectId);

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toMatch(/authenticated/i);
  });

  it('includes notes when provided', async () => {
    const { client, from, rpc, builder } = createStartStintClient();
    const notes = 'Working on feature X';

    const versionBuilder = createQueryBuilder();
    versionBuilder.single.mockResolvedValue({ data: { version: userVersion }, error: null });

    const projectBuilder = createQueryBuilder();
    projectBuilder.maybeSingle.mockResolvedValue({
      data: { id: projectId, custom_stint_duration: null, archived_at: null },
      error: null,
    });

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { can_start: true, existing_stint_id: null, conflict_message: null },
        error: null,
      }),
    });

    const insertBuilder = createQueryBuilder();
    insertBuilder.single.mockResolvedValue({ data: { ...newStint, notes }, error: null });

    from.mockImplementation((table: string) => {
      if (table === 'user_profiles') return versionBuilder;
      if (table === 'projects') return projectBuilder;
      if (table === 'stints') return insertBuilder;
      return builder;
    });

    const result = await startStint(client, projectId, undefined, notes);

    expect(result.error).toBeNull();
    expect(insertBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ notes }),
    );
  });
});

describe('pauseStint', () => {
  const stintId = 'stint-123';
  const activeStint: StintRow = {
    id: stintId,
    user_id: userId,
    project_id: 'project-1',
    status: 'active',
    started_at: '2024-01-01T12:00:00.000Z',
    planned_duration: 120,
    paused_at: null,
    paused_duration: 0,
    completed_at: null,
    completion_type: null,
    notes: null,
    created_at: '2024-01-01T12:00:00.000Z',
    updated_at: null,
  };

  const pausedStint: StintRow = {
    ...activeStint,
    status: 'paused',
    paused_at: '2024-01-01T12:30:00.000Z',
    updated_at: '2024-01-01T12:30:00.000Z',
  };

  function createPauseStintClient() {
    const rpc = vi.fn();
    const authGetUser = vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null });

    const client = {
      auth: { getUser: authGetUser },
      rpc,
    } as unknown as TypedSupabaseClient;

    return { client, authGetUser, rpc };
  }

  it('pauses an active stint successfully', async () => {
    const { client, rpc } = createPauseStintClient();

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: pausedStint, error: null }),
    });

    const { data, error } = await pauseStint(client, stintId);

    expect(rpc).toHaveBeenCalledWith('pause_stint', { p_stint_id: stintId });
    expect(error).toBeNull();
    expect(data).toEqual(pausedStint);
  });

  it('returns user-friendly error when stint is not active', async () => {
    const { client, rpc } = createPauseStintClient();

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Stint is not active' },
      }),
    });

    const { data, error } = await pauseStint(client, stintId);

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('This stint is not active and cannot be paused');
  });

  it('returns user-friendly error when stint is not found', async () => {
    const { client, rpc } = createPauseStintClient();

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Stint not found' },
      }),
    });

    const { data, error } = await pauseStint(client, stintId);

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('Stint not found');
  });

  it('returns generic error for unknown database errors', async () => {
    const { client, rpc } = createPauseStintClient();

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Unknown database error' },
      }),
    });

    const { data, error } = await pauseStint(client, stintId);

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('Failed to pause stint');
  });

  it('returns error when no data returned', async () => {
    const { client, rpc } = createPauseStintClient();

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const { data, error } = await pauseStint(client, stintId);

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('No data returned from pause operation');
  });

  it('returns error when user is not authenticated', async () => {
    const { client } = createPauseStintClient();
    client.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });

    const { data, error } = await pauseStint(client, stintId);

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toMatch(/authenticated/i);
  });
});

describe('resumeStint', () => {
  const stintId = 'stint-123';
  const pausedStint: StintRow = {
    id: stintId,
    user_id: userId,
    project_id: 'project-1',
    status: 'paused',
    started_at: '2024-01-01T12:00:00.000Z',
    planned_duration: 120,
    paused_at: '2024-01-01T12:30:00.000Z',
    paused_duration: 1800,
    completed_at: null,
    completion_type: null,
    notes: null,
    created_at: '2024-01-01T12:00:00.000Z',
    updated_at: '2024-01-01T12:30:00.000Z',
  };

  const resumedStint: StintRow = {
    ...pausedStint,
    status: 'active',
    updated_at: '2024-01-01T13:00:00.000Z',
  };

  function createResumeStintClient() {
    const rpc = vi.fn();
    const authGetUser = vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null });

    const client = {
      auth: { getUser: authGetUser },
      rpc,
    } as unknown as TypedSupabaseClient;

    return { client, authGetUser, rpc };
  }

  it('resumes a paused stint successfully', async () => {
    const { client, rpc } = createResumeStintClient();

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: resumedStint, error: null }),
    });

    const { data, error } = await resumeStint(client, stintId);

    expect(rpc).toHaveBeenCalledWith('resume_stint', { p_stint_id: stintId });
    expect(error).toBeNull();
    expect(data).toEqual(resumedStint);
  });

  it('returns user-friendly error when stint is not paused', async () => {
    const { client, rpc } = createResumeStintClient();

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Stint is not paused' },
      }),
    });

    const { data, error } = await resumeStint(client, stintId);

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('This stint is not paused and cannot be resumed');
  });

  it('returns user-friendly error when stint is not found', async () => {
    const { client, rpc } = createResumeStintClient();

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Stint not found' },
      }),
    });

    const { data, error } = await resumeStint(client, stintId);

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('Stint not found');
  });

  it('returns generic error for unknown database errors', async () => {
    const { client, rpc } = createResumeStintClient();

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Unknown database error' },
      }),
    });

    const { data, error } = await resumeStint(client, stintId);

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('Failed to resume stint');
  });

  it('returns error when no data returned', async () => {
    const { client, rpc } = createResumeStintClient();

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const { data, error } = await resumeStint(client, stintId);

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('No data returned from resume operation');
  });

  it('returns error when user is not authenticated', async () => {
    const { client } = createResumeStintClient();
    client.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });

    const { data, error } = await resumeStint(client, stintId);

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toMatch(/authenticated/i);
  });
});

describe('completeStint', () => {
  const stintId = 'stint-123';
  const activeStint: StintRow = {
    id: stintId,
    user_id: userId,
    project_id: 'project-1',
    status: 'active',
    started_at: '2024-01-01T12:00:00.000Z',
    planned_duration: 120,
    paused_at: null,
    paused_duration: 0,
    completed_at: null,
    completion_type: null,
    notes: null,
    created_at: '2024-01-01T12:00:00.000Z',
    updated_at: null,
  };

  const completedStint: StintRow = {
    ...activeStint,
    status: 'completed',
    completed_at: '2024-01-01T14:00:00.000Z',
    completion_type: 'manual',
    updated_at: '2024-01-01T14:00:00.000Z',
  };

  function createCompleteStintClient() {
    const rpc = vi.fn();
    const authGetUser = vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null });

    const client = {
      auth: { getUser: authGetUser },
      rpc,
    } as unknown as TypedSupabaseClient;

    return { client, authGetUser, rpc };
  }

  it('completes an active stint with manual completion type', async () => {
    const { client, rpc } = createCompleteStintClient();

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: completedStint, error: null }),
    });

    const { data, error } = await completeStint(client, stintId, 'manual');

    expect(rpc).toHaveBeenCalledWith('complete_stint', {
      p_stint_id: stintId,
      p_completion_type: 'manual',
      p_notes: null,
    });
    expect(error).toBeNull();
    expect(data).toEqual(completedStint);
  });

  it('completes a stint with auto completion type', async () => {
    const { client, rpc } = createCompleteStintClient();
    const autoCompletedStint = { ...completedStint, completion_type: 'auto' };

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: autoCompletedStint, error: null }),
    });

    const { data, error } = await completeStint(client, stintId, 'auto');

    expect(rpc).toHaveBeenCalledWith('complete_stint', {
      p_stint_id: stintId,
      p_completion_type: 'auto',
      p_notes: null,
    });
    expect(error).toBeNull();
    expect(data).toEqual(autoCompletedStint);
  });

  it('completes a stint with interrupted completion type', async () => {
    const { client, rpc } = createCompleteStintClient();
    const interruptedStint = { ...completedStint, completion_type: 'interrupted' };

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: interruptedStint, error: null }),
    });

    const { data, error } = await completeStint(client, stintId, 'interrupted');

    expect(rpc).toHaveBeenCalledWith('complete_stint', {
      p_stint_id: stintId,
      p_completion_type: 'interrupted',
      p_notes: null,
    });
    expect(error).toBeNull();
    expect(data).toEqual(interruptedStint);
  });

  it('completes a stint with notes', async () => {
    const { client, rpc } = createCompleteStintClient();
    const notes = 'Completed feature implementation';
    const stintWithNotes = { ...completedStint, notes };

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: stintWithNotes, error: null }),
    });

    const { data, error } = await completeStint(client, stintId, 'manual', notes);

    expect(rpc).toHaveBeenCalledWith('complete_stint', {
      p_stint_id: stintId,
      p_completion_type: 'manual',
      p_notes: notes,
    });
    expect(error).toBeNull();
    expect(data).toEqual(stintWithNotes);
  });

  it('validates notes length (max 500 chars)', async () => {
    const { client, rpc } = createCompleteStintClient();
    const longNotes = 'a'.repeat(501);

    const { data, error } = await completeStint(client, stintId, 'manual', longNotes);

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('Notes cannot exceed 500 characters');
    expect(rpc).not.toHaveBeenCalled();
  });

  it('allows notes up to 500 chars', async () => {
    const { client, rpc } = createCompleteStintClient();
    const exactlyMaxNotes = 'a'.repeat(500);
    const stintWithNotes = { ...completedStint, notes: exactlyMaxNotes };

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: stintWithNotes, error: null }),
    });

    const { error } = await completeStint(client, stintId, 'manual', exactlyMaxNotes);

    expect(error).toBeNull();
    expect(rpc).toHaveBeenCalledWith('complete_stint', {
      p_stint_id: stintId,
      p_completion_type: 'manual',
      p_notes: exactlyMaxNotes,
    });
  });

  it('returns user-friendly error when stint is not active or paused', async () => {
    const { client, rpc } = createCompleteStintClient();

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Stint is not active or paused' },
      }),
    });

    const { data, error } = await completeStint(client, stintId, 'manual');

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('This stint is not active or paused and cannot be completed');
  });

  it('returns user-friendly error when stint is not found', async () => {
    const { client, rpc } = createCompleteStintClient();

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Stint not found' },
      }),
    });

    const { data, error } = await completeStint(client, stintId, 'manual');

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('Stint not found');
  });

  it('returns generic error for unknown database errors', async () => {
    const { client, rpc } = createCompleteStintClient();

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Unknown database error' },
      }),
    });

    const { data, error } = await completeStint(client, stintId, 'manual');

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('Failed to complete stint');
  });

  it('returns error when no data returned', async () => {
    const { client, rpc } = createCompleteStintClient();

    rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const { data, error } = await completeStint(client, stintId, 'manual');

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('No data returned from complete operation');
  });

  it('returns error when user is not authenticated', async () => {
    const { client } = createCompleteStintClient();
    client.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });

    const { data, error } = await completeStint(client, stintId, 'manual');

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toMatch(/authenticated/i);
  });
});

describe('syncStintCheck', () => {
  const stintId = 'stint-123';
  const now = new Date('2024-01-01T12:30:00.000Z');

  const activeStint: StintRow = {
    id: stintId,
    user_id: userId,
    project_id: 'project-1',
    status: 'active',
    started_at: '2024-01-01T12:00:00.000Z',
    planned_duration: 120,
    paused_at: null,
    paused_duration: 0,
    completed_at: null,
    completion_type: null,
    notes: null,
    created_at: '2024-01-01T12:00:00.000Z',
    updated_at: null,
  };

  const pausedStint: StintRow = {
    ...activeStint,
    status: 'paused',
    paused_at: '2024-01-01T12:20:00.000Z',
    paused_duration: 5,
  };

  const completedStint: StintRow = {
    ...activeStint,
    status: 'completed',
    completed_at: '2024-01-01T14:00:00.000Z',
    completion_type: 'manual',
  };

  function createSyncStintCheckClient() {
    const builder = createQueryBuilder();
    const authGetUser = vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null });
    const from = vi.fn().mockReturnValue(builder);

    const client = {
      auth: { getUser: authGetUser },
      from,
    } as unknown as TypedSupabaseClient;

    return { client, authGetUser, from, builder };
  }

  beforeEach(() => {
    vi.setSystemTime(now);
  });

  it('returns sync data for active stint', async () => {
    const { client, builder } = createSyncStintCheckClient();

    builder.maybeSingle.mockResolvedValue({ data: activeStint, error: null });

    const { data, error } = await syncStintCheck(client, stintId);

    expect(error).toBeNull();
    expect(data).toMatchObject({
      stintId,
      status: 'active',
      serverTimestamp: expect.any(String),
      remainingSeconds: expect.any(Number),
    });

    expect(data?.remainingSeconds).toBe(5400);
  });

  it('returns sync data for paused stint', async () => {
    const { client, builder } = createSyncStintCheckClient();

    builder.maybeSingle.mockResolvedValue({ data: pausedStint, error: null });

    const { data, error } = await syncStintCheck(client, stintId);

    expect(error).toBeNull();
    expect(data).toMatchObject({
      stintId,
      status: 'paused',
      serverTimestamp: expect.any(String),
      remainingSeconds: expect.any(Number),
    });

    expect(data?.remainingSeconds).toBe(6005);
  });

  it('returns error when stint is completed', async () => {
    const { client, builder } = createSyncStintCheckClient();

    builder.maybeSingle.mockResolvedValue({ data: completedStint, error: null });

    const { data, error } = await syncStintCheck(client, stintId);

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('Stint is completed and cannot be synced');
  });

  it('returns error when stint is not found', async () => {
    const { client, builder } = createSyncStintCheckClient();

    builder.maybeSingle.mockResolvedValue({ data: null, error: null });

    const { data, error } = await syncStintCheck(client, stintId);

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('Stint not found');
  });

  it('returns error when database query fails', async () => {
    const { client, builder } = createSyncStintCheckClient();

    builder.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const { data, error } = await syncStintCheck(client, stintId);

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('Failed to query stint');
  });

  it('calculates remaining time correctly for active stint', async () => {
    const { client, builder } = createSyncStintCheckClient();

    builder.maybeSingle.mockResolvedValue({ data: activeStint, error: null });

    const { data } = await syncStintCheck(client, stintId);

    expect(data?.remainingSeconds).toBe(5400);
  });

  it('never returns negative remaining seconds', async () => {
    const { client, builder } = createSyncStintCheckClient();

    const expiredStint: StintRow = {
      ...activeStint,
      started_at: '2024-01-01T10:00:00.000Z',
    };

    builder.maybeSingle.mockResolvedValue({ data: expiredStint, error: null });

    const { data } = await syncStintCheck(client, stintId);

    expect(data?.remainingSeconds).toBe(0);
  });

  it('requires user authentication', async () => {
    const { client } = createSyncStintCheckClient();
    client.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });

    const { data, error } = await syncStintCheck(client, stintId);

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toMatch(/authenticated/i);
  });
});
