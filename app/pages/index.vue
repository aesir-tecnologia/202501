<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200 dark:bg-gray-950">
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-gray-900 dark:text-gray-100">
      <div class="text-center space-y-3">
        <h1 class="text-4xl font-bold">
          LifeStint
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-300">
          Focus tracking made simple
        </p>
      </div>

      <UCard class="p-8 space-y-6 bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
        <div class="space-y-4">
          <UButton
            to="/auth/login"
            size="lg"
            class="w-full"
            variant="solid"
            color="primary"
          >
            Sign In
          </UButton>

          <UButton
            to="/auth/register"
            size="lg"
            class="w-full"
            variant="outline"
            color="primary"
          >
            Create Account
          </UButton>
        </div>

        <div class="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Welcome to LifeStint - your personal focus tracking companion</p>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
// Page meta
definePageMeta({
  layout: false,
})

// SEO
useSeoMeta({
  title: 'LifeStint - Focus Tracking Made Simple',
  description: 'Track your focus sessions and boost productivity with LifeStint.',
})
</script>
