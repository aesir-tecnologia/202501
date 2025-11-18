import { z } from 'zod';

const STINT_DURATION_MIN_MINUTES = 10;
const STINT_DURATION_MAX_MINUTES = 120;
const STINT_NOTES_MAX_LENGTH = 500;

export const stintIdentifierSchema = z.object({
  id: z.string().uuid(),
});

export const stintStartSchema = z.object({
  projectId: z.string().uuid('A valid project id is required'),
  startedAt: z.date().optional(),
  notes: z
    .string()
    .trim()
    .max(STINT_NOTES_MAX_LENGTH, 'Notes must be 500 characters or fewer')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export const stintStartEnhancedSchema = z.object({
  projectId: z.string().uuid('A valid project id is required'),
  plannedDurationMinutes: z
    .number()
    .int()
    .min(STINT_DURATION_MIN_MINUTES, `Stint duration must be at least ${STINT_DURATION_MIN_MINUTES} minutes`)
    .max(STINT_DURATION_MAX_MINUTES, `Stint duration must be at most ${STINT_DURATION_MAX_MINUTES} minutes`)
    .optional(),
  notes: z
    .string()
    .trim()
    .max(STINT_NOTES_MAX_LENGTH, 'Notes must be 500 characters or fewer')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export const stintUpdateSchema = z.object({
  notes: z
    .string()
    .trim()
    .max(STINT_NOTES_MAX_LENGTH, 'Notes must be 500 characters or fewer')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export const stintPauseSchema = z.object({
  stintId: z.string().uuid('A valid stint id is required'),
});

export const stintResumeSchema = z.object({
  stintId: z.string().uuid('A valid stint id is required'),
});

export const stintCompletionSchema = z.object({
  stintId: z.string().uuid('A valid stint id is required'),
  completionType: z.enum(['manual', 'auto', 'interrupted'], {
    errorMap: () => ({ message: 'Completion type must be manual, auto, or interrupted' }),
  }),
  notes: stintUpdateSchema.shape.notes,
});

export const stintInterruptSchema = z.object({
  stintId: z.string().uuid('A valid stint id is required'),
  reason: z
    .string()
    .trim()
    .max(STINT_NOTES_MAX_LENGTH, 'Reason must be 500 characters or fewer')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export type StintStartPayload = z.infer<typeof stintStartSchema>;
export type StintStartEnhancedPayload = z.infer<typeof stintStartEnhancedSchema>;
export type StintUpdatePayload = z.infer<typeof stintUpdateSchema>;
export type StintPausePayload = z.infer<typeof stintPauseSchema>;
export type StintResumePayload = z.infer<typeof stintResumeSchema>;
export type StintCompletionPayload = z.infer<typeof stintCompletionSchema>;
export type StintInterruptPayload = z.infer<typeof stintInterruptSchema>;
export type StintIdentifier = z.infer<typeof stintIdentifierSchema>;

export const STINT_SCHEMA_LIMITS = {
  DURATION_MIN_MINUTES: STINT_DURATION_MIN_MINUTES,
  DURATION_MAX_MINUTES: STINT_DURATION_MAX_MINUTES,
  NOTES_MAX_LENGTH: STINT_NOTES_MAX_LENGTH,
} as const;
