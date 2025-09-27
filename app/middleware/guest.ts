/**
 * Guest middleware - redirects authenticated users away from auth pages
 * Usage: Add `middleware: 'guest'` to page meta for login/register pages
 */
export default defineNuxtRouteMiddleware(() => {
  const user = useSupabaseUser()

  // If user is already authenticated, redirect to home
  if (user.value) {
    return navigateTo('/')
  }
})
