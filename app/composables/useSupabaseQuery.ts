import type { AppError } from '~/utils/errors'
import { withRetry, type RetryConfig } from '~/utils/retry'

export interface QueryOptions {
  /**
   * Cache key for the query. If not provided, caching is disabled.
   */
  key?: string

  /**
   * Enable automatic retry with exponential backoff
   */
  retry?: boolean | Partial<RetryConfig>

  /**
   * Manually refresh the query
   */
  immediate?: boolean

  /**
   * Watch sources that trigger query refresh
   */
  watch?: any[]
}

export interface QueryResult<T> {
  data: Ref<T | null>
  error: Ref<AppError | null>
  loading: Ref<boolean>
  refresh: () => Promise<void>
}

/**
 * Composable for Supabase queries with caching, retry, and error handling
 *
 * Usage:
 * ```ts
 * const { data, error, loading, refresh } = useSupabaseQuery(
 *   () => listProjects(client),
 *   {
 *     key: 'projects',
 *     retry: true,
 *     watch: [userId]
 *   }
 * )
 * ```
 */
export function useSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null, error: Error | null }>,
  options: QueryOptions = {},
): QueryResult<T> {
  const data = ref<T | null>(null)
  const error = ref<AppError | null>(null)
  const loading = ref(false)

  async function executeQuery() {
    loading.value = true
    error.value = null

    try {
      let result: { data: T | null, error: AppError | null }

      if (options.retry !== false) {
        // Use retry logic if enabled (default)
        const retryConfig = typeof options.retry === 'object' ? options.retry : {}
        result = await withRetry(queryFn, retryConfig)
      }
      else {
        // Execute without retry
        const rawResult = await queryFn()
        if (rawResult.error) {
          const { categorizeError } = await import('~/utils/errors')
          result = { data: null, error: categorizeError(rawResult.error) }
        }
        else {
          result = { data: rawResult.data, error: null }
        }
      }

      if (result.error) {
        error.value = result.error
        data.value = null
      }
      else {
        data.value = result.data
        error.value = null
      }
    }
    catch (err) {
      const { categorizeError } = await import('~/utils/errors')
      error.value = categorizeError(err instanceof Error ? err : new Error(String(err)))
      data.value = null
    }
    finally {
      loading.value = false
    }
  }

  async function refresh() {
    await executeQuery()
  }

  // Execute immediately if requested (default: true)
  if (options.immediate !== false) {
    executeQuery()
  }

  // Watch for changes if watch sources provided
  if (options.watch && options.watch.length > 0) {
    watch(options.watch, () => {
      executeQuery()
    })
  }

  return {
    data: data as Ref<T | null>,
    error,
    loading,
    refresh,
  }
}

/**
 * Composable for Supabase queries with Nuxt caching (useAsyncData)
 *
 * Provides stale-while-revalidate caching with automatic dedupe
 *
 * Usage:
 * ```ts
 * const { data, error, pending, refresh } = await useCachedSupabaseQuery(
 *   'projects',
 *   () => listProjects(client),
 *   { retry: true }
 * )
 * ```
 */
export async function useCachedSupabaseQuery<T>(
  key: string,
  queryFn: () => Promise<{ data: T | null, error: Error | null }>,
  options: { retry?: boolean | Partial<RetryConfig> } = {},
) {
  return useAsyncData<T, AppError>(
    key,
    async () => {
      let result: { data: T | null, error: AppError | null }

      if (options.retry !== false) {
        // Use retry logic if enabled (default)
        const retryConfig = typeof options.retry === 'object' ? options.retry : {}
        result = await withRetry(queryFn, retryConfig)
      }
      else {
        // Execute without retry
        const rawResult = await queryFn()
        if (rawResult.error) {
          const { categorizeError } = await import('~/utils/errors')
          result = { data: null, error: categorizeError(rawResult.error) }
        }
        else {
          result = { data: rawResult.data, error: null }
        }
      }

      if (result.error) {
        throw result.error
      }

      return result.data!
    },
    {
      // Deduplicate requests with same key
      dedupe: 'defer',
    },
  )
}
