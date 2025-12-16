import { z } from 'zod';

/**
 * Schema for streak data returned from database layer.
 * Represents a user's current and historical streak information.
 */
export const streakDataSchema = z.object({
  currentStreak: z.number().int().min(0),
  longestStreak: z.number().int().min(0),
  lastStintDate: z.string().nullable(),
  isAtRisk: z.boolean(),
});

/**
 * Schema for timezone parameter used in streak calculations.
 * Must be a valid IANA timezone string (e.g., 'America/Sao_Paulo', 'Europe/London').
 */
export const timezoneSchema = z.string().min(1, 'Timezone is required');

export type StreakData = z.infer<typeof streakDataSchema>;
export type TimezoneParam = z.infer<typeof timezoneSchema>;
