export default defineAppConfig({
  auth: {
    home: '/',
    redirectUrl: '/dashboard',
  },
  ui: {
    icons: {
      light: 'i-lucide-sun',
      dark: 'i-lucide-moon',
    },
    colors: {
      primary: 'violet',
      secondary: 'sky',
    },
  },
  project: {
    colors: ['red', 'orange', 'amber', 'green', 'teal', 'blue', 'purple', 'pink'] as const,
    dailyStints: {
      MIN: 1,
      MAX: 8,
      DEFAULT: 2,
    },
  },
});
