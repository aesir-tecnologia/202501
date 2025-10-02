/**
 * Auth middleware - redirects unauthenticated users to login
 * Usage: Add `middleware: 'auth'` to page meta for protected pages
 */
export default defineNuxtRouteMiddleware(() => {
  const user = useSupabaseUser()

  // If user is not authenticated, redirect to login
  if (!user.value) {
    return navigateTo('/auth/login')
  }
})
