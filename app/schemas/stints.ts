import { z } from 'zod';
import { STINT } from '~/constants';

export const stintIdentifierSchema = z.object({
  id: z.string().uuid(),
});

export const stintStartSchema = z.object({
  projectId: z.string().uuid('A valid project id is required'),
  plannedDurationMinutes: z
    .number()
    .int()
    .min(STINT.DURATION_MINUTES.MIN, `Stint duration must be at least ${STINT.DURATION_MINUTES.MIN} minutes`)
    .max(STINT.DURATION_MINUTES.MAX, `Stint duration must be at most ${STINT.DURATION_MINUTES.MAX} minutes`)
    .optional(),
  notes: z
    .string()
    .trim()
    .max(STINT.NOTES.MAX_LENGTH, `Notes must be ${STINT.NOTES.MAX_LENGTH} characters or fewer`)
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export const stintUpdateSchema = z.object({
  notes: z
    .string()
    .trim()
    .max(STINT.NOTES.MAX_LENGTH, `Notes must be ${STINT.NOTES.MAX_LENGTH} characters or fewer`)
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
  attributedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Attributed date must be in YYYY-MM-DD format')
    .optional(),
});

export const stintInterruptSchema = z.object({
  stintId: z.string().uuid('A valid stint id is required'),
  reason: z
    .string()
    .trim()
    .max(STINT.NOTES.MAX_LENGTH, `Reason must be ${STINT.NOTES.MAX_LENGTH} characters or fewer`)
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export type StintStartPayload = z.infer<typeof stintStartSchema>;
export type StintUpdatePayload = z.infer<typeof stintUpdateSchema>;
export type StintPausePayload = z.infer<typeof stintPauseSchema>;
export type StintResumePayload = z.infer<typeof stintResumeSchema>;
export type StintCompletionPayload = z.infer<typeof stintCompletionSchema>;
export type StintInterruptPayload = z.infer<typeof stintInterruptSchema>;
export type StintIdentifier = z.infer<typeof stintIdentifierSchema>;

// Sync check output type
export interface SyncCheckOutput {
  stintId: string
  status: 'active' | 'paused' | 'completed' | 'interrupted'
  remainingSeconds: number
  serverTimestamp: string
  driftSeconds?: number
}

// Export constants for contract compatibility
export const STINT_SCHEMA_LIMITS = STINT;

// Type aliases for contract naming conventions
export type StartStintInput = StintStartPayload;
export type CompleteStintInput = StintCompletionPayload;
export type StintIdInput = StintIdentifier;
export type PauseStintInput = StintPausePayload;
export type ResumeStintInput = StintResumePayload;
