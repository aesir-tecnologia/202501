import { describe, it, expect, vi, beforeEach } from 'vitest'
import { withRetry, withRetrySimple } from '~/utils/retry'
import { ErrorCategory } from '~/utils/errors'

describe('withRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it('returns data on first successful attempt', async () => {
    const operation = vi.fn().mockResolvedValue({
      data: { id: '1' },
      error: null,
    })

    const promise = withRetry(operation)
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.data).toEqual({ id: '1' })
    expect(result.error).toBeNull()
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('retries on network errors', async () => {
    const operation = vi.fn()
      .mockResolvedValueOnce({ data: null, error: new Error('Failed to fetch') })
      .mockResolvedValueOnce({ data: { id: '1' }, error: null })

    const promise = withRetry(operation, { maxAttempts: 3 })
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.data).toEqual({ id: '1' })
    expect(result.error).toBeNull()
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it('does not retry on non-retryable errors', async () => {
    const operation = vi.fn().mockResolvedValue({
      data: null,
      error: new Error('not authenticated'),
    })

    const promise = withRetry(operation, { maxAttempts: 3 })
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.data).toBeNull()
    expect(result.error?.category).toBe(ErrorCategory.Authentication)
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('respects maxAttempts', async () => {
    const operation = vi.fn().mockResolvedValue({
      data: null,
      error: new Error('network error'),
    })

    const promise = withRetry(operation, { maxAttempts: 2 })
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.data).toBeNull()
    expect(result.error).toBeTruthy()
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it('implements exponential backoff', async () => {
    const operation = vi.fn()
      .mockResolvedValueOnce({ data: null, error: new Error('network error') })
      .mockResolvedValueOnce({ data: null, error: new Error('network error') })
      .mockResolvedValueOnce({ data: { id: '1' }, error: null })

    const promise = withRetry(operation, {
      maxAttempts: 3,
      initialDelayMs: 100,
      backoffMultiplier: 2,
    })

    // First attempt - immediate
    await vi.advanceTimersByTimeAsync(0)
    expect(operation).toHaveBeenCalledTimes(1)

    // Second attempt - after 100ms
    await vi.advanceTimersByTimeAsync(100)
    expect(operation).toHaveBeenCalledTimes(2)

    // Third attempt - after 200ms (100 * 2^1)
    await vi.advanceTimersByTimeAsync(200)
    expect(operation).toHaveBeenCalledTimes(3)

    const result = await promise
    expect(result.data).toEqual({ id: '1' })
  })

  it('caps delay at maxDelayMs', async () => {
    const operation = vi.fn()
      .mockResolvedValueOnce({ data: null, error: new Error('network error') })
      .mockResolvedValueOnce({ data: { id: '1' }, error: null })

    const promise = withRetry(operation, {
      maxAttempts: 2,
      initialDelayMs: 1000,
      maxDelayMs: 500,
      backoffMultiplier: 10,
    })

    await vi.advanceTimersByTimeAsync(0)
    expect(operation).toHaveBeenCalledTimes(1)

    // Should cap at 500ms, not 10000ms
    await vi.advanceTimersByTimeAsync(500)
    expect(operation).toHaveBeenCalledTimes(2)

    const result = await promise
    expect(result.data).toEqual({ id: '1' })
  })
})

describe('withRetrySimple', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it('returns data on success', async () => {
    const operation = vi.fn().mockResolvedValue({ id: '1' })

    const promise = withRetrySimple(operation)
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.data).toEqual({ id: '1' })
    expect(result.error).toBeNull()
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('retries on thrown errors', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValueOnce({ id: '1' })

    const promise = withRetrySimple(operation, { maxAttempts: 3 })
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.data).toEqual({ id: '1' })
    expect(result.error).toBeNull()
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it('returns error after max attempts', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('network error'))

    const promise = withRetrySimple(operation, { maxAttempts: 2 })
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.data).toBeNull()
    expect(result.error).toBeTruthy()
    expect(operation).toHaveBeenCalledTimes(2)
  })
})
