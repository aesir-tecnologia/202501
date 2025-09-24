export default defineNuxtPlugin(async () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Initialize client and handle authentication state changes
  if (import.meta.client) {
    try {
      // Test connection to ensure Supabase is properly configured
      const { error } = await supabase.auth.getSession()

      if (error) {
        console.warn('Supabase client initialization warning:', error.message)
      }
    } catch (err) {
      console.error('Supabase client initialization failed:', err)
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session?.user?.email)
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out')
      }
    })
  }

  return {
    provide: {
      supabase,
      user
    }
  }
})