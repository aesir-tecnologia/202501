// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/test-utils', '@nuxt/ui', '@nuxtjs/supabase'],
  devtools: { enabled: true },
  // Content Security Policy
  app: {
    head: {
      meta: [
        {
          'http-equiv': 'Content-Security-Policy',
          'content': `
            default-src 'self';
            script-src 'self' 'unsafe-inline' 'unsafe-eval';
            style-src 'self' 'unsafe-inline';
            img-src 'self' data: https:;
            font-src 'self' data:;
            connect-src 'self' https://*.supabase.co wss://*.supabase.co;
            frame-ancestors 'none';
            base-uri 'self';
          `.replace(/\s+/g, ' ').trim(),
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      supabase: {
        url: process.env.SUPABASE_URL || (() => {
          throw new Error('SUPABASE_URL is required')
        })(),
        key: process.env.SUPABASE_ANON_KEY || (() => {
          throw new Error('SUPABASE_ANON_KEY is required')
        })(),
      },
    },
  },
  compatibilityDate: '2025-07-15',
  // Security headers configuration
  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        },
      },
    },
  },
  eslint: {
    config: {
      stylistic: true,
    },
  },
  supabase: {
    redirectOptions: {
      login: '/auth/login',
      callback: '/auth/callback',
      exclude: ['/', '/auth/*'],
    },
  },
})
