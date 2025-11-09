// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Your custom configs here
  {
    rules: {
      // Disable multi-word component names for pages (they are route components, not reusable components)
      'vue/multi-word-component-names': ['error', {
        ignores: ['login', 'register', 'callback', 'index', 'test', 'error', 'default'],
      }],
      // Require semicolons at the end of statements
      '@stylistic/semi': ['error', 'always'],
    },
  },
  {
    // Ignore auto-generated files
    ignores: ['app/types/database.types.ts'],
  },
)
