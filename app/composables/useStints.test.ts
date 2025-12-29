import { describe, it, expect } from 'vitest';
import { stintKeys } from './useStints';

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
