/**
 * Resolves the planned duration for a stint following the documented fallback chain:
 * 1. Project's custom_stint_duration (if set)
 * 2. User's default_stint_duration (future: from user_preferences)
 * 3. Global default: 120 minutes (from documentation)
 */
export function resolveStintDuration(options: {
  projectCustomDuration?: number | null
  userDefaultDuration?: number | null
}): number {
  return (
    options.projectCustomDuration
    ?? options.userDefaultDuration
    ?? 120
  );
}
