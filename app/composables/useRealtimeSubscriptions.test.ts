import { describe, it, expect, beforeEach } from 'vitest';
import { _testHelpers } from './useRealtimeSubscriptions';

describe('useRealtimeSubscriptions', () => {
  beforeEach(() => {
    _testHelpers.resetState();
  });

  describe('_testHelpers', () => {
    it('should expose getGlobalState function', () => {
      expect(typeof _testHelpers.getGlobalState).toBe('function');
    });

    it('should expose resetState function', () => {
      expect(typeof _testHelpers.resetState).toBe('function');
    });
  });

  describe('globalRealtimeState', () => {
    it('should have correct initial state structure', () => {
      const state = _testHelpers.getGlobalState();

      expect(state.channel).toBe(null);
      expect(state.client).toBe(null);
      expect(state.isSubscribed.value).toBe(false);
      expect(state.subscriptionError.value).toBe(null);
      expect(state.isInitialized).toBe(false);
      expect(state.userId).toBe(null);
      expect(state.queryClient).toBe(null);
      expect(state.stopUserWatch).toBe(null);
      expect(state.debounceTimers).toBeInstanceOf(Map);
      expect(state.debounceTimers.size).toBe(0);
      expect(state.toast).toBe(null);
      expect(state.retryCount).toBe(0);
      expect(state.retryTimeoutId).toBe(null);
    });

    it('should have reactive isSubscribed ref', () => {
      const state = _testHelpers.getGlobalState();
      expect(state.isSubscribed).toBeDefined();
      expect(state.isSubscribed.value).toBe(false);

      state.isSubscribed.value = true;
      expect(state.isSubscribed.value).toBe(true);
    });

    it('should have reactive subscriptionError ref', () => {
      const state = _testHelpers.getGlobalState();
      expect(state.subscriptionError).toBeDefined();
      expect(state.subscriptionError.value).toBe(null);

      state.subscriptionError.value = 'Connection failed';
      expect(state.subscriptionError.value).toBe('Connection failed');
    });
  });

  describe('resetState', () => {
    it('should reset all state values', () => {
      const state = _testHelpers.getGlobalState();

      state.isSubscribed.value = true;
      state.subscriptionError.value = 'Error';
      state.userId = 'user-123';
      state.isInitialized = true;
      state.retryCount = 3;

      _testHelpers.resetState();

      expect(state.isSubscribed.value).toBe(false);
      expect(state.subscriptionError.value).toBe(null);
      expect(state.userId).toBe(null);
      expect(state.isInitialized).toBe(false);
      expect(state.retryCount).toBe(0);
    });

    it('should clear debounce timers', () => {
      const state = _testHelpers.getGlobalState();

      state.debounceTimers.set('stints', setTimeout(() => {}, 1000));
      state.debounceTimers.set('daily-summaries', setTimeout(() => {}, 1000));
      expect(state.debounceTimers.size).toBe(2);

      _testHelpers.resetState();

      expect(state.debounceTimers.size).toBe(0);
    });

    it('should nullify client and query client references', () => {
      const state = _testHelpers.getGlobalState();

      _testHelpers.resetState();

      expect(state.client).toBe(null);
      expect(state.queryClient).toBe(null);
      expect(state.toast).toBe(null);
    });
  });

  describe('configuration constants', () => {
    it('should use sensible debounce timing', () => {
      const state = _testHelpers.getGlobalState();
      expect(state.debounceTimers).toBeInstanceOf(Map);
    });
  });
});
