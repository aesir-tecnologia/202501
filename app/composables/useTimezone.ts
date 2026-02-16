import { usePreferencesQuery } from '~/composables/usePreferences';
import { createLogger } from '~/utils/logger';

const log = createLogger('timezone');

export function useTimezone() {
  const { data: preferencesData } = usePreferencesQuery();
  const timezone = computed(() => preferencesData.value?.timezone ?? 'UTC');

  watchEffect(() => {
    if (preferencesData.value && !preferencesData.value.timezone) {
      log.warn('Timezone missing from loaded preferences, falling back to UTC');
    }
  });

  return { timezone, preferencesData };
}
