// Shared constants across Edge Functions
// Source: docs/03-feature-requirements.md and docs/05-database-schema.md

export const STINT_CONSTRAINTS = {
  // Duration limits (in minutes)
  MIN_DURATION: 5,
  MAX_DURATION: 480,
  DEFAULT_DURATION: 120,

  // Maximum total stint duration (in minutes)
  MAX_TOTAL_DURATION: 240, // 4 hours

  // Notes length limit (in characters)
  MAX_NOTES_LENGTH: 500,

  // Anti-abuse limit
  MAX_STINTS_PER_PROJECT_PER_DAY: 50,
} as const;

export const PROJECT_CONSTRAINTS = {
  // Name length (in characters)
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 100,

  // Expected daily stints range
  MIN_DAILY_STINTS: 1,
  MAX_DAILY_STINTS: 8,

  // Maximum active projects per user
  MAX_ACTIVE_PROJECTS_FREE: 2,
  MAX_ACTIVE_PROJECTS_PRO: 25,
} as const;

export const INTERRUPTION_CONSTRAINTS = {
  // Interruption reason length (in characters)
  MAX_REASON_LENGTH: 200,
} as const;
