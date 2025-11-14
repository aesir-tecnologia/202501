import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => ({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    globalSetup: ['./tests/globalSetup.ts'],
    env: loadEnv(mode ?? 'test', process.cwd(), ''),
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
}));
