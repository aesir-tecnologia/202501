import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database.types';

export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Returns a Supabase client typed with the project's Database schema.
 *
 * The @nuxtjs/supabase module's useSupabaseClient<T>() uses its own Database
 * type from module augmentation, which doesn't align with our generated
 * Database types in ~/types/database.types.ts. This helper provides the
 * correctly typed client while encapsulating the necessary type assertion.
 */
export function useTypedSupabaseClient(): TypedSupabaseClient {
  return useSupabaseClient() as unknown as TypedSupabaseClient;
}
