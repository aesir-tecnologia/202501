import { describe, expect, it, vi } from 'vitest';
import {
  attemptAuthRecovery,
  isAuthError,
  refreshSession,
  withAuthRetry,
} from './auth-recovery';
import type { TypedSupabaseClient } from '~/utils/supabase';

function createMockClient(overrides: {
  getSession?: () => Promise<{ data: { session: { expires_at?: number } | null }, error: null }>
  refreshSession?: () => Promise<{ data: { session: unknown }, error: Error | null }>
  getUser?: () => Promise<{ data: { user: { id: string } | null }, error: Error | null }>
} = {}): TypedSupabaseClient {
  return {
    auth: {
      getSession: overrides.getSession ?? (async () => ({
        data: { session: { expires_at: Math.floor(Date.now() / 1000) + 3600 } },
        error: null,
      })),
      refreshSession: overrides.refreshSession ?? (async () => ({
        data: { session: {} },
        error: null,
      })),
      getUser: overrides.getUser ?? (async () => ({
        data: { user: { id: 'test-user' } },
        error: null,
      })),
    },
  } as unknown as TypedSupabaseClient;
}

describe('isAuthError', () => {
  it('should return true for "must be authenticated" errors', () => {
    expect(isAuthError(new Error('User must be authenticated'))).toBe(true);
  });

  it('should return true for "session has expired" errors', () => {
    expect(isAuthError(new Error('Your session has expired'))).toBe(true);
  });

  it('should return true for "jwt expired" errors', () => {
    expect(isAuthError(new Error('jwt expired'))).toBe(true);
  });

  it('should return true for "invalid token" errors', () => {
    expect(isAuthError(new Error('invalid token provided'))).toBe(true);
  });

  it('should return false for non-auth errors', () => {
    expect(isAuthError(new Error('Network error'))).toBe(false);
    expect(isAuthError(new Error('Database connection failed'))).toBe(false);
  });

  it('should return false for null/undefined', () => {
    expect(isAuthError(null)).toBe(false);
    expect(isAuthError(undefined)).toBe(false);
  });

  it('should handle string errors', () => {
    expect(isAuthError('must be authenticated')).toBe(true);
    expect(isAuthError('random error')).toBe(false);
  });

  it('should be case insensitive', () => {
    expect(isAuthError(new Error('USER MUST BE AUTHENTICATED'))).toBe(true);
    expect(isAuthError(new Error('JWT EXPIRED'))).toBe(true);
  });
});

describe('refreshSession', () => {
  it('should return true when refresh succeeds', async () => {
    const client = createMockClient({
      refreshSession: async () => ({ data: { session: {} }, error: null }),
    });

    const result = await refreshSession(client);
    expect(result).toBe(true);
  });

  it('should return false when refresh fails', async () => {
    const client = createMockClient({
      refreshSession: async () => ({ data: { session: null }, error: new Error('Refresh failed') }),
    });

    const result = await refreshSession(client);
    expect(result).toBe(false);
  });

  it('should return false when refresh throws', async () => {
    const client = createMockClient({
      refreshSession: async () => { throw new Error('Network error'); },
    });

    const result = await refreshSession(client);
    expect(result).toBe(false);
  });
});

describe('withAuthRetry', () => {
  it('should return successful result without retry', async () => {
    const client = createMockClient();
    const operation = vi.fn().mockResolvedValue({ data: 'success', error: null });

    const result = await withAuthRetry(client, operation);

    expect(result).toEqual({ data: 'success', error: null });
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry once on auth error after successful refresh', async () => {
    const client = createMockClient({
      refreshSession: async () => ({ data: { session: {} }, error: null }),
    });

    const operation = vi.fn()
      .mockResolvedValueOnce({ data: null, error: new Error('User must be authenticated') })
      .mockResolvedValueOnce({ data: 'success after retry', error: null });

    const result = await withAuthRetry(client, operation);

    expect(result).toEqual({ data: 'success after retry', error: null });
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should not retry on non-auth errors', async () => {
    const client = createMockClient();
    const operation = vi.fn().mockResolvedValue({
      data: null,
      error: new Error('Database connection failed'),
    });

    const result = await withAuthRetry(client, operation);

    expect(result.error?.message).toBe('Database connection failed');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should return auth error if refresh fails', async () => {
    const client = createMockClient({
      refreshSession: async () => ({ data: { session: null }, error: new Error('Refresh failed') }),
    });

    const authError = new Error('User must be authenticated');
    const operation = vi.fn().mockResolvedValue({ data: null, error: authError });

    const result = await withAuthRetry(client, operation);

    expect(result.error).toBe(authError);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should return second error if retry also fails', async () => {
    const client = createMockClient({
      refreshSession: async () => ({ data: { session: {} }, error: null }),
    });

    const firstError = new Error('User must be authenticated');
    const secondError = new Error('Still not authenticated');

    const operation = vi.fn()
      .mockResolvedValueOnce({ data: null, error: firstError })
      .mockResolvedValueOnce({ data: null, error: secondError });

    const result = await withAuthRetry(client, operation);

    expect(result.error).toBe(secondError);
    expect(operation).toHaveBeenCalledTimes(2);
  });
});

describe('attemptAuthRecovery', () => {
  it('should return recovered:true when session is valid', async () => {
    const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
    const client = createMockClient({
      getSession: async () => ({
        data: { session: { expires_at: futureExpiry } },
        error: null,
      }),
    });

    const result = await attemptAuthRecovery(client);
    expect(result).toEqual({ recovered: true });
  });

  it('should attempt refresh when session is expired and succeed', async () => {
    const pastExpiry = Math.floor(Date.now() / 1000) - 3600;
    const client = createMockClient({
      getSession: async () => ({
        data: { session: { expires_at: pastExpiry } },
        error: null,
      }),
      refreshSession: async () => ({ data: { session: {} }, error: null }),
    });

    const result = await attemptAuthRecovery(client);
    expect(result).toEqual({ recovered: true });
  });

  it('should return shouldRedirect:true when refresh fails', async () => {
    const pastExpiry = Math.floor(Date.now() / 1000) - 3600;
    const client = createMockClient({
      getSession: async () => ({
        data: { session: { expires_at: pastExpiry } },
        error: null,
      }),
      refreshSession: async () => ({ data: { session: null }, error: new Error('Failed') }),
    });

    const result = await attemptAuthRecovery(client);
    expect(result).toEqual({ recovered: false, shouldRedirect: true });
  });

  it('should return shouldRedirect:true when no session exists', async () => {
    const client = createMockClient({
      getSession: async () => ({
        data: { session: null },
        error: null,
      }),
      refreshSession: async () => ({ data: { session: null }, error: new Error('No session') }),
    });

    const result = await attemptAuthRecovery(client);
    expect(result).toEqual({ recovered: false, shouldRedirect: true });
  });
});
