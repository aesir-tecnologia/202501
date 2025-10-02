/**
 * Shared types for optimistic UI operations
 */

export interface OptimisticResult<T> {
  data: T | null
  error: Error | null
}
