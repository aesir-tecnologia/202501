import { z } from 'zod';

// Project colors from documentation
export const PROJECT_COLORS = ['red', 'orange', 'amber', 'green', 'teal', 'blue', 'purple', 'pink'] as const;

export type ProjectColor = (typeof PROJECT_COLORS)[number];

export const projectIdentifierSchema = z.object({
  id: z.string().uuid(),
});

const projectBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Project name must be at least 1 character')
    .max(100, 'Project name must be 100 characters or fewer'),
  expectedDailyStints: z
    .number({ invalid_type_error: 'Expected daily stints must be a number' })
    .int('Expected daily stints must be a whole number')
    .min(1, 'Expect at least 1 stint per day')
    .max(8, 'Daily stint goal cannot exceed 8 stints')
    .optional(),
  customStintDuration: z
    .number({ invalid_type_error: 'Custom stint duration must be a number' })
    .int('Duration must be specified in whole minutes')
    .min(5, 'Duration must be at least 5 minutes')
    .max(480, 'Duration cannot exceed 480 minutes')
    .nullable()
    .optional(),
  colorTag: z
    .enum(PROJECT_COLORS, { errorMap: () => ({ message: 'Invalid color selection' }) })
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

export const projectCreateSchema = projectBaseSchema.extend({
  expectedDailyStints: projectBaseSchema.shape.expectedDailyStints.default(2),
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
