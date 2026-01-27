// Project Constants
export const PROJECT = {
  COLORS: ['red', 'orange', 'amber', 'green', 'teal', 'blue', 'purple', 'pink'] as const,
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 60,
  },
  DAILY_STINTS: {
    MIN: 1,
    MAX: 12,
    DEFAULT: 2,
  },
  // Duration in seconds (used for database storage)
  CUSTOM_STINT_DURATION_SECONDS: {
    MIN: 300, // 5 minutes
    MAX: 28800, // 480 minutes (8 hours)
  },
  // Duration in minutes (used for user-facing display and input)
  CUSTOM_STINT_DURATION_MINUTES: {
    MIN: 5,
    MAX: 480,
  },
  PROGRESS_BAR: {
    // Maximum visual segments before switching to proportional display.
    // Prevents overcrowding on mobile devices when expectedDailyStints > 10.
    MAX_SEGMENTS: 10,
  },
} as const;

// Stint Constants
// NOTE: All durations are stored in SECONDS in the database
export const STINT = {
  // Duration in seconds (used for database storage and calculations)
  DURATION_SECONDS: {
    MIN: 300, // 5 minutes
    MAX: 28800, // 480 minutes (8 hours)
    DEFAULT: 7200, // 120 minutes (2 hours)
  },
  // Duration in minutes (used for user-facing display and input)
  DURATION_MINUTES: {
    MIN: 5,
    MAX: 480,
    DEFAULT: 120,
  },
  NOTES: {
    MAX_LENGTH: 500,
  },
} as const;

// Streak Constants
export const STREAK = {
  // Grace period in days - allows 1 day gap without breaking streak
  GRACE_PERIOD_DAYS: 1,
} as const;

// User Preferences Constants
// NOTE: All durations are stored in SECONDS in the database
export const PREFERENCES = {
  // Duration in seconds (used for database storage)
  STINT_DURATION_SECONDS: {
    MIN: 300, // 5 minutes
    MAX: 28800, // 480 minutes (8 hours)
    DEFAULT: 7200, // 120 minutes (2 hours)
  },
  // Duration in minutes (used for user-facing display and input)
  STINT_DURATION: {
    MIN: 5,
    MAX: 480,
    DEFAULT: 120,
  },
} as const;

// Type Exports
export type ProjectColor = typeof PROJECT.COLORS[number];
