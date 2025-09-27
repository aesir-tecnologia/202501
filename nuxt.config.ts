const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321'
const LOCAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const PLACEHOLDER_URL = 'https://your-project-id.supabase.co'
const PLACEHOLDER_ANON_KEY = 'your_supabase_anon_key_here'

function resolveSupabaseSetting(value: string | undefined, placeholder: string, fallback: string) {
  if (!value || value === placeholder) {
    return fallback
  }
  return value
}

const supabaseUrl = resolveSupabaseSetting(
  process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL,
  PLACEHOLDER_URL,
  LOCAL_SUPABASE_URL,
)
const supabaseAnonKey = resolveSupabaseSetting(
  process.env.SUPABASE_ANON_KEY || process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
  PLACEHOLDER_ANON_KEY,
  LOCAL_SUPABASE_ANON_KEY,
)

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/test-utils',
    '@nuxt/ui',
    '@nuxtjs/supabase',
  ],
  pages: true,
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
            connect-src 'self' http://127.0.0.1:54321 http://localhost:54321 https://*.supabase.co wss://*.supabase.co;
            frame-ancestors 'none';
            base-uri 'self';
          `.replace(/\s+/g, ' ').trim(),
        },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
    dataValue: 'theme',
  },
  ui: {
    colorMode: true,
  },
  runtimeConfig: {
    public: {
      supabase: {
        url: supabaseUrl,
        key: supabaseAnonKey,
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
