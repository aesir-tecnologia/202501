/**
 * Auth middleware - protects authenticated routes
 * Client-side only for SSG compatibility
 * Usage: Add `middleware: 'auth'` to page meta for protected pages
 */
export default defineNuxtRouteMiddleware(() => {
  // Only run on client-side for SSG compatibility
  if (import.meta.server) {
    return
  }

  const user = useAuthUser()

  // If user is not authenticated, redirect to login
  if (!user.value) {
    return navigateTo('/auth/login')
  }
})
