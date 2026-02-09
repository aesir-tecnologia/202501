import { describe, it, expect } from 'vitest';
import { accountDeletionKeys } from './useAccountDeletion';

describe('useAccountDeletion', () => {
  describe('accountDeletionKeys', () => {
    it('should have correct base key', () => {
      expect(accountDeletionKeys.all).toEqual(['account-deletion']);
    });

    it('should generate status key correctly', () => {
      expect(accountDeletionKeys.status()).toEqual(['account-deletion', 'status']);
    });

    it('should return consistent keys on multiple calls', () => {
      const status1 = accountDeletionKeys.status();
      const status2 = accountDeletionKeys.status();
      expect(status1).toEqual(status2);
    });

    it('should return readonly arrays (as const)', () => {
      expect(Array.isArray(accountDeletionKeys.all)).toBe(true);
      expect(Array.isArray(accountDeletionKeys.status())).toBe(true);
    });

    it('should maintain hierarchical key structure for cache invalidation', () => {
      const baseKey = accountDeletionKeys.all;
      const statusKey = accountDeletionKeys.status();

      expect(statusKey[0]).toBe(baseKey[0]);
    });
  });
});
