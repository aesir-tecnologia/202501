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
export const STINT = {
  DURATION_MINUTES: {
    MIN: 5,
    MAX: 480,
    DEFAULT: 120,
  },
  NOTES: {
    MAX_LENGTH: 500,
  },
} as const;

// Type Exports
export type ProjectColor = typeof PROJECT.COLORS[number];
