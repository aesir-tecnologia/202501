import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listStints,
  getStintById,
  getActiveStint,
  createStint,
  updateStint,
  deleteStint,
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
  status: 'active',
  planned_duration: 120,
  actual_duration: null,
  paused_duration: 0,
  paused_at: null,
  completion_type: null,
  notes: null,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: null,
};

type Builder = ReturnType<typeof createQueryBuilder>;

function createQueryBuilder() {
  const builder: Record<string, unknown> = {};

  builder.select = vi.fn().mockReturnValue(builder);
  builder.eq = vi.fn().mockReturnValue(builder);
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

  it('fetches the active stint for the user via Edge Function', async () => {
    const mockFunctions = {
      invoke: vi.fn().mockResolvedValue({ data: baseStint, error: null }),
    };

    const { client } = createClient(createQueryBuilder());
    client.functions = mockFunctions as any;

    const { data, error } = await getActiveStint(client);

    expect(mockFunctions.invoke).toHaveBeenCalledWith('stints-active', { body: {} });
    expect(error).toBeNull();
    expect(data).toEqual(baseStint);
  });

  it('creates a stint with the current user id injected', async () => {
    const builder = createQueryBuilder();
    builder.single.mockResolvedValue({ data: baseStint, error: null });

    const { client } = createClient(builder);
    const { data, error } = await createStint(client, {
      project_id: baseStint.project_id,
      started_at: baseStint.started_at,
      ended_at: baseStint.ended_at,
      status: baseStint.status,
      planned_duration: baseStint.planned_duration,
      actual_duration: baseStint.actual_duration,
      paused_duration: baseStint.paused_duration,
      paused_at: baseStint.paused_at,
      completion_type: baseStint.completion_type,
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
    builder.then.mockImplementation(resolve => resolve({ data: null, error: null }));

    const { client } = createClient(builder);
    const { data, error } = await deleteStint(client, baseStint.id);

    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenNthCalledWith(1, 'user_id', userId);
    expect(builder.eq).toHaveBeenNthCalledWith(2, 'id', baseStint.id);
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
