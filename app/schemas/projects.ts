import { z } from 'zod';
import { PROJECT, type ProjectColor } from '~/constants';

export type { ProjectColor };

export const projectIdentifierSchema = z.object({
  id: z.string().uuid(),
});

const projectBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(PROJECT.NAME.MIN_LENGTH, `Project name must be at least ${PROJECT.NAME.MIN_LENGTH} characters`)
    .max(PROJECT.NAME.MAX_LENGTH, `Project name must be ${PROJECT.NAME.MAX_LENGTH} characters or fewer`),
  expectedDailyStints: z
    .number({ invalid_type_error: 'Expected daily stints must be a number' })
    .int('Expected daily stints must be a whole number')
    .min(PROJECT.DAILY_STINTS.MIN, `Expect at least ${PROJECT.DAILY_STINTS.MIN} stint${PROJECT.DAILY_STINTS.MIN === 1 ? '' : 's'} per day`)
    .max(PROJECT.DAILY_STINTS.MAX, `Daily stint goal cannot exceed ${PROJECT.DAILY_STINTS.MAX} stints`)
    .optional(),
  customStintDuration: z
    .number({ invalid_type_error: 'Custom stint duration must be a number' })
    .int('Duration must be specified in whole minutes')
    .min(PROJECT.CUSTOM_STINT_DURATION_MINUTES.MIN, `Duration must be at least ${PROJECT.CUSTOM_STINT_DURATION_MINUTES.MIN} minutes`)
    .max(PROJECT.CUSTOM_STINT_DURATION_MINUTES.MAX, `Duration cannot exceed ${PROJECT.CUSTOM_STINT_DURATION_MINUTES.MAX} minutes`)
    .nullable()
    .optional(),
  colorTag: z
    .enum(PROJECT.COLORS, { errorMap: () => ({ message: 'Invalid color selection' }) })
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

export const projectCreateSchema = projectBaseSchema.extend({
  expectedDailyStints: projectBaseSchema.shape.expectedDailyStints.default(PROJECT.DAILY_STINTS.DEFAULT),
});

export const projectUpdateSchema = projectBaseSchema.partial({
  name: true,
  expectedDailyStints: true,
  customStintDuration: true,
  colorTag: true,
  isActive: true,
});

export const projectListFiltersSchema = z.object({
  includeInactive: z.boolean().optional(),
});

export type ProjectCreatePayload = z.infer<typeof projectCreateSchema>;
export type ProjectUpdatePayload = z.infer<typeof projectUpdateSchema>;
export type ProjectIdentifier = z.infer<typeof projectIdentifierSchema>;
export type ProjectListFilters = z.infer<typeof projectListFiltersSchema>;
