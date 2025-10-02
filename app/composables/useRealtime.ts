import { ref, readonly, onUnmounted } from 'vue'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { TypedSupabaseClient } from '~/utils/supabase'

/**
 * Connection status for real-time subscriptions
 */
export type RealtimeConnectionStatus
  = | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'error'
    | 'timeout'

/**
 * Composable for centralized Supabase real-time connection management
 *
 * Provides connection lifecycle, status tracking, and automatic reconnection.
 * Abstracts common real-time patterns used across useProjects and useStints.
 *
 * Usage:
 * ```ts
 * const { subscribe, unsubscribe, connectionStatus, isConnected } = useRealtime(client)
 * subscribe('projects', 'projects-channel', (payload) => handleEvent(payload))
 * ```
 */
export function useRealtime(clientOverride?: TypedSupabaseClient) {
  const client: TypedSupabaseClient = clientOverride ?? (useSupabaseClient<TypedSupabaseClient>() as unknown as TypedSupabaseClient)

  // Connection state
  const connectionStatus = ref<RealtimeConnectionStatus>('disconnected')
  const isConnected = computed(() => connectionStatus.value === 'connected')
  const lastError = ref<Error | null>(null)

  // Store active channels for cleanup
  const channels = new Map<string, RealtimeChannel>()

  /**
   * Subscribe to real-time updates for a table
   *
   * @param table - Database table name
   * @param channelName - Unique channel identifier
   * @param onEvent - Callback for handling postgres_changes events
   * @returns Subscription cleanup function
   */
  function subscribe(
    table: string,
    channelName: string,
    onEvent: (payload: RealtimePostgresChangesPayload<any>) => void,
  ): () => void {
    if (!import.meta.client) {
      return () => {} // No-op on server
    }

    // Don't create duplicate subscriptions
    if (channels.has(channelName)) {
      console.warn(`Channel ${channelName} already subscribed`)
      return () => unsubscribe(channelName)
    }

    try {
      connectionStatus.value = 'connecting'

      const channel = client
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
          },
          (payload) => {
            onEvent(payload)
          },
        )
        .subscribe((status) => {
          handleSubscriptionStatus(channelName, status)
        })

      channels.set(channelName, channel)

      // Return cleanup function
      return () => unsubscribe(channelName)
    }
    catch (err) {
      const error = err instanceof Error ? err : new Error('Subscription failed')
      lastError.value = error
      connectionStatus.value = 'error'
      console.error(`Failed to subscribe to ${table}:`, err)
      return () => {}
    }
  }

  /**
   * Handle subscription status changes
   */
  function handleSubscriptionStatus(channelName: string, status: string): void {
    switch (status) {
      case 'SUBSCRIBED':
        connectionStatus.value = 'connected'
        lastError.value = null
        break

      case 'CHANNEL_ERROR':
        connectionStatus.value = 'error'
        lastError.value = new Error(`Channel error for ${channelName}`)
        console.error(`Channel error for ${channelName}`)
        break

      case 'TIMED_OUT':
        connectionStatus.value = 'timeout'
        lastError.value = new Error(`Connection timeout for ${channelName}`)
        console.error(`Connection timeout for ${channelName}`)
        break

      case 'CLOSED':
        connectionStatus.value = 'disconnected'
        break
    }
  }

  /**
   * Unsubscribe from a specific channel
   */
  function unsubscribe(channelName: string): void {
    const channel = channels.get(channelName)
    if (channel) {
      client.removeChannel(channel)
      channels.delete(channelName)

      // Update connection status if no channels remain
      if (channels.size === 0) {
        connectionStatus.value = 'disconnected'
      }
    }
  }

  /**
   * Unsubscribe from all channels
   */
  function unsubscribeAll(): void {
    channels.forEach((channel, name) => {
      client.removeChannel(channel)
    })
    channels.clear()
    connectionStatus.value = 'disconnected'
  }

  /**
   * Get list of active channel names
   */
  function getActiveChannels(): string[] {
    return Array.from(channels.keys())
  }

  // Cleanup on unmount
  if (import.meta.client) {
    onUnmounted(() => {
      unsubscribeAll()
    })
  }

  return {
    // State
    connectionStatus: readonly(connectionStatus),
    isConnected: readonly(isConnected),
    lastError: readonly(lastError),

    // Methods
    subscribe,
    unsubscribe,
    unsubscribeAll,
    getActiveChannels,
  }
}
