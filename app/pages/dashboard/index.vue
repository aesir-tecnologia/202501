<template>
  <div class="min-h-screen bg-gray-50 py-16 px-4 transition-colors duration-200 dark:bg-gray-950">
    <div class="max-w-3xl mx-auto space-y-8 text-gray-900 dark:text-gray-100">
      <div class="text-center space-y-3">
        <p class="text-sm font-medium text-primary-600 dark:text-primary-400">
          Dashboard
        </p>
        <h1 class="text-4xl font-bold">
          Welcome back, {{ displayName }}
        </h1>
        <p class="text-base text-gray-600 dark:text-gray-300">
          This is your starting point for tracking focus sessions and productivity insights.
        </p>
      </div>

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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const user = useSupabaseUser()

const displayName = computed(() => {
  return user.value?.user_metadata?.full_name || user.value?.email || 'there'
})

definePageMeta({
  middleware: 'auth',
  title: 'Dashboard',
})

useSeoMeta({
  title: 'Dashboard - LifeStint',
  description: 'Review your focus progress and personalized insights.',
})
</script>
