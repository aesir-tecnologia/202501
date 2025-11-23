import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '~/types/auth';

function transformSupabaseUser(supabaseUser: SupabaseUser | null): User | null {
  if (!supabaseUser) {
    return null;
  }

  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    emailConfirmedAt: supabaseUser.email_confirmed_at ?? null,
    fullName: supabaseUser.user_metadata?.full_name,
    createdAt: supabaseUser.created_at,
  };
}

/**
 * Provider-agnostic authentication user composable
 *
 * Usage:
 * ```ts
 * const user = useAuthUser()
 * if (user.value) {
 *   console.log(user.value.email)
 *   console.log(user.value.fullName)
 * }
 * ```
 *
 * @param supabaseUserOverride Optional Supabase user ref for testing
 * @returns Computed ref containing normalized User or null
 */
export function useAuthUser(
  supabaseUserOverride?: Ref<SupabaseUser | null>,
): ComputedRef<User | null> {
  const supabaseUser = supabaseUserOverride ?? useSupabaseUser();

  return computed(() => transformSupabaseUser(supabaseUser.value));
}
