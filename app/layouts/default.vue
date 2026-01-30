<script setup lang="ts">
const appConfig = useAppConfig();
const route = useRoute();
const supabase = useSupabaseClient();
const toast = useToast();
const colorMode = useColorMode();

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (value: boolean) => {
    colorMode.preference = value ? 'dark' : 'light';
  },
});

const user = useSupabaseUser();

const userInitials = computed(() => {
  const email = user.value?.email || '';
  const name = user.value?.user_metadata?.full_name || email;
  if (!name) return 'U';
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
});

const userDisplayName = computed(() => {
  return user.value?.user_metadata?.full_name || user.value?.email || 'User';
});

const isMobileMenuOpen = ref(false);

watch(() => route.path, () => {
  isMobileMenuOpen.value = false;
});

const userMenuItems = computed(() => [
  [
    {
      label: userDisplayName.value,
      slot: 'account' as const,
      disabled: true,
    },
  ],
  [
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      to: '/settings',
    },
  ],
  [
    {
      label: isDark.value ? 'Light mode' : 'Dark mode',
      icon: isDark.value ? 'i-lucide-sun' : 'i-lucide-moon',
      onSelect() {
        isDark.value = !isDark.value;
      },
    },
  ],
  [
    {
      label: 'Log out',
      icon: 'i-lucide-log-out',
      color: 'error' as const,
      onSelect: signOut,
    },
  ],
]);

const items = computed(() => [
  {
    label: 'Today',
    to: '/dashboard',
    icon: 'i-lucide-calendar',
  },
  {
    label: 'Analytics',
    to: '/analytics',
    icon: 'i-lucide-bar-chart-2',
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

const { secondsRemaining, isPaused } = import.meta.client
  ? useStintTimer()
  : { secondsRemaining: ref(0), isPaused: ref(true) };

if (import.meta.client) {
  useRealtimeSubscriptions();
}

const { data: activeStint } = import.meta.client
  ? useActiveStintQuery()
  : { data: ref(null) };

const formattedTime = computed(() => {
  const mins = Math.floor(secondsRemaining.value / 60);
  const secs = secondsRemaining.value % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
});
</script>

<template>
  <div class="min-h-screen bg-[#fffbf5] dark:bg-stone-900">
    <!-- Header wrapper for mobile nav positioning -->
    <div class="relative sticky top-0 z-50 border-b border-stone-200 dark:border-stone-700/50 bg-[#fffbf5]/80 dark:bg-stone-900/80 backdrop-blur-md supports-[backdrop-filter]:bg-[#fffbf5]/60 dark:supports-[backdrop-filter]:bg-stone-900/60">
      <header class="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8 max-w-(--ui-container) mx-auto w-full">
        <!-- Header Left: Hamburger + Logo -->
        <div class="flex items-center gap-3">
          <!-- Mobile Hamburger Button -->
          <button
            class="md:hidden w-11 h-11 flex items-center justify-center rounded-xl
                   text-stone-600 dark:text-stone-400
                   hover:text-stone-900 dark:hover:text-white hover:bg-[#fef7ed] dark:hover:bg-[#1f1b18]
                   transition-colors"
            aria-label="Toggle menu"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
          >
            <UIcon
              :name="isMobileMenuOpen ? 'i-lucide-x' : 'i-lucide-menu'"
              class="w-6 h-6"
            />
          </button>

          <!-- Logo -->
          <div
            class="flex items-center group cursor-pointer"
            @click="navigateTo('/')"
          >
            <h1 class="text-xl md:text-2xl font-semibold tracking-tight font-serif">
              <span class="text-stone-900 dark:text-white">Life</span><span class="text-orange-600 dark:text-orange-500 italic">Stint</span>
            </h1>
          </div>
        </div>

        <!-- Desktop Navigation -->
        <UNavigationMenu
          :items="items"
          variant="pill"
          class="hidden md:flex"
          :ui="{
            root: 'bg-[#fef7ed] dark:bg-[#1f1b18] p-1 rounded-full gap-1',
            link: 'px-5 py-2.5 text-sm font-medium rounded-full text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all duration-200 data-[state=active]:bg-orange-700 dark:data-[state=active]:bg-orange-600 data-[state=active]:text-white',
          }"
        />

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

          <!-- User Dropdown Menu -->
          <UDropdownMenu
            :items="userMenuItems"
            :content="{ align: 'end' }"
            :ui="{ content: 'w-56' }"
          >
            <button
              class="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full
                     bg-gradient-to-br from-orange-700 to-amber-600 dark:from-orange-600 dark:to-amber-400
                     text-white font-semibold text-sm flex items-center justify-center
                     hover:scale-105 transition-transform"
              aria-label="User menu"
            >
              {{ userInitials }}
            </button>
          </UDropdownMenu>
        </div>
      </header>

      <!-- Mobile Navigation Drawer -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <nav
          v-if="isMobileMenuOpen"
          class="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-stone-900
                 border-b border-stone-200 dark:border-stone-700 shadow-lg p-2"
        >
          <UNavigationMenu
            :items="items"
            orientation="vertical"
            variant="pill"
            :highlight="false"
            :ui="{
              root: 'w-full',
              link: 'px-4 py-3.5 rounded-xl text-[15px] font-medium transition-colors text-stone-600 dark:text-stone-300 hover:bg-[#fef7ed] dark:hover:bg-[#1f1b18] hover:text-stone-900 dark:hover:text-white data-[state=active]:bg-[#fef7ed] dark:data-[state=active]:bg-[#1f1b18] data-[state=active]:text-orange-700 dark:data-[state=active]:text-orange-500',
              linkLeadingIcon: 'w-5 h-5',
            }"
          />
        </nav>
      </Transition>
    </div>

    <UMain>
      <slot />
    </UMain>
  </div>
</template>
