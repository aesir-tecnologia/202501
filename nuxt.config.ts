// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/test-utils',
    '@nuxt/ui',
    '@nuxtjs/supabase',
  ],
  ssr: true,
  pages: true,
  devtools: { enabled: true },
  devServer: {
    port: 3005,
  },
  app: {
    head: {
      meta: [
        // {
        //   'http-equiv': 'Content-Security-Policy',
        //   'content': `
        //     default-src 'self';
        //     script-src 'self' 'unsafe-inline' 'unsafe-eval';
        //     style-src 'self' 'unsafe-inline';
        //     img-src 'self' data: https:;
        //     font-src 'self' data:;
        //     connect-src 'self' http://127.0.0.1:54321 http://localhost:54321 https://*.supabase.co wss://*.supabase.co;
        //     frame-ancestors 'none';
        //     base-uri 'self';
        //   `.replace(/\s+/g, ' ').trim(),
        // },
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
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_ANON_KEY,
      },
    },
  },
  compatibilityDate: '2025-07-15',
  nitro: {
    preset: 'static',
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
        '/auth/login',
        '/auth/register',
        '/auth/forgot-password',
        '/auth/reset-password',
        '/auth/verify-email',
        '/design-showcase',
      ],
      ignore: ['/dashboard', '/dashboard/**', '/auth/callback', '/api/**'],
    },
    routeRules: {
      '/dashboard/**': { ssr: false },
      '/auth/callback': { ssr: false },
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
  vite: {
    build: {
      sourcemap: false,
    },
  },
  eslint: {
    config: {
      stylistic: true,
    },
  },
  icon: {
    serverBundle: {
      collections: ['lucide', 'heroicons'],
    },
    fallbackToApi: false,
  },
  supabase: {
    redirectOptions: {
      login: '/auth/login',
      callback: '/auth/callback',
      exclude: ['/', '/auth/*'],
      cookieRedirect: false,
    },
  },
})
