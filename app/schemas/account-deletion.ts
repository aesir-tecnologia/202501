import { z } from 'zod';

export const ACCOUNT_DELETION_SCHEMA_LIMITS = {
  PASSWORD_MIN_LENGTH: 1,
  EMAIL_MAX_LENGTH: 255,
} as const;

export const requestDeletionSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(ACCOUNT_DELETION_SCHEMA_LIMITS.EMAIL_MAX_LENGTH, `Email must be ${ACCOUNT_DELETION_SCHEMA_LIMITS.EMAIL_MAX_LENGTH} characters or fewer`)
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(ACCOUNT_DELETION_SCHEMA_LIMITS.PASSWORD_MIN_LENGTH, 'Password is required'),
});

export const deletionStatusSchema = z.object({
  isPending: z.boolean(),
  requestedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  daysRemaining: z.number().int().nullable(),
});

export type RequestDeletionPayload = z.infer<typeof requestDeletionSchema>;
export type DeletionStatus = z.infer<typeof deletionStatusSchema>;
