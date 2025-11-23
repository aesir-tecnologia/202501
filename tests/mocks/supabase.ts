import type { TypedSupabaseClient } from '~/utils/supabase';
import type { Database } from '~/types/database.types';

type ProjectRow = Database['public']['Tables']['projects']['Row'];
type StintRow = Database['public']['Tables']['stints']['Row'];

interface MockUser {
  id: string
  email: string
}

interface InMemoryStore {
  projects: Map<string, ProjectRow>
  stints: Map<string, StintRow>
  users: Map<string, MockUser>
}

const store: InMemoryStore = {
  projects: new Map(),
  stints: new Map(),
  users: new Map(),
};

export function resetMockStore() {
  store.projects.clear();
  store.stints.clear();
}

export function setMockUser(user: MockUser) {
  store.users.set(user.id, user);
}

export function createMockSupabaseClient(userId: string, userEmail: string): TypedSupabaseClient {
  const user: MockUser = { id: userId, email: userEmail };
  setMockUser(user);

  let currentUser: MockUser | null = user;

  const client = {
    auth: {
      getUser: async () => {
        if (!currentUser) {
          return {
            data: { user: null },
            error: new Error('User not authenticated'),
          };
        }
        return {
          data: { user: currentUser },
          error: null,
        };
      },
      signInWithPassword: async ({ email }: { email: string, password: string }) => {
        const user = Array.from(store.users.values()).find(u => u.email === email);
        if (!user) {
          return {
            data: { user: null, session: null },
            error: new Error('Invalid credentials'),
          };
        }
        currentUser = user;
        return {
          data: {
            user,
            session: { access_token: 'mock-token', refresh_token: 'mock-refresh' },
          },
          error: null,
        };
      },
      signOut: async () => {
        currentUser = null;
        return { error: null };
      },
    },
    from: (table: string) => {
      return createQueryBuilder(table, () => currentUser);
    },
  } as unknown as TypedSupabaseClient;

  return client;
}

function createQueryBuilder(table: string, getCurrentUser: () => MockUser | null) {
  const state = {
    table,
    filters: [] as Array<{ field: string, op: string, value: unknown }>,
    selectFields: '*',
    orderBy: null as { field: string, ascending: boolean } | null,
    limitValue: null as number | null,
    isSingle: false,
    isMaybeSingle: false,
  };

  const builder = {
    select: (fields = '*') => {
      state.selectFields = fields;
      return builder;
    },
    eq: (field: string, value: unknown) => {
      state.filters.push({ field, op: 'eq', value });
      return builder;
    },
    neq: (field: string, value: unknown) => {
      state.filters.push({ field, op: 'neq', value });
      return builder;
    },
    in: (field: string, values: unknown[]) => {
      state.filters.push({ field, op: 'in', value: values });
      return builder;
    },
    is: (field: string, value: unknown) => {
      state.filters.push({ field, op: 'is', value });
      return builder;
    },
    filter: (field: string, op: string, value?: unknown) => {
      state.filters.push({ field, op, value });
      return builder;
    },
    order: (field: string, options?: { ascending?: boolean }) => {
      state.orderBy = { field, ascending: options?.ascending ?? true };
      return builder;
    },
    limit: (count: number) => {
      state.limitValue = count;
      return builder;
    },
    single: () => {
      state.isSingle = true;
      return builder;
    },
    maybeSingle: () => {
      state.isMaybeSingle = true;
      return builder;
    },
    insert: (payload: unknown) => {
      const insertState = { payload };
      const insertBuilder = {
        select: () => insertBuilder,
        single: async () => {
          if (state.table === 'projects') {
            return handleProjectInsert(insertState.payload as Partial<ProjectRow>, getCurrentUser);
          }
          if (state.table === 'stints') {
            return handleStintInsert(insertState.payload as Partial<StintRow>, getCurrentUser);
          }
          return { data: null, error: new Error('Table not mocked') };
        },
      };

      return new Proxy(insertBuilder, {
        get(target, prop) {
          if (prop === 'then') {
            const executeInsert = async () => {
              const isArray = Array.isArray(insertState.payload);

              if (state.table === 'projects') {
                if (isArray) {
                  const results = [];
                  for (const item of insertState.payload as Partial<ProjectRow>[]) {
                    const result = handleProjectInsert(item, getCurrentUser);
                    if (result.error) return result;
                    results.push(result.data);
                  }
                  return { data: results, error: null };
                }
                return handleProjectInsert(insertState.payload as Partial<ProjectRow>, getCurrentUser);
              }

              if (state.table === 'stints') {
                if (isArray) {
                  const results = [];
                  for (const item of insertState.payload as Partial<StintRow>[]) {
                    const result = handleStintInsert(item, getCurrentUser);
                    if (result.error) return result;
                    results.push(result.data);
                  }
                  return { data: results, error: null };
                }
                return handleStintInsert(insertState.payload as Partial<StintRow>, getCurrentUser);
              }

              return { data: null, error: new Error('Table not mocked') };
            };
            return executeInsert().then.bind(executeInsert());
          }
          return (target as Record<string, unknown>)[prop as string];
        },
      });
    },
    update: (payload: unknown) => {
      const updateState = { payload };
      const updateBuilder = {
        eq: (field: string, value: unknown) => {
          state.filters.push({ field, op: 'eq', value });
          return updateBuilder;
        },
        select: () => updateBuilder,
        single: async () => {
          if (state.table === 'projects') {
            const result = handleProjectUpdate(state.filters, updateState.payload as Partial<ProjectRow>);
            if (Array.isArray(result.data)) {
              return { data: result.data[0] || null, error: result.error };
            }
            return result;
          }
          if (state.table === 'stints') {
            const result = handleStintUpdate(state.filters, updateState.payload as Partial<StintRow>);
            if (Array.isArray(result.data)) {
              return { data: result.data[0] || null, error: result.error };
            }
            return result;
          }
          return { data: null, error: new Error('Table not mocked') };
        },
      };

      return new Proxy(updateBuilder, {
        get(target, prop) {
          if (prop === 'then') {
            const executeUpdate = async () => {
              if (state.table === 'projects') {
                return handleProjectUpdate(state.filters, updateState.payload as Partial<ProjectRow>);
              }
              if (state.table === 'stints') {
                return handleStintUpdate(state.filters, updateState.payload as Partial<StintRow>);
              }
              return { data: null, error: new Error('Table not mocked') };
            };
            return executeUpdate().then.bind(executeUpdate());
          }
          return (target as Record<string, unknown>)[prop as string];
        },
      });
    },
    delete: () => {
      const deleteBuilder = {
        eq: (field: string, value: unknown) => {
          state.filters.push({ field, op: 'eq', value });
          return deleteBuilder;
        },
        neq: (field: string, value: unknown) => {
          state.filters.push({ field, op: 'neq', value });
          return deleteBuilder;
        },
      };

      return new Proxy(deleteBuilder, {
        get(target, prop) {
          if (prop === 'then') {
            const executeDelete = async () => {
              if (state.table === 'projects') {
                return handleProjectDelete(state.filters);
              }
              if (state.table === 'stints') {
                return handleStintDelete(state.filters);
              }
              return { data: null, error: new Error('Table not mocked') };
            };
            return executeDelete().then.bind(executeDelete());
          }
          return (target as Record<string, unknown>)[prop as string];
        },
      });
    },
  };

  const executeQuery = async () => {
    if (state.table === 'projects') {
      return executeProjectQuery(state);
    }
    if (state.table === 'stints') {
      return executeStintQuery(state);
    }
    return { data: null, error: new Error('Table not mocked') };
  };

  return new Proxy(builder, {
    get(target, prop) {
      if (prop === 'then') {
        return executeQuery().then.bind(executeQuery());
      }
      return (target as Record<string, unknown>)[prop as string];
    },
  });
}

function matchesFilters(row: Record<string, unknown>, filters: Array<{ field: string, op: string, value: unknown }>): boolean {
  return filters.every(({ field, op, value }) => {
    const fieldValue = row[field];
    switch (op) {
      case 'eq':
        return fieldValue === value;
      case 'neq':
        return fieldValue !== value;
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);
      case 'is':
        return value === null ? fieldValue === null : fieldValue === value;
      case 'not.is':
        return value === null ? fieldValue !== null : fieldValue !== value;
      default:
        return true;
    }
  });
}

function executeProjectQuery(state: {
  filters: Array<{ field: string, op: string, value: unknown }>
  orderBy: { field: string, ascending: boolean } | null
  limitValue: number | null
  isSingle: boolean
  isMaybeSingle: boolean
}) {
  let results = Array.from(store.projects.values()).filter(row =>
    matchesFilters(row as unknown as Record<string, unknown>, state.filters),
  );

  if (state.orderBy) {
    results.sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[state.orderBy!.field];
      const bVal = (b as Record<string, unknown>)[state.orderBy!.field];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return state.orderBy!.ascending ? comparison : -comparison;
    });
  }

  if (state.limitValue !== null) {
    results = results.slice(0, state.limitValue);
  }

  if (state.isSingle) {
    return { data: results[0] || null, error: results.length === 0 ? new Error('No rows found') : null };
  }

  if (state.isMaybeSingle) {
    return { data: results[0] || null, error: null };
  }

  return { data: results, error: null };
}

function executeStintQuery(state: {
  filters: Array<{ field: string, op: string, value: unknown }>
  orderBy: { field: string, ascending: boolean } | null
  limitValue: number | null
  isSingle: boolean
  isMaybeSingle: boolean
}) {
  let results = Array.from(store.stints.values()).filter(row =>
    matchesFilters(row as unknown as Record<string, unknown>, state.filters),
  );

  if (state.orderBy) {
    results.sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[state.orderBy!.field];
      const bVal = (b as Record<string, unknown>)[state.orderBy!.field];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return state.orderBy!.ascending ? comparison : -comparison;
    });
  }

  if (state.limitValue !== null) {
    results = results.slice(0, state.limitValue);
  }

  if (state.isSingle) {
    return { data: results[0] || null, error: results.length === 0 ? new Error('No rows found') : null };
  }

  if (state.isMaybeSingle) {
    return { data: results[0] || null, error: null };
  }

  return { data: results, error: null };
}

function handleProjectInsert(payload: Partial<ProjectRow>, getCurrentUser: () => MockUser | null) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const existingWithSameName = Array.from(store.projects.values()).find(
    p => p.user_id === currentUser.id
      && p.name.toLowerCase() === (payload.name?.toLowerCase() || ''),
  );

  if (existingWithSameName) {
    return {
      data: null,
      error: Object.assign(new Error('duplicate key value violates unique constraint'), { code: '23505' }),
    };
  }

  let sortOrder: number;
  if (payload.sort_order !== undefined && payload.sort_order !== null) {
    sortOrder = payload.sort_order;
  }
  else {
    const userProjects = Array.from(store.projects.values()).filter(
      p => p.user_id === currentUser.id,
    );
    const maxSortOrder = userProjects.length > 0
      ? Math.max(...userProjects.map(p => p.sort_order!))
      : -1;
    sortOrder = maxSortOrder + 1;
  }

  const newProject: ProjectRow = {
    id: `project-${Date.now()}-${Math.random()}`,
    user_id: currentUser.id,
    name: payload.name || '',
    expected_daily_stints: payload.expected_daily_stints ?? 3,
    custom_stint_duration: payload.custom_stint_duration ?? 45,
    is_active: payload.is_active ?? true,
    color_tag: payload.color_tag ?? null,
    sort_order: sortOrder,
    archived_at: payload.archived_at ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.projects.set(newProject.id, newProject);
  return { data: newProject, error: null };
}

function handleProjectUpdate(
  filters: Array<{ field: string, op: string, value: unknown }>,
  payload: Partial<ProjectRow>,
) {
  const matching = Array.from(store.projects.values()).filter(row =>
    matchesFilters(row as unknown as Record<string, unknown>, filters),
  );

  if (matching.length === 0) {
    return { data: null, error: new Error('No rows found') };
  }

  const updated = matching.map((project) => {
    const updatedProject = {
      ...project,
      ...payload,
      updated_at: new Date().toISOString(),
    };
    store.projects.set(updatedProject.id, updatedProject);
    return updatedProject;
  });

  return { data: updated, error: null };
}

function handleProjectDelete(filters: Array<{ field: string, op: string, value: unknown }>) {
  const matching = Array.from(store.projects.values()).filter(row =>
    matchesFilters(row as unknown as Record<string, unknown>, filters),
  );

  for (const project of matching) {
    const hasActiveStint = Array.from(store.stints.values()).some(
      stint => stint.project_id === project.id && stint.ended_at === null,
    );

    if (hasActiveStint) {
      return {
        data: null,
        error: Object.assign(
          new Error('Cannot delete project with active stint'),
          { code: '23503' },
        ),
      };
    }

    store.projects.delete(project.id);

    const projectStints = Array.from(store.stints.values()).filter(
      stint => stint.project_id === project.id,
    );
    for (const stint of projectStints) {
      store.stints.delete(stint.id);
    }
  }

  return { data: matching, error: null };
}

function handleStintInsert(payload: Partial<StintRow>, getCurrentUser: () => MockUser | null) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const project = store.projects.get(payload.project_id || '');
  if (!project) {
    return {
      data: null,
      error: Object.assign(new Error('Project not found'), { code: '23503' }),
    };
  }

  if (project.user_id !== currentUser.id) {
    return { data: null, error: new Error('Project belongs to another user') };
  }

  const newStint: StintRow = {
    id: `stint-${Date.now()}-${Math.random()}`,
    user_id: currentUser.id,
    project_id: payload.project_id || '',
    started_at: payload.started_at || new Date().toISOString(),
    ended_at: payload.ended_at ?? null,
    notes: payload.notes ?? null,
    actual_duration: payload.actual_duration ?? null,
    completion_type: payload.completion_type ?? null,
    paused_at: payload.paused_at ?? null,
    paused_duration: payload.paused_duration ?? 0,
    planned_duration: payload.planned_duration ?? 120,
    status: payload.status ?? 'active' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.stints.set(newStint.id, newStint);
  return { data: newStint, error: null };
}

function handleStintUpdate(
  filters: Array<{ field: string, op: string, value: unknown }>,
  payload: Partial<StintRow>,
) {
  const matching = Array.from(store.stints.values()).filter(row =>
    matchesFilters(row as unknown as Record<string, unknown>, filters),
  );

  if (matching.length === 0) {
    return { data: null, error: new Error('No rows found') };
  }

  const updated = matching.map((stint) => {
    const updatedStint = {
      ...stint,
      ...payload,
      updated_at: new Date().toISOString(),
    };
    store.stints.set(updatedStint.id, updatedStint);
    return updatedStint;
  });

  return { data: updated, error: null };
}

function handleStintDelete(filters: Array<{ field: string, op: string, value: unknown }>) {
  const matching = Array.from(store.stints.values()).filter(row =>
    matchesFilters(row as unknown as Record<string, unknown>, filters),
  );

  for (const stint of matching) {
    store.stints.delete(stint.id);
  }

  return { data: matching, error: null };
}
