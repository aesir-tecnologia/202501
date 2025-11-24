/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import {
  useActiveStintQuery,
  useSyncStintCheck,
  stintKeys,
} from '~/composables/useStints';
import type { StintRow } from '~/lib/supabase/stints';
import type { SupabaseClient } from '@supabase/supabase-js';
import * as stintsDb from '~/lib/supabase/stints';

const mockClient = {} as unknown as SupabaseClient;

// Mock Nuxt composables
vi.mock('#app', () => ({
  useSupabaseClient: vi.fn(() => mockClient),
}));

// Mock stint database functions
vi.mock('~/lib/supabase/stints', async () => {
  const actual = await vi.importActual('~/lib/supabase/stints');
  return {
    ...actual,
    getActiveStint: vi.fn(),
    syncStintCheck: vi.fn(),
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
const mockActiveStint: StintRow = {
  id: 'stint-1',
  user_id: 'user-123',
  project_id: 'project-1',
  started_at: '2024-01-01T10:00:00.000Z',
  ended_at: null,
  duration_minutes: null,
  is_completed: false,
  notes: null,
  created_at: '2024-01-01T10:00:00.000Z',
  updated_at: null,
  status: 'active',
  paused_at: null,
  resumed_at: null,
  pause_duration_minutes: null,
  completed_at: null,
  completion_type: null,
};

describe('useStints Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Query Key Factory', () => {
    it('should generate correct query keys for active stint', () => {
      expect(stintKeys.all).toEqual(['stints']);
      expect(stintKeys.active()).toEqual(['stints', 'active']);
    });
  });

  describe('useActiveStintQuery', () => {
    it('should fetch active stint successfully', async () => {
      vi.mocked(stintsDb.getActiveStint).mockResolvedValue({
        data: mockActiveStint,
        error: null,
      });

      const { mount } = createTestWrapper();
      const wrapper = mount(() => useActiveStintQuery());

      await vi.waitFor(() => {
        expect(wrapper.vm.result.isLoading).toBe(false);
      });

      expect(wrapper.vm.result.data).toEqual(mockActiveStint);
      expect(wrapper.vm.result.error).toBeNull();
      expect(stintsDb.getActiveStint).toHaveBeenCalledWith(mockClient);
    });

    it('should return null when no active stint exists', async () => {
      vi.mocked(stintsDb.getActiveStint).mockResolvedValue({
        data: null,
        error: null,
      });

      const { mount } = createTestWrapper();
      const wrapper = mount(() => useActiveStintQuery());

      await vi.waitFor(() => {
        expect(wrapper.vm.result.isLoading).toBe(false);
      });

      expect(wrapper.vm.result.data).toBeNull();
      expect(wrapper.vm.result.error).toBeNull();
    });

    it('should handle errors when fetching active stint', async () => {
      const testError = new Error('Failed to fetch active stint');
      vi.mocked(stintsDb.getActiveStint).mockResolvedValue({
        data: null,
        error: testError,
      });

      const { mount } = createTestWrapper();
      const wrapper = mount(() => useActiveStintQuery());

      await vi.waitFor(() => {
        expect(wrapper.vm.result.isLoading).toBe(false);
      });

      expect(wrapper.vm.result.error).toBeTruthy();
      expect(wrapper.vm.result.data).toBeUndefined();
    });

    it('should show loading state initially', () => {
      vi.mocked(stintsDb.getActiveStint).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { mount } = createTestWrapper();
      const wrapper = mount(() => useActiveStintQuery());

      expect(wrapper.vm.result.isLoading).toBe(true);
      expect(wrapper.vm.result.data).toBeUndefined();
    });

    it('should use caching with staleTime and gcTime', async () => {
      vi.mocked(stintsDb.getActiveStint).mockResolvedValue({
        data: mockActiveStint,
        error: null,
      });

      const { mount, queryClient } = createTestWrapper();
      const wrapper = mount(() => useActiveStintQuery());

      await vi.waitFor(() => {
        expect(wrapper.vm.result.isLoading).toBe(false);
      });

      const queryState = queryClient.getQueryState(stintKeys.active());
      expect(queryState).toBeDefined();

      // First call should have been made
      expect(stintsDb.getActiveStint).toHaveBeenCalledTimes(1);

      // Create another component with the same query
      const wrapper2 = mount(() => useActiveStintQuery());

      await vi.waitFor(() => {
        expect(wrapper2.vm.result.isLoading).toBe(false);
      });

      // Should use cached data, not make another call
      expect(stintsDb.getActiveStint).toHaveBeenCalledTimes(1);
      expect(wrapper2.vm.result.data).toEqual(mockActiveStint);
    });
  });

  describe('useSyncStintCheck', () => {
    const stintId = 'stint-123';
    const mockSyncOutput = {
      stintId,
      status: 'active' as const,
      remainingSeconds: 3600,
      serverTimestamp: '2024-01-01T12:00:00.000Z',
    };

    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should sync stint successfully', async () => {
      vi.mocked(stintsDb.syncStintCheck).mockResolvedValue({
        data: mockSyncOutput,
        error: null,
      });

      const { mount } = createTestWrapper();
      const wrapper = mount(() => useSyncStintCheck());

      await wrapper.vm.result.mutateAsync(stintId);

      expect(stintsDb.syncStintCheck).toHaveBeenCalledWith(mockClient, stintId);
      expect(wrapper.vm.result.data).toEqual(mockSyncOutput);
    });

    it('should validate stint ID with Zod', async () => {
      const { mount } = createTestWrapper();
      const wrapper = mount(() => useSyncStintCheck());

      await expect(wrapper.vm.result.mutateAsync('invalid-id')).rejects.toThrow();
    });

    it('should handle sync errors', async () => {
      const errorMessage = 'Stint is completed and cannot be synced';
      vi.mocked(stintsDb.syncStintCheck).mockResolvedValue({
        data: null,
        error: new Error(errorMessage),
      });

      const { mount } = createTestWrapper();
      const wrapper = mount(() => useSyncStintCheck());

      await expect(wrapper.vm.result.mutateAsync(stintId)).rejects.toThrow(errorMessage);
    });

    it('should enforce debounce (1 call per minute)', async () => {
      vi.mocked(stintsDb.syncStintCheck).mockResolvedValue({
        data: mockSyncOutput,
        error: null,
      });

      const { mount } = createTestWrapper();
      const wrapper = mount(() => useSyncStintCheck());

      await wrapper.vm.result.mutateAsync(stintId);
      expect(stintsDb.syncStintCheck).toHaveBeenCalledTimes(1);

      await expect(wrapper.vm.result.mutateAsync(stintId)).rejects.toThrow(/wait.*seconds/i);

      expect(stintsDb.syncStintCheck).toHaveBeenCalledTimes(1);
    });

    it('should allow sync after debounce period', async () => {
      vi.mocked(stintsDb.syncStintCheck).mockResolvedValue({
        data: mockSyncOutput,
        error: null,
      });

      const { mount } = createTestWrapper();
      const wrapper = mount(() => useSyncStintCheck());

      await wrapper.vm.result.mutateAsync(stintId);
      expect(stintsDb.syncStintCheck).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(60000);

      await wrapper.vm.result.mutateAsync(stintId);
      expect(stintsDb.syncStintCheck).toHaveBeenCalledTimes(2);
    });
  });
});
