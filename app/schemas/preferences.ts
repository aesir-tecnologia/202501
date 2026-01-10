import { z } from 'zod';
import { PREFERENCES } from '~/constants';

export const preferencesUpdateSchema = z.object({
  defaultStintDuration: z
    .number({ invalid_type_error: 'Default duration must be a number' })
    .int('Duration must be specified in whole minutes')
    .min(PREFERENCES.STINT_DURATION.MIN, `Duration must be at least ${PREFERENCES.STINT_DURATION.MIN} minutes`)
    .max(PREFERENCES.STINT_DURATION.MAX, `Duration cannot exceed ${PREFERENCES.STINT_DURATION.MAX} minutes`)
    .nullable()
    .optional(),
  celebrationAnimation: z.boolean().optional(),
  desktopNotifications: z.boolean().optional(),
});

export type PreferencesUpdatePayload = z.infer<typeof preferencesUpdateSchema>;

export const DEFAULT_PREFERENCES = {
  defaultStintDuration: null,
  celebrationAnimation: true,
  desktopNotifications: false,
} as const;
