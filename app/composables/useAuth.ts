import type { User, Session } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

/**
 * Composable for authentication state management
 *
 * Provides reactive authentication state using Nuxt's useState
 * Integrates with Supabase authentication
 *
 * Usage:
 * ```ts
 * const { user, session, isAuthenticated, signOut } = useAuth()
 * ```
 */
export function useAuth() {
  const supabase = useSupabaseClient()
  const supabaseUser = useSupabaseUser()

  // Global auth state using Nuxt's useState for SSR compatibility
  const authState = useState<AuthState>('auth', () => ({
    user: null,
    session: null,
    loading: true,
  }))

  // Sync with Supabase user composable
  watch(supabaseUser, (newUser) => {
    authState.value.user = newUser
    authState.value.loading = false
  }, { immediate: true })

  const isAuthenticated = computed(() => !!authState.value.user)

  const isLoading = computed(() => authState.value.loading)

  /**
   * Sign out the current user
   */
  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }

      authState.value.user = null
      authState.value.session = null

      await navigateTo('/auth/login')
    }
    catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  /**
   * Refresh the current session
   */
  async function refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        throw error
      }

      authState.value.session = data.session
      authState.value.user = data.user

      return data
    }
    catch (error) {
      console.error('Refresh session error:', error)
      throw error
    }
  }

  /**
   * Get user profile data
   */
  const userProfile = computed(() => {
    if (!authState.value.user) {
      return null
    }

    return {
      id: authState.value.user.id,
      email: authState.value.user.email,
      fullName: authState.value.user.user_metadata?.full_name,
      avatarUrl: authState.value.user.user_metadata?.avatar_url,
    }
  })

  /**
   * Get user initials for avatar fallback
   */
  const userInitials = computed(() => {
    if (!authState.value.user?.email) {
      return 'U'
    }

    const name = authState.value.user.user_metadata?.full_name
    if (name) {
      const parts = name.split(' ')
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      }
      return name.substring(0, 2).toUpperCase()
    }

    return authState.value.user.email.substring(0, 2).toUpperCase()
  })

  return {
    user: computed(() => authState.value.user),
    session: computed(() => authState.value.session),
    isAuthenticated,
    isLoading,
    userProfile,
    userInitials,
    signOut,
    refreshSession,
  }
}
