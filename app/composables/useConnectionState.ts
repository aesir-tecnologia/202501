/**
 * Composable for monitoring network connection state
 *
 * Provides reactive connection status and reconnection events
 *
 * Usage:
 * ```ts
 * const { isOnline, wasOffline, onReconnect } = useConnectionState()
 *
 * onReconnect(() => {
 *   console.log('Network reconnected, syncing...')
 * })
 * ```
 */
export function useConnectionState() {
  const isOnline = ref(true)
  const wasOffline = ref(false)
  const reconnectCallbacks = ref<Array<() => void>>([])

  // Initialize with current state
  if (import.meta.client) {
    isOnline.value = navigator.onLine
  }

  function handleOnline() {
    const previouslyOffline = !isOnline.value
    isOnline.value = true

    // Trigger reconnect callbacks if we were offline
    if (previouslyOffline) {
      wasOffline.value = false
      reconnectCallbacks.value.forEach(callback => callback())
    }
  }

  function handleOffline() {
    isOnline.value = false
    wasOffline.value = true
  }

  // Register event listeners on client
  if (import.meta.client) {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup on unmount
    onUnmounted(() => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    })
  }

  /**
   * Register a callback to run when connection is restored
   */
  function onReconnect(callback: () => void) {
    reconnectCallbacks.value.push(callback)

    // Return unregister function
    return () => {
      const index = reconnectCallbacks.value.indexOf(callback)
      if (index > -1) {
        reconnectCallbacks.value.splice(index, 1)
      }
    }
  }

  return {
    isOnline: readonly(isOnline),
    wasOffline: readonly(wasOffline),
    onReconnect,
  }
}
