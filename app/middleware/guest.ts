/**
 * Guest middleware - redirects authenticated users away from auth pages
 * Client-side only for SSG compatibility
 * Usage: Add `middleware: 'guest'` to page meta for login/register pages
 */
export default defineNuxtRouteMiddleware(() => {
  // Only run on client-side for SSG compatibility
  if (import.meta.server) {
    return
  }

  const user = useAuthUser()

  // If user is already authenticated, redirect to home
  if (user.value) {
    return navigateTo('/')
  }
})
