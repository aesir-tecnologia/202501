import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode ?? 'test', process.cwd(), '');
  const useMock = env.USE_MOCK_SUPABASE !== 'false';

  return {
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: ['./tests/setup.ts'],
      globalSetup: useMock ? undefined : ['./tests/globalSetup.ts'],
      env,
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
  };
});
