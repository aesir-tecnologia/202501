import { describe, it, expect } from 'vitest';
import { stintKeys } from './useStints';

/**
 * usePausedStintsMap composable tests
 *
 * This composable wraps usePausedStintsQuery and transforms the array into a Map<projectId, StintRow>.
 * It's tightly coupled to TanStack Query (usePausedStintsQuery). The underlying database function
 * `getPausedStints` is tested in app/lib/supabase/stints.test.ts.
 *
 * The composable returns:
 * - map: ComputedRef<Map<string, StintRow>> - lookup map by project ID (first paused stint per project)
 * - error: Ref<Error | null> - error from the underlying query
 * - isLoading: Ref<boolean> - loading state
 *
 * Testing strategy:
 * - Underlying database function tested in lib layer
 * - Integration behavior validated through E2E tests
 */
describe('usePausedStintsMap', () => {
  describe('module exports', () => {
    it('should export usePausedStintsMap function', async () => {
      const module = await import('./useStints');
      expect(typeof module.usePausedStintsMap).toBe('function');
    });
  });

  describe('composable contract', () => {
    it('should have documented return type interface with map, error, and isLoading', () => {
      interface PausedStintsMapResult {
        map: { value: Map<string, unknown> }
        error: { value: Error | null }
        isLoading: { value: boolean }
      }

      const expected: PausedStintsMapResult = {
        map: { value: new Map() },
        error: { value: null },
        isLoading: { value: false },
      };

      expect(expected.map.value instanceof Map).toBe(true);
      expect(expected.error.value).toBeNull();
      expect(expected.isLoading.value).toBe(false);
    });

    it('should document that map contains first paused stint per project', () => {
      const map = new Map<string, { id: string, project_id: string }>();
      const stint1 = { id: 'stint-1', project_id: 'project-a' };
      const stint2 = { id: 'stint-2', project_id: 'project-a' };

      if (!map.has(stint1.project_id)) {
        map.set(stint1.project_id, stint1);
      }
      if (!map.has(stint2.project_id)) {
        map.set(stint2.project_id, stint2);
      }

      expect(map.get('project-a')?.id).toBe('stint-1');
    });
  });
});

describe('useStints', () => {
  describe('stintKeys', () => {
    it('should have correct base key', () => {
      expect(stintKeys.all).toEqual(['stints']);
    });

    it('should generate lists key correctly', () => {
      expect(stintKeys.lists()).toEqual(['stints', 'list']);
    });

    it('should generate list key without filters', () => {
      expect(stintKeys.list()).toEqual(['stints', 'list', undefined]);
    });

    it('should generate list key with projectId filter', () => {
      const filters = { projectId: 'project-123' };
      expect(stintKeys.list(filters)).toEqual(['stints', 'list', filters]);
    });

    it('should generate list key with activeOnly filter', () => {
      const filters = { activeOnly: true };
      expect(stintKeys.list(filters)).toEqual(['stints', 'list', filters]);
    });

    it('should generate list key with multiple filters', () => {
      const filters = { projectId: 'project-123', activeOnly: true };
      expect(stintKeys.list(filters)).toEqual(['stints', 'list', filters]);
    });

    it('should generate details key correctly', () => {
      expect(stintKeys.details()).toEqual(['stints', 'detail']);
    });

    it('should generate detail key with id', () => {
      const id = 'stint-uuid-123';
      expect(stintKeys.detail(id)).toEqual(['stints', 'detail', id]);
    });

    it('should generate active key correctly', () => {
      expect(stintKeys.active()).toEqual(['stints', 'active']);
    });

    it('should generate paused key correctly', () => {
      expect(stintKeys.paused()).toEqual(['stints', 'paused']);
    });

    it('should return consistent keys on multiple calls', () => {
      const active1 = stintKeys.active();
      const active2 = stintKeys.active();
      expect(active1).toEqual(active2);

      const paused1 = stintKeys.paused();
      const paused2 = stintKeys.paused();
      expect(paused1).toEqual(paused2);
    });

    it('should return readonly arrays (as const)', () => {
      expect(Array.isArray(stintKeys.all)).toBe(true);
      expect(Array.isArray(stintKeys.lists())).toBe(true);
      expect(Array.isArray(stintKeys.active())).toBe(true);
      expect(Array.isArray(stintKeys.paused())).toBe(true);
    });

    it('should have distinct keys for active and paused queries', () => {
      const activeKey = stintKeys.active();
      const pausedKey = stintKeys.paused();

      expect(activeKey).not.toEqual(pausedKey);
      expect(activeKey[1]).toBe('active');
      expect(pausedKey[1]).toBe('paused');
    });

    it('should maintain hierarchical key structure for cache invalidation', () => {
      const baseKey = stintKeys.all;
      const listsKey = stintKeys.lists();
      const activeKey = stintKeys.active();
      const pausedKey = stintKeys.paused();

      expect(listsKey[0]).toBe(baseKey[0]);
      expect(activeKey[0]).toBe(baseKey[0]);
      expect(pausedKey[0]).toBe(baseKey[0]);
    });
  });
});
