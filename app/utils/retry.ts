import { categorizeError, isRetryableError, type AppError } from './errors'

export interface RetryConfig {
  maxAttempts: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  retryableErrors?: (error: AppError) => boolean
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: isRetryableError,
}

/**
 * Exponential backoff delay calculator
 */
function calculateBackoff(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1)
  return Math.min(delay, config.maxDelayMs)
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry wrapper with exponential backoff
 *
 * Usage:
 * ```ts
 * const result = await withRetry(
 *   () => supabase.from('table').select(),
 *   { maxAttempts: 3 }
 * )
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<{ data: T | null, error: Error | null }>,
  config: Partial<RetryConfig> = {},
): Promise<{ data: T | null, error: AppError | null }> {
  const finalConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: AppError | null = null
  let attempt = 0

  while (attempt < finalConfig.maxAttempts) {
    attempt++

    try {
      const result = await operation()

      // Success case
      if (!result.error && result.data !== null) {
        return { data: result.data, error: null }
      }

      // Error case - categorize and check if retryable
      const categorizedError = categorizeError(result.error)
      lastError = categorizedError

      // Check if we should retry
      const shouldRetry = finalConfig.retryableErrors
        ? finalConfig.retryableErrors(categorizedError)
        : isRetryableError(categorizedError)

      if (!shouldRetry || attempt >= finalConfig.maxAttempts) {
        return { data: null, error: categorizedError }
      }

      // Wait before retrying with exponential backoff
      const delay = calculateBackoff(attempt, finalConfig)
      await sleep(delay)
    }
    catch (err) {
      // Handle unexpected thrown errors
      const categorizedError = categorizeError(err instanceof Error ? err : new Error(String(err)))
      lastError = categorizedError

      const shouldRetry = finalConfig.retryableErrors
        ? finalConfig.retryableErrors(categorizedError)
        : isRetryableError(categorizedError)

      if (!shouldRetry || attempt >= finalConfig.maxAttempts) {
        return { data: null, error: categorizedError }
      }

      const delay = calculateBackoff(attempt, finalConfig)
      await sleep(delay)
    }
  }

  // Should not reach here, but return last error if we do
  return { data: null, error: lastError || categorizeError(null) }
}

/**
 * Retry wrapper for operations that don't follow Supabase response pattern
 *
 * Usage:
 * ```ts
 * const data = await withRetrySimple(
 *   async () => {
 *     const response = await fetch('/api/data')
 *     return response.json()
 *   },
 *   { maxAttempts: 3 }
 * )
 * ```
 */
export async function withRetrySimple<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<{ data: T | null, error: AppError | null }> {
  const finalConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: AppError | null = null
  let attempt = 0

  while (attempt < finalConfig.maxAttempts) {
    attempt++

    try {
      const data = await operation()
      return { data, error: null }
    }
    catch (err) {
      const categorizedError = categorizeError(err instanceof Error ? err : new Error(String(err)))
      lastError = categorizedError

      const shouldRetry = finalConfig.retryableErrors
        ? finalConfig.retryableErrors(categorizedError)
        : isRetryableError(categorizedError)

      if (!shouldRetry || attempt >= finalConfig.maxAttempts) {
        return { data: null, error: categorizedError }
      }

      const delay = calculateBackoff(attempt, finalConfig)
      await sleep(delay)
    }
  }

  return { data: null, error: lastError || categorizeError(null) }
}
