<script setup lang="ts">
const appConfig = useAppConfig();
const route = useRoute();
const supabase = useSupabaseClient();
const toast = useToast();
const colorMode = useColorMode();

const isDark = computed(() => colorMode.value === 'dark');

function toggleDarkMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
}

const items = computed(() => [
  {
    label: 'Dashboard',
    to: '/dashboard',
    active: route.path === '/dashboard',
  },
  {
    label: 'Analytics',
    to: '/analytics',
    active: route.path === '/analytics',
  },
  {
    label: 'Reports',
    to: '/reports',
    active: route.path === '/reports',
  },
  {
    label: 'Settings',
    to: '/settings',
    active: route.path === '/settings',
  },
]);

const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    toast.add({
      title: 'Sign out failed',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
    return;
  }

  navigateTo(appConfig.auth.home);
};

const { secondsRemaining, isPaused } = useStintTimer();
const { data: activeStint } = useActiveStintQuery();

const formattedTime = computed(() => {
  const mins = Math.floor(secondsRemaining.value / 60);
  const secs = secondsRemaining.value % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
});
</script>

<template>
  <div>
    <header class="flex items-center justify-between px-6 lg:px-10 py-4 border-b border-stone-200 dark:border-stone-700/50 bg-[#fffbf5]/80 dark:bg-stone-900/80 backdrop-blur-md sticky top-0 z-50 supports-[backdrop-filter]:bg-[#fffbf5]/60 dark:supports-[backdrop-filter]:bg-stone-900/60">
      <div
        class="flex items-center gap-3 group cursor-pointer"
        @click="navigateTo('/')"
      >
        <h1 class="text-xl font-bold text-stone-900 dark:text-white tracking-tight font-serif">
          LifeStint
        </h1>
      </div>

      <nav class="hidden md:flex items-center gap-1 bg-stone-100/50 dark:bg-stone-800/40 p-1.5 rounded-full border border-stone-200 dark:border-stone-700/50 shadow-inner relative">
        <div
          v-for="item in items"
          :key="item.to"
          class="relative z-10"
        >
          <NuxtLink
            :to="item.to"
            class="px-5 py-1.5 text-sm font-medium rounded-full transition-colors duration-300 block relative"
            :class="[
              item.active
                ? 'text-orange-700 dark:text-white'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white',
            ]"
          >
            {{ item.label }}
            <span
              v-if="item.active"
              class="absolute inset-0 bg-orange-50 dark:bg-orange-500/20 rounded-full shadow-sm ring-1 ring-orange-100 dark:ring-orange-500/30 -z-10"
              style="view-transition-name: nav-item-active"
            />
          </NuxtLink>
        </div>
      </nav>

      <div class="flex items-center gap-3">
        <!-- Global Timer (client-only to prevent hydration mismatch) -->
        <ClientOnly>
          <div
            v-if="activeStint && activeStint.status !== 'completed'"
            class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300"
            :class="isPaused
              ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400'
              : 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 shadow-[0_0_10px_rgba(22,163,74,0.2)]'"
          >
            <div
              v-if="!isPaused"
              class="relative flex h-2 w-2 mr-0.5"
            >
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </div>
            <UIcon
              :name="isPaused ? 'i-lucide-pause' : 'i-lucide-clock'"
              class="w-4 h-4"
            />
            <span class="font-mono font-bold tabular-nums text-sm">{{ formattedTime }}</span>
          </div>
        </ClientOnly>

        <div class="h-6 w-px bg-stone-200 dark:bg-stone-700 mx-2 hidden sm:block" />
        <button
          class="text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors p-2.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center"
          aria-label="Toggle dark mode"
          @click="toggleDarkMode"
        >
          <UIcon
            :name="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
            class="w-[18px] h-[18px]"
          />
        </button>
        <button
          aria-label="Sign out"
          class="text-stone-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2.5 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center"
          @click="signOut"
        >
          <UIcon
            name="i-lucide-log-out"
            class="w-[18px] h-[18px]"
          />
        </button>
        <div class="hidden sm:block">
          <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-green-500 ring-2 ring-white/10 cursor-pointer" />
        </div>
      </div>
    </header>

    <UMain class="pt-6">
      <slot />
    </UMain>
  </div>
</template>
