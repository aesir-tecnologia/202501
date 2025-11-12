/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import {
  useProjectsQuery,
  useProjectQuery,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useReorderProjects,
  useToggleProjectActive,
  projectKeys,
} from '~/composables/useProjects';
import type { ProjectRow } from '~/lib/supabase/projects';
import type { SupabaseClient } from '@supabase/supabase-js';
import * as projectsDb from '~/lib/supabase/projects';

// Mock Nuxt composables
vi.mock('#app', () => ({
  useSupabaseClient: vi.fn(() => mockClient),
}));

const mockClient = {} as unknown as SupabaseClient;

// Mock project database functions
vi.mock('~/lib/supabase/projects', async () => {
  const actual = await vi.importActual('~/lib/supabase/projects');
  return {
    ...actual,
    listProjects: vi.fn(),
    getProject: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    updateProjectSortOrder: vi.fn(),
  };
});

// Helper to create a test wrapper component
function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return {
    queryClient,
    mount: <T>(composable: () => T) => {
      return mount(
        defineComponent({
          setup() {
            const result = composable();
            return { result };
          },
          render: () => h('div'),
        }),
        {
          global: {
            plugins: [[VueQueryPlugin, { queryClient }]],
          },
        },
      );
    },
  };
}

// Sample test data
const mockProjects: ProjectRow[] = [
  {
    id: '1',
    user_id: 'user-123',
    name: 'Project 1',
    is_active: true,
    expected_daily_stints: 2,
    custom_stint_duration: null,
    sort_order: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    user_id: 'user-123',
    name: 'Project 2',
    is_active: true,
    expected_daily_stints: 3,
    custom_stint_duration: 45,
    sort_order: 1,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

describe('useProjects Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Query Key Factory', () => {
    it('should generate correct query keys', () => {
      expect(projectKeys.all).toEqual(['projects']);
      expect(projectKeys.lists()).toEqual(['projects', 'list']);
      expect(projectKeys.list()).toEqual(['projects', 'list', undefined]);
      expect(projectKeys.list({ includeInactive: true })).toEqual(['projects', 'list', { includeInactive: true }]);
      expect(projectKeys.details()).toEqual(['projects', 'detail']);
      expect(projectKeys.detail('123')).toEqual(['projects', 'detail', '123']);
    });
  });

  describe('useProjectsQuery', () => {
    it('should fetch projects list successfully', async () => {
      vi.mocked(projectsDb.listProjects).mockResolvedValue({
        data: mockProjects,
        error: null,
      });

      const { mount } = createTestWrapper();
      const wrapper = mount(() => useProjectsQuery());

      await vi.waitFor(() => {
        expect(wrapper.vm.result.isLoading).toBe(false);
      });

      expect(wrapper.vm.result.data).toEqual(mockProjects);
      expect(wrapper.vm.result.error).toBeNull();
      expect(projectsDb.listProjects).toHaveBeenCalledWith(mockClient);
    });

    it('should handle errors when fetching projects', async () => {
      const testError = new Error('Failed to fetch projects');
      vi.mocked(projectsDb.listProjects).mockResolvedValue({
        data: null,
        error: testError,
      });

      const { mount } = createTestWrapper();
      const wrapper = mount(() => useProjectsQuery());

      await vi.waitFor(() => {
        expect(wrapper.vm.result.isLoading).toBe(false);
      });

      expect(wrapper.vm.result.error).toBeTruthy();
      expect(wrapper.vm.result.data).toBeUndefined();
    });

    it('should show loading state initially', () => {
      vi.mocked(projectsDb.listProjects).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { mount } = createTestWrapper();
      const wrapper = mount(() => useProjectsQuery());

      expect(wrapper.vm.result.isLoading).toBe(true);
      expect(wrapper.vm.result.data).toBeUndefined();
    });
  });

  describe('useProjectQuery', () => {
    it('should fetch single project successfully', async () => {
      const mockProject = mockProjects[0];
      vi.mocked(projectsDb.getProject).mockResolvedValue({
        data: mockProject,
        error: null,
      });

      const { mount } = createTestWrapper();
      const wrapper = mount(() => useProjectQuery('1'));

      await vi.waitFor(() => {
        expect(wrapper.vm.result.isLoading).toBe(false);
      });

      expect(wrapper.vm.result.data).toEqual(mockProject);
      expect(wrapper.vm.result.error).toBeNull();
      expect(projectsDb.getProject).toHaveBeenCalledWith(mockClient, '1');
    });

    it('should not fetch when id is empty', () => {
      const { mount } = createTestWrapper();
      const wrapper = mount(() => useProjectQuery(''));

      expect(wrapper.vm.result.isPending).toBe(true);
      expect(wrapper.vm.result.fetchStatus).toBe('idle');
      expect(projectsDb.getProject).not.toHaveBeenCalled();
    });
  });

  describe('useCreateProject', () => {
    it('should create project successfully', async () => {
      const newProject: ProjectRow = {
        ...mockProjects[0],
        id: '3',
        name: 'New Project',
      };

      vi.mocked(projectsDb.createProject).mockResolvedValue({
        data: newProject,
        error: null,
      });

      const { mount, queryClient } = createTestWrapper();
      const wrapper = mount(() => useCreateProject());

      await wrapper.vm.result.mutateAsync({
        name: 'New Project',
        expectedDailyStints: 2,
      });

      expect(projectsDb.createProject).toHaveBeenCalledWith(
        mockClient,
        expect.objectContaining({
          name: 'New Project',
          expected_daily_stints: 2,
        }),
      );

      // Verify query invalidation
      expect(queryClient.getQueryState(projectKeys.all)?.isInvalidated).toBe(true);
    });

    it('should handle validation errors', async () => {
      const { mount } = createTestWrapper();
      const wrapper = mount(() => useCreateProject());

      await expect(
        wrapper.vm.result.mutateAsync({
          name: 'A', // Too short (min 2 characters)
        }),
      ).rejects.toThrow();
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database error');
      vi.mocked(projectsDb.createProject).mockResolvedValue({
        data: null,
        error: dbError,
      });

      const { mount } = createTestWrapper();
      const wrapper = mount(() => useCreateProject());

      await expect(
        wrapper.vm.result.mutateAsync({
          name: 'New Project',
        }),
      ).rejects.toThrow('Database error');
    });

    it('should perform optimistic updates', async () => {
      const newProject: ProjectRow = mockProjects[0];
      vi.mocked(projectsDb.createProject).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: newProject, error: null }), 100)),
      );

      const { mount, queryClient } = createTestWrapper();

      // Seed initial data
      queryClient.setQueryData(projectKeys.lists(), mockProjects);

      const wrapper = mount(() => useCreateProject());

      const mutationPromise = wrapper.vm.result.mutateAsync({
        name: 'New Project',
      });

      // Check optimistic update (immediately after mutation starts)
      await vi.waitFor(() => {
        const cachedData = queryClient.getQueryData<ProjectRow[]>(projectKeys.lists());
        expect(cachedData?.length).toBeGreaterThan(mockProjects.length);
      });

      await mutationPromise;
    });
  });

  describe('useUpdateProject', () => {
    it('should update project successfully', async () => {
      const updatedProject: ProjectRow = {
        ...mockProjects[0],
        name: 'Updated Name',
      };

      vi.mocked(projectsDb.updateProject).mockResolvedValue({
        data: updatedProject,
        error: null,
      });

      const { mount, queryClient } = createTestWrapper();
      queryClient.setQueryData(projectKeys.lists(), mockProjects);

      const wrapper = mount(() => useUpdateProject());

      await wrapper.vm.result.mutateAsync({
        id: '1',
        data: { name: 'Updated Name' },
      });

      expect(projectsDb.updateProject).toHaveBeenCalledWith(
        mockClient,
        '1',
        expect.objectContaining({
          name: 'Updated Name',
        }),
      );

      // Verify query invalidation
      expect(queryClient.getQueryState(projectKeys.lists())?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(projectKeys.detail('1'))?.isInvalidated).toBe(true);
    });

    it('should perform optimistic updates', async () => {
      const updatedProject: ProjectRow = {
        ...mockProjects[0],
        name: 'Updated Name',
      };

      vi.mocked(projectsDb.updateProject).mockResolvedValue({
        data: updatedProject,
        error: null,
      });

      const { mount, queryClient } = createTestWrapper();
      queryClient.setQueryData(projectKeys.lists(), mockProjects);

      const wrapper = mount(() => useUpdateProject());

      wrapper.vm.result.mutate({
        id: '1',
        data: { name: 'Updated Name' },
      });

      // Check optimistic update
      await vi.waitFor(() => {
        const cachedData = queryClient.getQueryData<ProjectRow[]>(projectKeys.lists());
        const project = cachedData?.find(p => p.id === '1');
        expect(project?.name).toBe('Updated Name');
      });
    });

    it('should rollback on error', async () => {
      const dbError = new Error('Update failed');
      vi.mocked(projectsDb.updateProject).mockResolvedValue({
        data: null,
        error: dbError,
      });

      const { mount, queryClient } = createTestWrapper();
      queryClient.setQueryData(projectKeys.lists(), mockProjects);

      const wrapper = mount(() => useUpdateProject());

      await expect(
        wrapper.vm.result.mutateAsync({
          id: '1',
          data: { name: 'Updated Name' },
        }),
      ).rejects.toThrow('Update failed');

      // Verify rollback
      const cachedData = queryClient.getQueryData<ProjectRow[]>(projectKeys.lists());
      const project = cachedData?.find(p => p.id === '1');
      expect(project?.name).toBe('Project 1'); // Original name
    });
  });

  describe('useDeleteProject', () => {
    it('should delete project successfully', async () => {
      vi.mocked(projectsDb.deleteProject).mockResolvedValue({
        data: null,
        error: null,
      });

      const { mount, queryClient } = createTestWrapper();
      queryClient.setQueryData(projectKeys.lists(), mockProjects);

      const wrapper = mount(() => useDeleteProject());

      await wrapper.vm.result.mutateAsync('1');

      expect(projectsDb.deleteProject).toHaveBeenCalledWith(mockClient, '1');

      // Verify query invalidation
      expect(queryClient.getQueryState(projectKeys.all)?.isInvalidated).toBe(true);
    });

    it('should perform optimistic removal', async () => {
      vi.mocked(projectsDb.deleteProject).mockResolvedValue({
        data: null,
        error: null,
      });

      const { mount, queryClient } = createTestWrapper();
      queryClient.setQueryData(projectKeys.lists(), mockProjects);

      const wrapper = mount(() => useDeleteProject());

      wrapper.vm.result.mutate('1');

      // Check optimistic removal
      await vi.waitFor(() => {
        const cachedData = queryClient.getQueryData<ProjectRow[]>(projectKeys.lists());
        expect(cachedData?.find(p => p.id === '1')).toBeUndefined();
      });
    });

    it('should rollback on error', async () => {
      const dbError = new Error('Cannot delete project with active stint');
      vi.mocked(projectsDb.deleteProject).mockResolvedValue({
        data: null,
        error: dbError,
      });

      const { mount, queryClient } = createTestWrapper();
      queryClient.setQueryData(projectKeys.lists(), mockProjects);

      const wrapper = mount(() => useDeleteProject());

      await expect(wrapper.vm.result.mutateAsync('1')).rejects.toThrow();

      // Verify rollback
      const cachedData = queryClient.getQueryData<ProjectRow[]>(projectKeys.lists());
      expect(cachedData?.find(p => p.id === '1')).toBeDefined();
    });
  });

  describe('useReorderProjects', () => {
    it('should reorder projects successfully', async () => {
      vi.mocked(projectsDb.updateProjectSortOrder).mockResolvedValue({
        data: null,
        error: null,
      });

      const { mount, queryClient } = createTestWrapper();
      queryClient.setQueryData(projectKeys.lists(), mockProjects);

      const wrapper = mount(() => useReorderProjects());

      const reorderedProjects = [mockProjects[1], mockProjects[0]];
      await wrapper.vm.result.mutateImmediate(reorderedProjects);

      expect(projectsDb.updateProjectSortOrder).toHaveBeenCalledWith(
        mockClient,
        [
          { id: '2', sortOrder: 0 },
          { id: '1', sortOrder: 1 },
        ],
      );
    });

    it('should use debounced mutation by default', async () => {
      vi.useFakeTimers();

      vi.mocked(projectsDb.updateProjectSortOrder).mockResolvedValue({
        data: null,
        error: null,
      });

      const { mount, queryClient } = createTestWrapper();
      queryClient.setQueryData(projectKeys.lists(), mockProjects);

      const wrapper = mount(() => useReorderProjects());

      const reorderedProjects = [mockProjects[1], mockProjects[0]];

      // Call debounced mutation multiple times
      wrapper.vm.result.mutate(reorderedProjects);
      wrapper.vm.result.mutate(reorderedProjects);
      wrapper.vm.result.mutate(reorderedProjects);

      // Should not call immediately
      expect(projectsDb.updateProjectSortOrder).not.toHaveBeenCalled();

      // Fast-forward time
      vi.advanceTimersByTime(500);
      await vi.waitFor(() => {
        // Should be called only once after debounce
        expect(projectsDb.updateProjectSortOrder).toHaveBeenCalledTimes(1);
      });

      vi.useRealTimers();
    });
  });

  describe('useToggleProjectActive', () => {
    it('should toggle project active status', async () => {
      const updatedProject: ProjectRow = {
        ...mockProjects[0],
        is_active: false,
      };

      vi.mocked(projectsDb.updateProject).mockResolvedValue({
        data: updatedProject,
        error: null,
      });

      const { mount, queryClient } = createTestWrapper();
      queryClient.setQueryData(projectKeys.lists(), mockProjects);

      const wrapper = mount(() => useToggleProjectActive());

      await wrapper.vm.result.mutateAsync('1');

      expect(projectsDb.updateProject).toHaveBeenCalledWith(
        mockClient,
        '1',
        expect.objectContaining({
          is_active: false,
        }),
      );
    });

    it('should throw error if project not found', async () => {
      const { mount, queryClient } = createTestWrapper();
      queryClient.setQueryData(projectKeys.lists(), mockProjects);

      const wrapper = mount(() => useToggleProjectActive());

      await expect(wrapper.vm.result.mutateAsync('999')).rejects.toThrow('Project not found');
    });
  });

  describe('Integration: Mutation to Query Flow', () => {
    it('should update queries after successful mutation', async () => {
      const newProject: ProjectRow = {
        ...mockProjects[0],
        id: '3',
        name: 'Integration Test Project',
      };

      vi.mocked(projectsDb.listProjects).mockResolvedValue({
        data: [...mockProjects, newProject],
        error: null,
      });

      vi.mocked(projectsDb.createProject).mockResolvedValue({
        data: newProject,
        error: null,
      });

      const { mount, queryClient } = createTestWrapper();

      // First, fetch initial projects
      const queryWrapper = mount(() => useProjectsQuery());
      await vi.waitFor(() => {
        expect(queryWrapper.vm.result.isLoading).toBe(false);
      });

      expect(queryWrapper.vm.result.data?.length).toBe(2);

      // Then, create a new project
      const mutationWrapper = mount(() => useCreateProject());
      await mutationWrapper.vm.result.mutateAsync({
        name: 'Integration Test Project',
      });

      // Query should be invalidated and refetch
      await vi.waitFor(() => {
        expect(queryClient.getQueryState(projectKeys.all)?.isInvalidated).toBe(true);
      });
    });
  });
});
