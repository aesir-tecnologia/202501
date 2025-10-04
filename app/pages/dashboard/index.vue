<script setup lang="ts">
import { computed } from 'vue'

const user = useSupabaseUser()

const displayName = computed(() => {
  return user.value?.user_metadata?.full_name || user.value?.email || 'there'
})

definePageMeta({
  title: 'Dashboard',
  middleware: 'auth',
})

useSeoMeta({
  title: 'Dashboard - LifeStint',
  description: 'Review your focus progress and personalized insights.',
})
</script>

<template>
  <UContainer>
    <UPageHeader
      headline="Dashboard"
      :title="`Welcome back, ${displayName}`"
      description="This is your starting point for tracking focus sessions and productivity insights."
    />

    <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
      <div class="space-y-4">
        <h2 class="text-xl font-semibold">
          Account Overview
        </h2>
        <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li>
            <span class="font-medium text-gray-900 dark:text-gray-100">Email:</span>
            {{ user?.email }}
          </li>
          <li>
            <span class="font-medium text-gray-900 dark:text-gray-100">Full Name:</span>
            {{ user?.user_metadata?.full_name || 'Not provided' }}
          </li>
        </ul>
      </div>
    </UCard>
  </UContainer>
</template>
