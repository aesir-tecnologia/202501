/**
 * Authentication middleware - protects routes that require authentication
 * Usage: Add `middleware: 'auth'` to page meta
 */
export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  // If user is not authenticated, redirect to login
  if (!user.value) {
    // Store the intended destination for post-login redirect
    const redirectTo = to.fullPath !== '/' ? to.fullPath : undefined

    return navigateTo({
      path: '/auth/login',
      query: redirectTo ? { redirectTo } : {},
    })
  }

  // Optional: Check if email is verified (uncomment if email verification is required)
  // if (!user.value.email_confirmed_at) {
  //   throw createError({
  //     statusCode: 403,
  //     statusMessage: 'Please verify your email address to access this page.'
  //   })
  // }
})
