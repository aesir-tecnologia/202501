import { z } from 'zod';

export const AUTH = {
  FULL_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
  },
} as const;

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(AUTH.PASSWORD.MIN_LENGTH, `Password must be at least ${AUTH.PASSWORD.MIN_LENGTH} characters`),
  remember: z.boolean().optional(),
});

export type LoginPayload = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string()
    .min(AUTH.FULL_NAME.MIN_LENGTH, `Full name must be at least ${AUTH.FULL_NAME.MIN_LENGTH} characters`)
    .max(AUTH.FULL_NAME.MAX_LENGTH, `Full name must not exceed ${AUTH.FULL_NAME.MAX_LENGTH} characters`)
    .regex(/^[\p{L}\s'-]+$/u, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase(),
  password: z.string()
    .min(AUTH.PASSWORD.MIN_LENGTH, `Password must be at least ${AUTH.PASSWORD.MIN_LENGTH} characters`)
    .regex(passwordRegex, 'Password must contain uppercase, lowercase, number, and special character'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean()
    .refine(val => val, 'You must accept the terms and conditions'),
}).refine(
  data => data.password === data.confirmPassword,
  {
    message: 'Passwords don\'t match',
    path: ['confirmPassword'],
  },
);

export type RegisterPayload = z.infer<typeof registerSchema>;
