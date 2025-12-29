import type { TypedSupabaseClient } from '~/utils/supabase';

export type Result<T> = {
  data: T | null
  error: Error | null
};

const AUTH_ERROR_PATTERNS = [
  'must be authenticated',
  'not authenticated',
  'authentication required',
  'session has expired',
  'invalid token',
  'jwt expired',
  'refresh_token_not_found',
] as const;

export function isAuthError(error: unknown): boolean {
  if (!error) return false;

  const message = error instanceof Error
    ? error.message.toLowerCase()
    : String(error).toLowerCase();

  return AUTH_ERROR_PATTERNS.some(pattern => message.includes(pattern));
}

export async function refreshSession(client: TypedSupabaseClient): Promise<boolean> {
  try {
    const { error } = await client.auth.refreshSession();
    return !error;
  }
  catch {
    return false;
  }
}

export async function withAuthRetry<T>(
  client: TypedSupabaseClient,
  operation: () => Promise<Result<T>>,
): Promise<Result<T>> {
  let result = await operation();

  if (result.error && isAuthError(result.error)) {
    const refreshed = await refreshSession(client);

    if (refreshed) {
      result = await operation();
    }
  }

  return result;
}

export type AuthRecoveryResult
  = | { recovered: true }
    | { recovered: false, shouldRedirect: true }
    | { recovered: false, shouldRedirect: false, error: Error };

export async function attemptAuthRecovery(
  client: TypedSupabaseClient,
): Promise<AuthRecoveryResult> {
  const { data: { session } } = await client.auth.getSession();

  if (session && !isSessionExpired(session.expires_at)) {
    return { recovered: true };
  }

  const refreshed = await refreshSession(client);

  if (refreshed) {
    return { recovered: true };
  }

  return { recovered: false, shouldRedirect: true };
}

function isSessionExpired(expiresAt: number | undefined): boolean {
  if (!expiresAt) return true;
  const now = Math.floor(Date.now() / 1000);
  return now >= expiresAt;
}
