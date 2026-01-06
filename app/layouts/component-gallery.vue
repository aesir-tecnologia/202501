<script setup lang="ts">
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === 'dark');

function toggleDarkMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
}
</script>

<template>
  <div class="min-h-screen bg-[#fffbf5] dark:bg-stone-900 text-stone-800 dark:text-stone-50">
    <!-- Minimal Header -->
    <header class="sticky top-0 z-50 backdrop-blur-md bg-[#fffbf5]/80 dark:bg-stone-900/80 border-b border-stone-200 dark:border-stone-700/50">
      <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/"
            class="flex items-center gap-2 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors"
          >
            <UIcon
              name="i-lucide-arrow-left"
              class="w-5 h-5"
            />
            <span class="text-sm font-medium">Back</span>
          </NuxtLink>
          <div class="h-6 w-px bg-stone-200 dark:bg-stone-700" />
          <h1 class="text-xl font-bold font-serif text-stone-900 dark:text-white">
            Component Gallery
          </h1>
        </div>

        <button
          class="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label="Toggle dark mode"
          @click="toggleDarkMode"
        >
          <UIcon
            :name="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
            class="w-5 h-5 text-stone-500 dark:text-stone-400"
          />
        </button>
      </div>
    </header>

    <main>
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-stone-200 dark:border-stone-700 mt-16">
      <div class="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-stone-500 dark:text-stone-400">
        <p>
          LifeStint Component Gallery — A visual reference for all Vue components
        </p>
      </div>
    </footer>
  </div>
</template>
