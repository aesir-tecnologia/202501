import { z } from 'zod'

const PROJECT_NAME_MAX_LENGTH = 60
const PROJECT_NAME_MIN_LENGTH = 2
const DAILY_STINTS_MIN = 1
const DAILY_STINTS_MAX = 12
const CUSTOM_DURATION_MIN_MINUTES = 5
const CUSTOM_DURATION_MAX_MINUTES = 480

// TailwindCSS color options for project tags
export const PROJECT_COLORS = ['red', 'orange', 'amber', 'green', 'teal', 'blue', 'purple', 'pink'] as const
export type ProjectColor = typeof PROJECT_COLORS[number]

export const projectIdentifierSchema = z.object({
  id: z.string().uuid(),
})

const projectBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(PROJECT_NAME_MIN_LENGTH, 'Project name must be at least 2 characters')
    .max(PROJECT_NAME_MAX_LENGTH, 'Project name must be 60 characters or fewer'),
  expectedDailyStints: z
    .number({ invalid_type_error: 'Expected daily stints must be a number' })
    .int('Expected daily stints must be a whole number')
    .min(DAILY_STINTS_MIN, 'Expect at least one stint per day')
    .max(DAILY_STINTS_MAX, 'Daily stint goal is too high')
    .optional(),
  customStintDuration: z
    .number({ invalid_type_error: 'Custom stint duration must be a number' })
    .int('Duration must be specified in whole minutes')
    .min(CUSTOM_DURATION_MIN_MINUTES, 'Duration must be at least five minutes')
    .max(CUSTOM_DURATION_MAX_MINUTES, 'Duration cannot exceed eight hours')
    .nullable()
    .optional(),
  colorTag: z
    .enum(PROJECT_COLORS, { errorMap: () => ({ message: 'Invalid color selection' }) })
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
})

export const projectCreateSchema = projectBaseSchema.extend({
  expectedDailyStints: projectBaseSchema.shape.expectedDailyStints.default(2),
})

export const projectUpdateSchema = projectBaseSchema.partial({
  name: true,
  expectedDailyStints: true,
  customStintDuration: true,
  colorTag: true,
  isActive: true,
})

export type ProjectCreatePayload = z.infer<typeof projectCreateSchema>
export type ProjectUpdatePayload = z.infer<typeof projectUpdateSchema>
export type ProjectIdentifier = z.infer<typeof projectIdentifierSchema>

export const projectListFiltersSchema = z.object({
  includeInactive: z.boolean().optional(),
})

export type ProjectListFilters = z.infer<typeof projectListFiltersSchema>

export const PROJECT_SCHEMA_LIMITS = {
  NAME_MIN: PROJECT_NAME_MIN_LENGTH,
  NAME_MAX: PROJECT_NAME_MAX_LENGTH,
  DAILY_STINTS_MIN,
  DAILY_STINTS_MAX,
  CUSTOM_DURATION_MIN_MINUTES,
  CUSTOM_DURATION_MAX_MINUTES,
} as const
