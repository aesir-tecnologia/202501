<script setup lang="ts">
// This layout provides the main application structure with navigation
</script>

<template>
  <UApp>
    <AppHeader />

    <UMain>
      <UContainer class="py-8">
        <slot />
      </UContainer>
    </UMain>

    <!-- Footer -->
    <footer class="border-t border-gray-200 dark:border-gray-800 py-8">
      <UContainer>
        <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div>
            © {{ new Date().getFullYear() }} LifeStint. All rights reserved.
          </div>
          <div class="flex items-center gap-4">
            <NuxtLink
              to="/privacy"
              class="hover:text-gray-900 dark:hover:text-gray-100"
            >
              Privacy
            </NuxtLink>
            <NuxtLink
              to="/terms"
              class="hover:text-gray-900 dark:hover:text-gray-100"
            >
              Terms
            </NuxtLink>
          </div>
        </div>
      </UContainer>
    </footer>
  </UApp>
</template>
