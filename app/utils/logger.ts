import { consola, type ConsolaInstance } from 'consola';

/**
 * Application-wide logger instance with 'lifestint' tag.
 * Routes to console in development, Sentry in production via consolaIntegration.
 *
 * Usage:
 *   logger.info('Operation started', { projectId })
 *   logger.warn('Unusual condition', { details })
 *   logger.error('Operation failed', error)
 *   logger.debug('Verbose tracing')  // Suppressed in prod
 */
export const logger: ConsolaInstance = consola.withDefaults({
  tag: 'lifestint',
});

/**
 * Create a module-specific logger with an additional tag.
 *
 * Usage:
 *   const log = createLogger('timer')
 *   log.error('Timer failed', { reason })  // Tagged: [lifestint] [timer]
 */
export function createLogger(tag: string): ConsolaInstance {
  return logger.withTag(tag);
}
