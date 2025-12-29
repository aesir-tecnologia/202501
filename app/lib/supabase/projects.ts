import type { Database } from '~/types/database.types';
import type { TypedSupabaseClient } from '~/utils/supabase';
import { requireUserId, type Result } from './auth';

export type ProjectRow = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export type CreateProjectPayload = Omit<ProjectInsert, 'user_id'>;
export type UpdateProjectPayload = Omit<ProjectUpdate, 'user_id' | 'id'>;

export type { Result };

const POSTGRES_UNIQUE_VIOLATION = '23505';

async function checkForActiveStints(
  client: TypedSupabaseClient,
  projectId: string,
  userId: string,
): Promise<boolean> {
  const { data: activeStints } = await client
    .from('stints')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .is('ended_at', null)
    .limit(1);

  return Boolean(activeStints && activeStints.length > 0);
}

async function verifyProjectOwnership(
  client: TypedSupabaseClient,
  projectId: string,
  operation: string,
): Promise<Result<ProjectRow>> {
  const projectResult = await getProject(client, projectId);
  if (projectResult.error) {
    return {
      data: null,
      error: projectResult.error,
    };
  }
  if (!projectResult.data) {
    return {
      data: null,
      error: new Error(`Project not found or you do not have permission to ${operation} it`),
    };
  }
  return {
    data: projectResult.data,
    error: null,
  };
}

export async function listProjects(
  client: TypedSupabaseClient,
  options?: { includeInactive?: boolean, archived?: boolean },
): Promise<Result<ProjectRow[]>> {
  const userResult = await requireUserId(client, 'interact with projects');
  if (userResult.error || !userResult.data) {
    return { data: null, error: userResult.error || new Error('User ID unavailable') };
  }
  const userId = userResult.data;

  let query = client
    .from('projects')
    .select('*')
    .eq('user_id', userId);

  if (options?.archived) {
    query = query.filter('archived_at', 'not.is', null);
  }
  else {
    query = query.is('archived_at', null);
  }

  if (!options?.includeInactive && !options?.archived) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.order('sort_order', { ascending: true });

  if (error) return { data: null, error };
  return { data: data || [], error: null };
}

export async function getProject(
  client: TypedSupabaseClient,
  projectId: string,
): Promise<Result<ProjectRow | null>> {
  const userResult = await requireUserId(client, 'interact with projects');
  if (userResult.error || !userResult.data) {
    return { data: null, error: userResult.error || new Error('User ID unavailable') };
  }
  const userId = userResult.data;

  const { data, error } = await client
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .eq('id', projectId)
    .maybeSingle<ProjectRow>();

  if (error) return { data: null, error };
  return { data, error: null };
}

export async function createProject(
  client: TypedSupabaseClient,
  payload: CreateProjectPayload,
): Promise<Result<ProjectRow>> {
  const userResult = await requireUserId(client, 'interact with projects');
  if (userResult.error || !userResult.data) {
    return { data: null, error: userResult.error || new Error('User ID unavailable') };
  }
  const userId = userResult.data;

  const { data, error } = await client
    .from('projects')
    .insert({
      ...payload,
      user_id: userId,
    })
    .select('*')
    .single<ProjectRow>();

  if (error) {
    if (error.code === POSTGRES_UNIQUE_VIOLATION) {
      return { data: null, error: new Error('A project with this name already exists') };
    }
    return { data: null, error };
  }

  return { data, error: null };
}

export async function updateProject(
  client: TypedSupabaseClient,
  projectId: string,
  updates: UpdateProjectPayload,
): Promise<Result<ProjectRow>> {
  const userResult = await requireUserId(client, 'interact with projects');
  if (userResult.error || !userResult.data) {
    return { data: null, error: userResult.error || new Error('User ID unavailable') };
  }
  const userId = userResult.data;

  const { data, error } = await client
    .from('projects')
    .update(updates)
    .eq('user_id', userId)
    .eq('id', projectId)
    .select('*')
    .single<ProjectRow>();

  if (error) {
    if (error.code === POSTGRES_UNIQUE_VIOLATION) {
      return { data: null, error: new Error('A project with this name already exists') };
    }
    return { data: null, error };
  }

  return { data, error: null };
}

export async function deleteProject(
  client: TypedSupabaseClient,
  projectId: string,
): Promise<Result<void>> {
  const userResult = await requireUserId(client, 'interact with projects');
  if (userResult.error || !userResult.data) {
    return { data: null, error: userResult.error || new Error('User ID unavailable') };
  }
  const userId = userResult.data;

  // Verify project exists and is owned by user
  const projectResult = await getProject(client, projectId);
  if (projectResult.error) return { data: null, error: projectResult.error };
  if (!projectResult.data) {
    return { data: null, error: new Error('Project not found or you do not have permission to delete it') };
  }

  // Check for active stints
  const hasActive = await checkForActiveStints(client, projectId, userId);
  if (hasActive) {
    return { data: null, error: new Error('Cannot delete project with active stint. Please stop the stint first.') };
  }

  // Delete project (cascade deletes stints via FK constraint)
  const { error } = await client
    .from('projects')
    .delete()
    .eq('user_id', userId)
    .eq('id', projectId);

  if (error) return { data: null, error };
  return { data: null, error: null };
}

export async function updateProjectSortOrder(
  client: TypedSupabaseClient,
  updates: Array<{ id: string, sortOrder: number }>,
): Promise<Result<void>> {
  const userResult = await requireUserId(client, 'interact with projects');
  if (userResult.error || !userResult.data) {
    return { data: null, error: userResult.error || new Error('User ID unavailable') };
  }
  const userId = userResult.data;

  // Batch update using Promise.all
  const promises = updates.map(({ id, sortOrder }) =>
    client
      .from('projects')
      .update({ sort_order: sortOrder })
      .eq('id', id)
      .eq('user_id', userId)
      .select(),
  );

  const results = await Promise.all(promises);

  // Check for any errors
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    const errorDetails = errors.map(r => r.error?.message).filter(Boolean).join(', ');
    const errorMsg = errorDetails ? `Failed to update project order: ${errorDetails}` : 'Failed to update project order';
    return { data: null, error: new Error(errorMsg) };
  }

  // Check if all updates affected rows
  const noRowsUpdated = results.filter(r => !r.data || r.data.length === 0);
  if (noRowsUpdated.length > 0) {
    return {
      data: null,
      error: new Error('Some projects could not be updated. They may not exist or you may not have permission.'),
    };
  }

  return { data: null, error: null };
}

export async function hasActiveStint(
  client: TypedSupabaseClient,
  projectId: string,
): Promise<Result<boolean>> {
  const userResult = await requireUserId(client, 'interact with projects');
  if (userResult.error || !userResult.data) {
    return { data: null, error: userResult.error || new Error('User ID unavailable') };
  }
  const userId = userResult.data;

  const { data, error } = await client
    .from('stints')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .is('ended_at', null)
    .limit(1);

  if (error) return { data: null, error };
  return { data: Boolean(data && data.length > 0), error: null };
}

export async function archiveProject(
  client: TypedSupabaseClient,
  projectId: string,
): Promise<Result<ProjectRow>> {
  const userResult = await requireUserId(client, 'interact with projects');
  if (userResult.error || !userResult.data) {
    return { data: null, error: userResult.error || new Error('User ID unavailable') };
  }
  const userId = userResult.data;

  // Verify project exists and is owned by user
  const projectResult = await verifyProjectOwnership(client, projectId, 'archive');
  if (projectResult.error || !projectResult.data) return projectResult;

  // Check if already archived
  if (projectResult.data.archived_at) {
    return { data: null, error: new Error('Project is already archived') };
  }

  // Check for active stints
  const hasActive = await checkForActiveStints(client, projectId, userId);
  if (hasActive) {
    return { data: null, error: new Error('Cannot archive project with active stint. Please stop the stint first.') };
  }

  // Archive the project
  const { data, error } = await client
    .from('projects')
    .update({ archived_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', projectId)
    .select('*')
    .single<ProjectRow>();

  if (error) return { data: null, error };
  return { data, error: null };
}

export async function unarchiveProject(
  client: TypedSupabaseClient,
  projectId: string,
): Promise<Result<ProjectRow>> {
  const userResult = await requireUserId(client, 'interact with projects');
  if (userResult.error || !userResult.data) {
    return { data: null, error: userResult.error || new Error('User ID unavailable') };
  }
  const userId = userResult.data;

  // Verify project exists and is owned by user
  const projectResult = await verifyProjectOwnership(client, projectId, 'unarchive');
  if (projectResult.error || !projectResult.data) return projectResult;

  // Check if project is archived
  if (!projectResult.data.archived_at) {
    return { data: null, error: new Error('Project is not archived') };
  }

  // Unarchive the project by setting archived_at to NULL
  const { data, error } = await client
    .from('projects')
    .update({ archived_at: null })
    .eq('user_id', userId)
    .eq('id', projectId)
    .select('*')
    .single<ProjectRow>();

  if (error) return { data: null, error };
  return { data, error: null };
}

export async function permanentlyDeleteProject(
  client: TypedSupabaseClient,
  projectId: string,
): Promise<Result<void>> {
  const userResult = await requireUserId(client, 'interact with projects');
  if (userResult.error || !userResult.data) {
    return { data: null, error: userResult.error || new Error('User ID unavailable') };
  }
  const userId = userResult.data;

  // Verify project exists and is owned by user
  const projectResult = await verifyProjectOwnership(client, projectId, 'delete');
  if (projectResult.error || !projectResult.data) return { data: null, error: projectResult.error };

  // Ensure project is archived before allowing permanent deletion
  if (!projectResult.data.archived_at) {
    return {
      data: null,
      error: new Error('Only archived projects can be permanently deleted. Please archive the project first.'),
    };
  }

  // Delete project (cascade deletes stints via FK constraint)
  const { error } = await client
    .from('projects')
    .delete()
    .eq('user_id', userId)
    .eq('id', projectId);

  if (error) return { data: null, error };
  return { data: null, error: null };
}
