import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import type { UseQueryReturnType, UseMutationReturnType } from '@tanstack/vue-query';
import { useDebounceFn } from '@vueuse/core';
import type { TypedSupabaseClient } from '~/utils/supabase';
import {
  listProjects,
  getProject,
  createProject as createProjectDb,
  updateProject as updateProjectDb,
  deleteProject as deleteProjectDb,
  archiveProject as archiveProjectDb,
  unarchiveProject as unarchiveProjectDb,
  permanentlyDeleteProject as permanentlyDeleteProjectDb,
  updateProjectSortOrder as updateProjectSortOrderDb,
  type ProjectRow,
  type CreateProjectPayload as DbCreateProjectPayload,
  type UpdateProjectPayload as DbUpdateProjectPayload,
} from '~/lib/supabase/projects';
import {
  projectCreateSchema,
  projectUpdateSchema,
  type ProjectCreatePayload,
  type ProjectUpdatePayload,
} from '~/schemas/projects';

// ============================================================================
// Query Key Factory
// ============================================================================

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters?: ProjectListFilters) => [...projectKeys.lists(), filters] as const,
  archived: () => [...projectKeys.all, 'archived'] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

export interface ProjectListFilters {
  includeInactive?: boolean
}

// ============================================================================
// TypeScript Type Exports
// ============================================================================

export type ProjectsQueryResult = UseQueryReturnType<ProjectRow[], Error>;
export type ProjectQueryResult = UseQueryReturnType<ProjectRow | null, Error>;

export type CreateProjectMutation = UseMutationReturnType<
  ProjectRow,
  Error,
  ProjectCreatePayload,
  unknown
>;

export type UpdateProjectMutation = UseMutationReturnType<
  ProjectRow,
  Error,
  { id: string, data: ProjectUpdatePayload },
  unknown
>;

export type DeleteProjectMutation = UseMutationReturnType<
  void,
  Error,
  string,
  unknown
>;

export type ArchiveProjectMutation = UseMutationReturnType<
  ProjectRow,
  Error,
  string,
  unknown
>;

export type UnarchiveProjectMutation = UseMutationReturnType<
  ProjectRow,
  Error,
  string,
  unknown
>;

export type PermanentlyDeleteProjectMutation = UseMutationReturnType<
  void,
  Error,
  string,
  unknown
>;

export type ReorderProjectsMutation = UseMutationReturnType<
  void,
  Error,
  ProjectRow[],
  unknown
>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Transforms camelCase payload to snake_case for database operations
 */
function toDbPayload(payload: ProjectCreatePayload | ProjectUpdatePayload): DbCreateProjectPayload | DbUpdateProjectPayload {
  const result: Record<string, unknown> = {};

  if ('name' in payload && payload.name !== undefined) {
    result.name = payload.name;
  }
  if ('isActive' in payload && payload.isActive !== undefined) {
    result.is_active = payload.isActive;
  }
  if ('expectedDailyStints' in payload && payload.expectedDailyStints !== undefined) {
    result.expected_daily_stints = payload.expectedDailyStints;
  }
  if ('customStintDuration' in payload && payload.customStintDuration !== undefined) {
    result.custom_stint_duration = payload.customStintDuration;
  }
  if ('colorTag' in payload && payload.colorTag !== undefined) {
    result.color_tag = payload.colorTag;
  }

  return result as DbCreateProjectPayload | DbUpdateProjectPayload;
}

// ============================================================================
// Query Hooks
// ============================================================================

export function useProjectsQuery(filters?: MaybeRefOrGetter<ProjectListFilters | undefined>) {
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient;

  return useQuery({
    queryKey: computed(() => projectKeys.list(toValue(filters))),
    queryFn: async () => {
      const filterValue = toValue(filters);
      const { data, error } = await listProjects(client, { includeInactive: filterValue?.includeInactive });
      if (error) throw error;
      return data || [];
    },
  });
}

/**
 * Fetches a single project by ID with automatic caching.
 *
 * @example
 * ```ts
 * const { data: project, isLoading, error } = useProjectQuery(projectId)
 * ```
 */
export function useProjectQuery(id: MaybeRefOrGetter<string>) {
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient;
  const projectId = toValue(id);

  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: async () => {
      const { data, error } = await getProject(client, projectId);
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

/**
 * Fetches all archived projects with automatic caching.
 *
 * @example
 * ```ts
 * const { data: archivedProjects, isLoading, error } = useArchivedProjectsQuery()
 * ```
 */
export function useArchivedProjectsQuery() {
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient;

  return useQuery({
    queryKey: projectKeys.archived(),
    queryFn: async () => {
      const { data, error } = await listProjects(client, { archived: true });
      if (error) throw error;
      return data || [];
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Creates a new project with Zod validation and optimistic updates.
 * Auto-invalidates project queries on success.
 *
 * @example
 * ```ts
 * const { mutateAsync, isPending } = useCreateProject()
 * await mutateAsync({ name: 'New Project', expectedDailyStints: 3 })
 * ```
 */
export function useCreateProject() {
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ProjectCreatePayload) => {
      // Validate input
      const validation = projectCreateSchema.safeParse(payload);
      if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || 'Validation failed');
      }

      // Call database
      const dbPayload = toDbPayload(validation.data) as DbCreateProjectPayload;
      const { data, error } = await createProjectDb(client, dbPayload);

      if (error || !data) {
        throw error || new Error('Failed to create project');
      }

      return data;
    },
    onMutate: async (payload) => {
      // Cancel outgoing refetches for all list queries
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });

      // Snapshot previous value (use list with undefined filters to match default query)
      const previousProjects = queryClient.getQueryData<ProjectRow[]>(projectKeys.list(undefined));

      // Optimistically update to the new value
      if (previousProjects) {
        const optimisticProject: ProjectRow = {
          id: crypto.randomUUID(),
          name: payload.name,
          user_id: '',
          is_active: payload.isActive ?? true,
          expected_daily_stints: payload.expectedDailyStints ?? 2,
          custom_stint_duration: payload.customStintDuration ?? null,
          color_tag: payload.colorTag ?? null,
          archived_at: null,
          sort_order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        queryClient.setQueryData<ProjectRow[]>(
          projectKeys.list(undefined),
          [optimisticProject, ...previousProjects],
        );
      }

      return { previousProjects };
    },
    onError: (_err, _payload, context) => {
      // Rollback to previous value on error
      if (context?.previousProjects) {
        queryClient.setQueryData(projectKeys.list(undefined), context.previousProjects);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

/**
 * Updates an existing project with Zod validation and optimistic updates.
 * Auto-invalidates affected queries on success.
 *
 * @example
 * ```ts
 * const { mutateAsync } = useUpdateProject()
 * await mutateAsync({ id: projectId, data: { name: 'Updated Name' } })
 * ```
 */
export function useUpdateProject() {
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: ProjectUpdatePayload }) => {
      // Validate input
      const validation = projectUpdateSchema.safeParse(data);
      if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || 'Validation failed');
      }

      // Call database
      const dbPayload = toDbPayload(validation.data) as DbUpdateProjectPayload;
      const { data: result, error } = await updateProjectDb(client, id, dbPayload);

      if (error || !result) {
        throw error || new Error('Failed to update project');
      }

      return result;
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) });

      // Snapshot previous values
      const previousProjects = queryClient.getQueryData<ProjectRow[]>(projectKeys.list(undefined));
      const previousProject = queryClient.getQueryData<ProjectRow>(projectKeys.detail(id));

      // Optimistically update list
      if (previousProjects) {
        queryClient.setQueryData<ProjectRow[]>(
          projectKeys.list(undefined),
          previousProjects.map(p =>
            p.id === id
              ? {
                  ...p,
                  ...data,
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        );
      }

      // Optimistically update detail
      if (previousProject) {
        queryClient.setQueryData<ProjectRow>(projectKeys.detail(id), {
          ...previousProject,
          ...data,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousProjects, previousProject };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(projectKeys.list(undefined), context.previousProjects);
      }
      if (context?.previousProject) {
        queryClient.setQueryData(projectKeys.detail(id), context.previousProject);
      }
    },
    onSuccess: (_data, { id }) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
    },
  });
}

/**
 * Deletes a project with optimistic updates.
 * Auto-invalidates project queries on success.
 *
 * @example
 * ```ts
 * const { mutateAsync } = useDeleteProject()
 * await mutateAsync(projectId)
 * ```
 */
export function useDeleteProject() {
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteProjectDb(client, id);

      if (error) {
        throw error;
      }
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });

      // Snapshot previous value
      const previousProjects = queryClient.getQueryData<ProjectRow[]>(projectKeys.list(undefined));

      // Optimistically remove from list
      if (previousProjects) {
        queryClient.setQueryData<ProjectRow[]>(
          projectKeys.list(undefined),
          previousProjects.filter(p => p.id !== id),
        );
      }

      return { previousProjects };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(projectKeys.list(undefined), context.previousProjects);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

/**
 * Reorders projects with debounced updates and optimistic UI.
 * Uses 500ms debounce to batch rapid drag operations.
 *
 * @example
 * ```ts
 * const { mutate } = useReorderProjects()
 * mutate(reorderedProjects)
 * ```
 */
export function useReorderProjects() {
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newOrder: ProjectRow[]) => {
      // Map to database updates with new sort_order
      const updates = newOrder.map((project, index) => ({
        id: project.id,
        sortOrder: index,
      }));

      const { error } = await updateProjectSortOrderDb(client, updates);

      if (error) {
        throw error;
      }
    },
    onMutate: async (newOrder) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });

      // Snapshot previous value
      const previousProjects = queryClient.getQueryData<ProjectRow[]>(projectKeys.list(undefined));

      // Optimistically update order with correct sort_order values
      const updatedOrder = newOrder.map((project, index) => ({
        ...project,
        sort_order: index,
      }));
      queryClient.setQueryData<ProjectRow[]>(projectKeys.list(undefined), updatedOrder);

      return { previousProjects };
    },
    onError: (_err, _newOrder, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(projectKeys.list(undefined), context.previousProjects);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });

  // Create debounced version of mutate function
  const debouncedMutate = useDebounceFn((newOrder: ProjectRow[]) => {
    mutation.mutate(newOrder);
  }, 500);

  return {
    ...mutation,
    mutate: debouncedMutate,
    mutateImmediate: mutation.mutate, // Expose non-debounced version if needed
  };
}

/**
 * Convenience wrapper around useUpdateProject to toggle active status.
 *
 * @example
 * ```ts
 * const { mutateAsync } = useToggleProjectActive()
 * await mutateAsync(projectId)
 * ```
 */
export function useToggleProjectActive() {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateProject();

  return useMutation({
    mutationFn: async (id: string) => {
      // Search across all list queries to find the project
      const allListQueries = queryClient.getQueriesData<ProjectRow[]>({
        queryKey: projectKeys.lists(),
      });

      let project: ProjectRow | undefined;
      for (const [, projects] of allListQueries) {
        if (projects) {
          project = projects.find(p => p.id === id);
          if (project) break;
        }
      }

      if (!project) {
        throw new Error('Project not found');
      }

      // Toggle active status
      return updateMutation.mutateAsync({
        id,
        data: { isActive: !project.is_active },
      });
    },
  });
}

/**
 * Archives a project with validation and optimistic updates.
 * Auto-invalidates affected queries on success.
 *
 * @example
 * ```ts
 * const { mutateAsync } = useArchiveProject()
 * await mutateAsync(projectId)
 * ```
 */
export function useArchiveProject() {
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await archiveProjectDb(client, id);

      if (error || !data) {
        throw error || new Error('Failed to archive project');
      }

      return data;
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });
      await queryClient.cancelQueries({ queryKey: projectKeys.archived() });

      // Snapshot previous values
      const previousProjects = queryClient.getQueryData<ProjectRow[]>(projectKeys.list(undefined));
      const previousArchived = queryClient.getQueryData<ProjectRow[]>(projectKeys.archived());

      // Optimistically remove from active list
      if (previousProjects) {
        queryClient.setQueryData<ProjectRow[]>(
          projectKeys.list(undefined),
          previousProjects.filter(p => p.id !== id),
        );
      }

      return { previousProjects, previousArchived };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(projectKeys.list(undefined), context.previousProjects);
      }
      if (context?.previousArchived) {
        queryClient.setQueryData(projectKeys.archived(), context.previousArchived);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.archived() });
    },
  });
}

/**
 * Unarchives a project, restoring it to the main dashboard.
 * Sets archived_at to NULL.
 *
 * @example
 * ```ts
 * const { mutateAsync } = useUnarchiveProject()
 * await mutateAsync(projectId)
 * ```
 */
export function useUnarchiveProject() {
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await unarchiveProjectDb(client, id);

      if (error || !data) {
        throw error || new Error('Failed to unarchive project');
      }

      return data;
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.archived() });
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });

      // Snapshot previous values
      const previousArchived = queryClient.getQueryData<ProjectRow[]>(projectKeys.archived());
      const previousProjects = queryClient.getQueryData<ProjectRow[]>(projectKeys.list(undefined));

      // Optimistically remove from archived list
      if (previousArchived) {
        queryClient.setQueryData<ProjectRow[]>(
          projectKeys.archived(),
          previousArchived.filter(p => p.id !== id),
        );
      }

      return { previousArchived, previousProjects };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousArchived) {
        queryClient.setQueryData(projectKeys.archived(), context.previousArchived);
      }
      if (context?.previousProjects) {
        queryClient.setQueryData(projectKeys.list(undefined), context.previousProjects);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.archived() });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Permanently deletes an archived project.
 * Can only delete projects that are already archived.
 *
 * @example
 * ```ts
 * const { mutateAsync } = usePermanentlyDeleteProject()
 * await mutateAsync(projectId)
 * ```
 */
export function usePermanentlyDeleteProject() {
  const client = useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await permanentlyDeleteProjectDb(client, id);

      if (error) {
        throw error;
      }
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.archived() });

      // Snapshot previous value
      const previousArchived = queryClient.getQueryData<ProjectRow[]>(projectKeys.archived());

      // Optimistically remove from archived list
      if (previousArchived) {
        queryClient.setQueryData<ProjectRow[]>(
          projectKeys.archived(),
          previousArchived.filter(p => p.id !== id),
        );
      }

      return { previousArchived };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousArchived) {
        queryClient.setQueryData(projectKeys.archived(), context.previousArchived);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.archived() });
    },
  });
}
