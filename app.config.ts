export default defineAppConfig({
  ui: {
    // Nuxt UI configuration
  },
  auth: {
    redirectUrl: '/dashboard',
  },
})

declare module '@nuxt/schema' {
  interface AppConfigInput {
    auth?: {
      redirectUrl?: string
    }
  }
}
