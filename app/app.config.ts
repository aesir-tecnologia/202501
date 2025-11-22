import { PROJECT, STINT } from './constants';

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
    colors: PROJECT.COLORS,
    nameMinLength: PROJECT.NAME.MIN_LENGTH,
    nameMaxLength: PROJECT.NAME.MAX_LENGTH,
    dailyStintsMin: PROJECT.DAILY_STINTS.MIN,
    dailyStintsMax: PROJECT.DAILY_STINTS.MAX,
    dailyStintsDefault: PROJECT.DAILY_STINTS.DEFAULT,
    customStintDurationMinMinutes: PROJECT.CUSTOM_STINT_DURATION_MINUTES.MIN,
    customStintDurationMaxMinutes: PROJECT.CUSTOM_STINT_DURATION_MINUTES.MAX,
  },
  stint: {
    durationMinMinutes: STINT.DURATION_MINUTES.MIN,
    durationMaxMinutes: STINT.DURATION_MINUTES.MAX,
    notesMaxLength: STINT.NOTES.MAX_LENGTH,
  },
});
