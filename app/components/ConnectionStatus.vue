<script setup lang="ts">
import { useConnectionState } from '~/composables/useConnectionState'
import { useOfflineQueue } from '~/composables/useOfflineQueue'
import { useRealtime } from '~/composables/useRealtime'

const { isOnline } = useConnectionState()
const { pendingCount } = useOfflineQueue()
const { connectionStatus, isConnected } = useRealtime()

// Compute badge variant based on connection state
const statusVariant = computed(() => {
  if (!isOnline.value)
    return 'error'
  if (connectionStatus.value === 'connecting')
    return 'warning'
  if (isConnected.value)
    return 'success'
  return 'neutral'
})

// Compute status text
const statusText = computed(() => {
  if (!isOnline.value) {
    return pendingCount.value > 0
      ? `Offline (${pendingCount.value} pending)`
      : 'Offline'
  }
  if (connectionStatus.value === 'connecting')
    return 'Connecting...'
  if (isConnected.value)
    return 'Online'
  return 'Disconnected'
})

// Compute icon
const statusIcon = computed(() => {
  if (!isOnline.value)
    return 'i-lucide-wifi-off'
  if (connectionStatus.value === 'connecting')
    return 'i-lucide-loader-2'
  if (isConnected.value)
    return 'i-lucide-wifi'
  return 'i-lucide-wifi-off'
})

// Animation class for connecting state
const iconClass = computed(() => {
  return connectionStatus.value === 'connecting' ? 'animate-spin' : ''
})
</script>

<template>
  <UBadge
    :color="statusVariant"
    variant="subtle"
    size="sm"
    class="gap-1"
  >
    <UIcon
      :name="statusIcon"
      :class="iconClass"
      class="h-3 w-3"
    />
    <span class="text-xs">{{ statusText }}</span>
  </UBadge>
</template>
