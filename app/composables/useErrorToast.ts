import type { AppError } from '~/utils/errors'
import { ErrorCategory } from '~/utils/errors'

export interface ToastOptions {
  /**
   * Override the default message
   */
  message?: string

  /**
   * Toast duration in milliseconds
   */
  duration?: number

  /**
   * Show action button (e.g., "Retry")
   */
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * Composable for displaying error toasts with Nuxt UI
 *
 * Usage:
 * ```ts
 * const { showError, showSuccess, showInfo } = useErrorToast()
 *
 * // Show error from AppError
 * showError(error)
 *
 * // Show success message
 * showSuccess('Project created successfully')
 * ```
 */
export function useErrorToast() {
  const toast = useToast()

  function showError(error: AppError | string, options: ToastOptions = {}) {
    const message = typeof error === 'string'
      ? error
      : options.message || error.userMessage

    const errorObj = typeof error === 'string' ? null : error

    toast.add({
      id: `error-${Date.now()}`,
      title: getErrorTitle(errorObj),
      description: message,
      icon: getErrorIcon(errorObj),
      color: 'red',
      timeout: options.duration ?? 5000,
      actions: options.action
        ? [{
            label: options.action.label,
            click: options.action.onClick,
          }]
        : undefined,
    })

    // Log error for debugging
    if (errorObj) {
      console.error(`[${errorObj.category}]`, errorObj.message, errorObj.originalError)
    }
  }

  function showSuccess(message: string, options: Omit<ToastOptions, 'action'> = {}) {
    toast.add({
      id: `success-${Date.now()}`,
      title: 'Success',
      description: message,
      icon: 'i-lucide-check-circle',
      color: 'green',
      timeout: options.duration ?? 3000,
    })
  }

  function showInfo(message: string, options: ToastOptions = {}) {
    toast.add({
      id: `info-${Date.now()}`,
      title: 'Info',
      description: message,
      icon: 'i-lucide-info',
      color: 'blue',
      timeout: options.duration ?? 4000,
      actions: options.action
        ? [{
            label: options.action.label,
            click: options.action.onClick,
          }]
        : undefined,
    })
  }

  function showWarning(message: string, options: Omit<ToastOptions, 'action'> = {}) {
    toast.add({
      id: `warning-${Date.now()}`,
      title: 'Warning',
      description: message,
      icon: 'i-lucide-alert-triangle',
      color: 'yellow',
      timeout: options.duration ?? 4000,
    })
  }

  return {
    showError,
    showSuccess,
    showInfo,
    showWarning,
  }
}

function getErrorTitle(error: AppError | null): string {
  if (!error)
    return 'Error'

  switch (error.category) {
    case ErrorCategory.Network:
      return 'Connection Error'
    case ErrorCategory.Authentication:
      return 'Authentication Required'
    case ErrorCategory.Authorization:
      return 'Permission Denied'
    case ErrorCategory.Validation:
      return 'Validation Error'
    case ErrorCategory.Database:
      return 'Database Error'
    default:
      return 'Error'
  }
}

function getErrorIcon(error: AppError | null): string {
  if (!error)
    return 'i-lucide-x-circle'

  switch (error.category) {
    case ErrorCategory.Network:
      return 'i-lucide-wifi-off'
    case ErrorCategory.Authentication:
      return 'i-lucide-lock'
    case ErrorCategory.Authorization:
      return 'i-lucide-shield-alert'
    case ErrorCategory.Validation:
      return 'i-lucide-alert-circle'
    case ErrorCategory.Database:
      return 'i-lucide-database'
    default:
      return 'i-lucide-x-circle'
  }
}
