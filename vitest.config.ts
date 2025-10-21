import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'app'),
      '@': path.resolve(__dirname),
      '~/lib': path.resolve(__dirname, 'app/lib'),
      '~/utils': path.resolve(__dirname, 'app/utils'),
      '~/types': path.resolve(__dirname, 'app/types'),
      '~/schemas': path.resolve(__dirname, 'app/schemas'),
      '~/composables': path.resolve(__dirname, 'app/composables'),
    },
  },
})
