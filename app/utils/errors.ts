import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Structured error types for consistent error handling across the app
 */

export enum ErrorCategory {
  Network = 'network',
  Authentication = 'authentication',
  Authorization = 'authorization',
  Validation = 'validation',
  Database = 'database',
  Unknown = 'unknown',
}

export interface AppError {
  category: ErrorCategory
  message: string
  userMessage: string
  originalError?: Error | PostgrestError
  retryable: boolean
  statusCode?: number
}

/**
 * Maps Supabase/Postgrest errors to structured AppError
 */
export function categorizeError(error: Error | PostgrestError | null | undefined): AppError {
  if (!error) {
    return {
      category: ErrorCategory.Unknown,
      message: 'An unknown error occurred',
      userMessage: 'Something went wrong. Please try again.',
      retryable: true,
    }
  }

  const errorMessage = error.message || 'Unknown error'
  const postgrestError = error as PostgrestError

  // Network errors
  if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
    return {
      category: ErrorCategory.Network,
      message: errorMessage,
      userMessage: 'Network connection issue. Please check your connection and try again.',
      originalError: error,
      retryable: true,
    }
  }

  // Authentication errors
  if (errorMessage.includes('authenticated') || errorMessage.includes('JWT') || postgrestError.code === 'PGRST301') {
    return {
      category: ErrorCategory.Authentication,
      message: errorMessage,
      userMessage: 'Please sign in to continue.',
      originalError: error,
      retryable: false,
      statusCode: 401,
    }
  }

  // Authorization/RLS errors
  if (errorMessage.includes('access denied') || errorMessage.includes('permission') || postgrestError.code === 'PGRST116') {
    return {
      category: ErrorCategory.Authorization,
      message: errorMessage,
      userMessage: 'You do not have permission to perform this action.',
      originalError: error,
      retryable: false,
      statusCode: 403,
    }
  }

  // Validation errors
  if (errorMessage.includes('violates') || errorMessage.includes('constraint') || errorMessage.includes('must be') || errorMessage.includes('invalid') || postgrestError.code?.startsWith('23')) {
    return {
      category: ErrorCategory.Validation,
      message: errorMessage,
      userMessage: extractValidationMessage(errorMessage),
      originalError: error,
      retryable: false,
      statusCode: 400,
    }
  }

  // Rate limiting
  if (errorMessage.includes('rate limit') || postgrestError.code === '429') {
    return {
      category: ErrorCategory.Network,
      message: errorMessage,
      userMessage: 'Too many requests. Please wait a moment and try again.',
      originalError: error,
      retryable: true,
      statusCode: 429,
    }
  }

  // Database errors
  if (postgrestError.code?.startsWith('P') || postgrestError.code?.startsWith('42')) {
    return {
      category: ErrorCategory.Database,
      message: errorMessage,
      userMessage: 'A database error occurred. Please try again.',
      originalError: error,
      retryable: false,
      statusCode: 500,
    }
  }

  // Default unknown error
  return {
    category: ErrorCategory.Unknown,
    message: errorMessage,
    userMessage: 'An unexpected error occurred. Please try again.',
    originalError: error,
    retryable: true,
  }
}

/**
 * Extracts user-friendly message from validation errors
 */
function extractValidationMessage(errorMessage: string): string {
  // Duration constraints - check for actual constraint message from DB/schema
  if (errorMessage.toLowerCase().includes('at least') && errorMessage.toLowerCase().includes('minute')) {
    return 'Stint duration must be at least 5 minutes.'
  }
  if (errorMessage.toLowerCase().includes('exceed') && errorMessage.toLowerCase().includes('hour')) {
    return 'Stint duration cannot exceed 12 hours.'
  }
  if (errorMessage.toLowerCase().includes('duration must be at least')) {
    return errorMessage // Use the actual validation message
  }

  // Unique constraints
  if (errorMessage.includes('unique') && errorMessage.includes('name')) {
    return 'A project with this name already exists.'
  }

  // Foreign key constraints
  if (errorMessage.includes('foreign key') || errorMessage.includes('does not exist')) {
    return 'The referenced item no longer exists.'
  }

  // Generic validation
  return 'The provided data is invalid. Please check your input and try again.'
}

/**
 * Checks if an error is retryable based on its category
 */
export function isRetryableError(error: AppError): boolean {
  return error.retryable && (
    error.category === ErrorCategory.Network
    || error.statusCode === 429
    || error.statusCode === 503
    || error.statusCode === 504
  )
}

/**
 * Format error for logging/debugging
 */
export function formatErrorForLogging(error: AppError): string {
  return `[${error.category.toUpperCase()}] ${error.message}${error.statusCode ? ` (${error.statusCode})` : ''}`
}
