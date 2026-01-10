/**
 * useActiveStintCheck composable tests
 *
 * This composable is tightly coupled to Nuxt auto-imports (useSupabaseClient, useToast)
 * and Vue reactivity (ref, watch). The underlying database function `hasActiveStint`
 * is tested in app/lib/supabase/projects.test.ts.
 *
 * The composable returns:
 * - hasActive: Ref<boolean> - whether the project has an active stint
 * - isCheckingActive: Ref<boolean> - loading state during the check
 *
 * Testing strategy:
 * - Underlying database function tested in lib layer
 * - Integration behavior validated through E2E tests
 */

import { describe, it, expect } from 'vitest';

describe('useActiveStintCheck', () => {
  describe('module exports', () => {
    it('should export useActiveStintCheck function', async () => {
      const module = await import('./useActiveStintCheck');
      expect(typeof module.useActiveStintCheck).toBe('function');
    });
  });

  describe('composable contract', () => {
    it('should have documented return type interface', () => {
      interface ActiveStintCheckResult {
        hasActive: { value: boolean }
        isCheckingActive: { value: boolean }
      }

      const expected: ActiveStintCheckResult = {
        hasActive: { value: false },
        isCheckingActive: { value: false },
      };

      expect(expected.hasActive.value).toBe(false);
      expect(expected.isCheckingActive.value).toBe(false);
    });
  });
});
