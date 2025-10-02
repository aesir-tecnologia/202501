/**
 * Composable for managing stint-related browser notifications
 *
 * Handles notification permissions, displays 5-minute warnings and completion alerts.
 * Falls back to toast notifications when browser notifications are unavailable.
 *
 * Usage:
 * ```ts
 * const { requestPermission, showWarning, showCompletion } = useStintNotifications()
 * await requestPermission()
 * ```
 */
export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  requireInteraction?: boolean
  silent?: boolean
}

export function useStintNotifications() {
  const toast = useToast()
  const hasPermission = ref(false)
  const permissionStatus = ref<NotificationPermission>('default')

  /**
   * Check if notifications are supported in this browser
   */
  const isNotificationSupported = computed(() => {
    return import.meta.client && 'Notification' in window
  })

  /**
   * Request notification permission from user
   */
  async function requestPermission(): Promise<boolean> {
    if (!isNotificationSupported.value) {
      console.warn('Notifications not supported in this browser')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      permissionStatus.value = permission
      hasPermission.value = permission === 'granted'
      return hasPermission.value
    }
    catch (err) {
      console.error('Failed to request notification permission:', err)
      return false
    }
  }

  /**
   * Check current permission status
   */
  function checkPermission(): void {
    if (!isNotificationSupported.value)
      return

    permissionStatus.value = Notification.permission
    hasPermission.value = Notification.permission === 'granted'
  }

  /**
   * Show browser notification or fallback to toast
   */
  function showNotification(options: NotificationOptions): void {
    if (hasPermission.value && isNotificationSupported.value) {
      try {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon ?? '/icon.png',
          badge: options.badge ?? '/icon.png',
          requireInteraction: options.requireInteraction ?? false,
          silent: options.silent ?? false,
          tag: 'stint-notification',
        })

        // Focus window when notification is clicked
        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      }
      catch (err) {
        console.error('Failed to show notification:', err)
        // Fallback to toast
        showToastFallback(options)
      }
    }
    else {
      // Fallback to toast
      showToastFallback(options)
    }
  }

  /**
   * Show toast notification as fallback
   */
  function showToastFallback(options: NotificationOptions): void {
    toast.add({
      title: options.title,
      description: options.body,
      color: 'primary',
      timeout: options.requireInteraction ? 0 : 5000,
    })
  }

  /**
   * Show 5-minute warning notification
   */
  function showWarning(projectName?: string): void {
    showNotification({
      title: '⏰ 5 Minutes Remaining',
      body: projectName
        ? `Your stint on "${projectName}" will complete in 5 minutes.`
        : 'Your stint will complete in 5 minutes.',
      requireInteraction: false,
      silent: false,
    })
  }

  /**
   * Show stint completion notification
   */
  function showCompletion(projectName?: string, durationMinutes?: number): void {
    showNotification({
      title: '✅ Stint Complete',
      body: projectName
        ? `Your ${durationMinutes ? `${durationMinutes}-minute ` : ''}stint on "${projectName}" is complete!`
        : `Your ${durationMinutes ? `${durationMinutes}-minute ` : ''}stint is complete!`,
      requireInteraction: true,
      silent: false,
    })
  }

  /**
   * Show stint started notification
   */
  function showStarted(projectName: string): void {
    showNotification({
      title: '▶️ Stint Started',
      body: `Working on "${projectName}"`,
      requireInteraction: false,
      silent: true,
    })
  }

  /**
   * Show stint paused notification
   */
  function showPaused(projectName: string, elapsedMinutes: number): void {
    showNotification({
      title: '⏸️ Stint Paused',
      body: `"${projectName}" paused after ${elapsedMinutes} minute${elapsedMinutes !== 1 ? 's' : ''}`,
      requireInteraction: false,
      silent: true,
    })
  }

  // Check permission on mount
  if (import.meta.client) {
    onMounted(() => {
      checkPermission()

      // Listen for custom events from timer worker
      window.addEventListener('stint:warning', ((e: CustomEvent) => {
        const activeStint = useState<any>('activeStint')
        const projectName = activeStint.value?.project?.name
        showWarning(projectName)
      }) as EventListener)

      window.addEventListener('stint:complete', ((e: CustomEvent) => {
        const activeStint = useState<any>('activeStint')
        const projectName = activeStint.value?.project?.name
        const elapsedMinutes = e.detail?.elapsed
          ? Math.floor(e.detail.elapsed / 60)
          : undefined
        showCompletion(projectName, elapsedMinutes)
      }) as EventListener)
    })
  }

  return {
    // State
    hasPermission: readonly(hasPermission),
    permissionStatus: readonly(permissionStatus),
    isNotificationSupported: readonly(isNotificationSupported),

    // Methods
    requestPermission,
    checkPermission,
    showNotification,
    showWarning,
    showCompletion,
    showStarted,
    showPaused,
  }
}
