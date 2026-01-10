import { describe, it, expect } from 'vitest';
import { preferencesKeys } from './usePreferences';

describe('usePreferences', () => {
  describe('preferencesKeys', () => {
    it('should have correct base key', () => {
      expect(preferencesKeys.all).toEqual(['preferences']);
    });

    it('should generate current key correctly', () => {
      expect(preferencesKeys.current()).toEqual(['preferences', 'current']);
    });

    it('should return consistent keys on multiple calls', () => {
      const current1 = preferencesKeys.current();
      const current2 = preferencesKeys.current();
      expect(current1).toEqual(current2);
    });

    it('should return readonly arrays (as const)', () => {
      expect(Array.isArray(preferencesKeys.all)).toBe(true);
      expect(Array.isArray(preferencesKeys.current())).toBe(true);
    });

    it('should maintain hierarchical key structure for cache invalidation', () => {
      const baseKey = preferencesKeys.all;
      const currentKey = preferencesKeys.current();

      expect(currentKey[0]).toBe(baseKey[0]);
    });

    it('should have current key extend from base key', () => {
      const baseKey = preferencesKeys.all;
      const currentKey = preferencesKeys.current();

      expect(currentKey.length).toBe(baseKey.length + 1);
      expect(currentKey.slice(0, baseKey.length)).toEqual([...baseKey]);
    });
  });
});
