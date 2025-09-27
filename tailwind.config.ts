import defaultTheme from 'tailwindcss/defaultTheme'
import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/pages/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './utils/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          border: 'var(--color-border)',
          text: {
            primary: 'var(--color-text-primary)',
            secondary: 'var(--color-text-secondary)',
            muted: 'var(--color-text-muted)',
          },
        },
        accent: {
          orange: 'var(--color-accent-orange)',
          green: 'var(--color-accent-green)',
          blue: 'var(--color-accent-blue)',
          purple: 'var(--color-accent-purple)',
          magenta: 'var(--color-accent-magenta)',
        },
        state: {
          danger: 'var(--color-danger)',
        },
        surface: {
          hover: 'var(--color-surface-hover)',
          pressed: 'var(--color-surface-pressed)',
        },
        focus: {
          ring: 'var(--color-focus-ring)',
        },
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        heading: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      spacing: {
        'space-1': 'var(--space-1)',
        'space-2': 'var(--space-2)',
        'space-3': 'var(--space-3)',
        'space-4': 'var(--space-4)',
        'space-6': 'var(--space-6)',
        'space-8': 'var(--space-8)',
        'space-12': 'var(--space-12)',
        'space-16': 'var(--space-16)',
      },
      ringColor: {
        brand: 'var(--color-focus-ring)',
      },
      boxShadow: {
        focus: '0 0 0 0.25rem var(--color-focus-ring)',
      },
    },
  },
  plugins: [],
} satisfies Config
