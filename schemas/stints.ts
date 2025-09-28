import { z } from 'zod'

const STINT_DURATION_MIN_MINUTES = 5
const STINT_DURATION_MAX_MINUTES = 720
const STINT_NOTES_MAX_LENGTH = 500

export const stintIdentifierSchema = z.object({
  id: z.string().uuid(),
})

export const stintStartSchema = z.object({
  projectId: z.string().uuid('A valid project id is required'),
  startedAt: z.date().optional(),
  notes: z
    .string()
    .trim()
    .max(STINT_NOTES_MAX_LENGTH, 'Notes must be 500 characters or fewer')
    .optional()
    .or(z.literal('').transform(() => undefined)),
})

export const stintUpdateSchema = z.object({
  notes: z
    .string()
    .trim()
    .max(STINT_NOTES_MAX_LENGTH, 'Notes must be 500 characters or fewer')
    .optional()
    .or(z.literal('').transform(() => undefined)),
})

export const stintCompletionSchema = z.object({
  stintId: z.string().uuid('A valid stint id is required'),
  endedAt: z.date().optional(),
  durationMinutes: z
    .number({ invalid_type_error: 'Duration must be a number' })
    .int('Duration must be a whole number')
    .min(STINT_DURATION_MIN_MINUTES, 'Duration must be at least five minutes')
    .max(STINT_DURATION_MAX_MINUTES, 'Duration cannot exceed twelve hours'),
  notes: stintUpdateSchema.shape.notes,
  completed: z.boolean().default(true),
})

export type StintStartPayload = z.infer<typeof stintStartSchema>
export type StintUpdatePayload = z.infer<typeof stintUpdateSchema>
export type StintCompletionPayload = z.infer<typeof stintCompletionSchema>
export type StintIdentifier = z.infer<typeof stintIdentifierSchema>

export const STINT_SCHEMA_LIMITS = {
  DURATION_MIN_MINUTES: STINT_DURATION_MIN_MINUTES,
  DURATION_MAX_MINUTES: STINT_DURATION_MAX_MINUTES,
  NOTES_MAX_LENGTH: STINT_NOTES_MAX_LENGTH,
} as const
