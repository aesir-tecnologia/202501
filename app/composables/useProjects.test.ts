import { describe, it, expect } from 'vitest';
import { projectKeys, type ProjectListFilters } from './useProjects';

describe('useProjects', () => {
  describe('projectKeys', () => {
    it('should have correct base key', () => {
      expect(projectKeys.all).toEqual(['projects']);
    });

    it('should generate lists key correctly', () => {
      expect(projectKeys.lists()).toEqual(['projects', 'list']);
    });

    it('should generate list key without filters', () => {
      expect(projectKeys.list()).toEqual(['projects', 'list', undefined]);
    });

    it('should generate list key with includeInactive filter', () => {
      const filters: ProjectListFilters = { includeInactive: true };
      expect(projectKeys.list(filters)).toEqual(['projects', 'list', filters]);
    });

    it('should generate archived key correctly', () => {
      expect(projectKeys.archived()).toEqual(['projects', 'archived']);
    });

    it('should generate details key correctly', () => {
      expect(projectKeys.details()).toEqual(['projects', 'detail']);
    });

    it('should generate detail key with id', () => {
      const id = 'project-uuid-123';
      expect(projectKeys.detail(id)).toEqual(['projects', 'detail', id]);
    });

    it('should return consistent keys on multiple calls', () => {
      const lists1 = projectKeys.lists();
      const lists2 = projectKeys.lists();
      expect(lists1).toEqual(lists2);

      const archived1 = projectKeys.archived();
      const archived2 = projectKeys.archived();
      expect(archived1).toEqual(archived2);
    });

    it('should return readonly arrays (as const)', () => {
      expect(Array.isArray(projectKeys.all)).toBe(true);
      expect(Array.isArray(projectKeys.lists())).toBe(true);
      expect(Array.isArray(projectKeys.archived())).toBe(true);
      expect(Array.isArray(projectKeys.details())).toBe(true);
    });

    it('should have distinct keys for list and archived queries', () => {
      const listKey = projectKeys.lists();
      const archivedKey = projectKeys.archived();

      expect(listKey).not.toEqual(archivedKey);
      expect(listKey[1]).toBe('list');
      expect(archivedKey[1]).toBe('archived');
    });

    it('should maintain hierarchical key structure for cache invalidation', () => {
      const baseKey = projectKeys.all;
      const listsKey = projectKeys.lists();
      const archivedKey = projectKeys.archived();
      const detailsKey = projectKeys.details();
      const detailKey = projectKeys.detail('test-id');

      expect(listsKey[0]).toBe(baseKey[0]);
      expect(archivedKey[0]).toBe(baseKey[0]);
      expect(detailsKey[0]).toBe(baseKey[0]);
      expect(detailKey[0]).toBe(baseKey[0]);
    });

    it('should preserve filter reference in list key', () => {
      const filters: ProjectListFilters = { includeInactive: true };
      const key = projectKeys.list(filters);

      expect(key[2]).toBe(filters);
    });

    it('should differentiate between list keys with different filters', () => {
      const noFilters = projectKeys.list();
      const withInactive = projectKeys.list({ includeInactive: true });
      const withActive = projectKeys.list({ includeInactive: false });

      expect(noFilters).not.toEqual(withInactive);
      expect(withInactive).not.toEqual(withActive);
    });
  });
});
