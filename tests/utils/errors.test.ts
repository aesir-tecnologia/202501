import { describe, it, expect } from 'vitest'
import { categorizeError, ErrorCategory, isRetryableError, formatErrorForLogging } from '~/utils/errors'

describe('categorizeError', () => {
  it('categorizes network errors', () => {
    const error = new Error('Failed to fetch')
    const result = categorizeError(error)

    expect(result.category).toBe(ErrorCategory.Network)
    expect(result.retryable).toBe(true)
    expect(result.userMessage).toContain('connection')
  })

  it('categorizes authentication errors', () => {
    const error = new Error('User must be authenticated')
    const result = categorizeError(error)

    expect(result.category).toBe(ErrorCategory.Authentication)
    expect(result.retryable).toBe(false)
    expect(result.statusCode).toBe(401)
  })

  it('categorizes authorization errors', () => {
    const error = { code: 'PGRST116', message: 'permission denied' } as any
    const result = categorizeError(error)

    expect(result.category).toBe(ErrorCategory.Authorization)
    expect(result.retryable).toBe(false)
    expect(result.statusCode).toBe(403)
  })

  it('categorizes validation errors', () => {
    const error = new Error('violates check constraint')
    const result = categorizeError(error)

    expect(result.category).toBe(ErrorCategory.Validation)
    expect(result.retryable).toBe(false)
    expect(result.statusCode).toBe(400)
  })

  it('categorizes rate limit errors as retryable', () => {
    const error = new Error('rate limit exceeded')
    const result = categorizeError(error)

    expect(result.category).toBe(ErrorCategory.Network)
    expect(result.retryable).toBe(true)
    expect(result.statusCode).toBe(429)
  })

  it('handles null/undefined errors', () => {
    const result = categorizeError(null)

    expect(result.category).toBe(ErrorCategory.Unknown)
    expect(result.retryable).toBe(true)
  })

  it('extracts duration validation messages', () => {
    const error = new Error('duration must be at least 5 minutes')
    const result = categorizeError(error)

    expect(result.userMessage).toContain('at least 5 minutes')
  })
})

describe('isRetryableError', () => {
  it('returns true for network errors', () => {
    const error = categorizeError(new Error('network error'))
    expect(isRetryableError(error)).toBe(true)
  })

  it('returns false for authentication errors', () => {
    const error = categorizeError(new Error('not authenticated'))
    expect(isRetryableError(error)).toBe(false)
  })

  it('returns true for rate limit errors', () => {
    const error = { ...categorizeError(new Error('test')), statusCode: 429, retryable: true }
    expect(isRetryableError(error)).toBe(true)
  })

  it('returns false for non-retryable categories', () => {
    const error = { ...categorizeError(new Error('test')), retryable: false }
    expect(isRetryableError(error)).toBe(false)
  })
})

describe('formatErrorForLogging', () => {
  it('formats error with status code', () => {
    const error = categorizeError(new Error('not authenticated'))
    const formatted = formatErrorForLogging(error)

    expect(formatted).toContain('AUTHENTICATION')
    expect(formatted).toContain('(401)')
  })

  it('formats error without status code', () => {
    const error = categorizeError(new Error('unknown error'))
    const formatted = formatErrorForLogging(error)

    expect(formatted).toContain('UNKNOWN')
    expect(formatted).not.toContain('(')
  })
})
