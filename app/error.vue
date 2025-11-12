<script setup lang="ts">
import type { NuxtError } from '#app'
import type { ButtonProps } from '#ui/types'

defineProps({
  error: Object as () => NuxtError,
})

const user = useAuthUser()

const clear: Partial<ButtonProps> = {
  size: 'lg',
  color: 'primary',
  variant: 'outline',
  label: user.value ? 'Back to Dashboard' : 'Back to home',
}

const redirect = '/'
</script>

<template>
  <UError
    :clear="clear"
    :error="error"
    :redirect="redirect"
  />
</template>
