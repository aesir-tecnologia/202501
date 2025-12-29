import type { TypedSupabaseClient } from '~/utils/supabase';

export type Result<T> = {
  data: T | null
  error: Error | null
};

export async function requireUserId(
  client: TypedSupabaseClient,
  context: string = 'this operation',
): Promise<Result<string>> {
  const { data, error } = await client.auth.getUser();

  if (error || !data?.user) {
    return {
      data: null,
      error: new Error(`User must be authenticated to ${context}`),
    };
  }

  return { data: data.user.id, error: null };
}
