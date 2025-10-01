import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: [
      { find: '~/lib', replacement: path.resolve(__dirname, 'app/lib') },
      { find: '~/utils', replacement: path.resolve(__dirname, 'app/utils') },
      { find: '~/types', replacement: path.resolve(__dirname, 'app/types') },
      { find: '~', replacement: path.resolve(__dirname, 'app') },
      { find: '@', replacement: path.resolve(__dirname) },
    ],
  },
})
