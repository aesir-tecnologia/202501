<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const colorMode = useColorMode()
const router = useRouter()

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (value) => {
    colorMode.preference = value ? 'dark' : 'light'
  },
})

async function handleSignOut() {
  await supabase.auth.signOut()
  router.push('/auth/login')
}

const userMenuItems = computed(() => [
  [
    {
      label: user.value?.email || 'User',
      slot: 'account',
      disabled: true,
    },
  ],
  [
    {
      label: 'Profile',
      icon: 'i-lucide-user',
      click: () => router.push('/profile'),
    },
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      click: () => router.push('/settings'),
    },
  ],
  [
    {
      label: 'Sign Out',
      icon: 'i-lucide-log-out',
      click: handleSignOut,
    },
  ],
])

const userInitials = computed(() => {
  if (!user.value?.email)
    return 'U'
  return user.value.email.substring(0, 2).toUpperCase()
})
</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container flex h-14 items-center">
      <div class="mr-4 flex">
        <NuxtLink to="/" class="mr-6 flex items-center space-x-2">
          <UIcon name="i-lucide-timer" class="h-6 w-6" />
          <span class="font-bold">LifeStint</span>
        </NuxtLink>

        <!-- Navigation -->
        <nav class="flex items-center space-x-6 text-sm font-medium">
          <NuxtLink
            to="/dashboard"
            class="transition-colors hover:text-foreground/80"
            active-class="text-foreground"
            inactive-class="text-foreground/60"
          >
            Dashboard
          </NuxtLink>
          <NuxtLink
            to="/projects"
            class="transition-colors hover:text-foreground/80"
            active-class="text-foreground"
            inactive-class="text-foreground/60"
          >
            Projects
          </NuxtLink>
          <NuxtLink
            to="/stints"
            class="transition-colors hover:text-foreground/80"
            active-class="text-foreground"
            inactive-class="text-foreground/60"
          >
            Stints
          </NuxtLink>
        </nav>
      </div>

      <div class="flex flex-1 items-center justify-end space-x-2">
        <!-- Theme Toggle -->
        <UButton
          :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
          color="gray"
          variant="ghost"
          size="sm"
          @click="isDark = !isDark"
        />

        <!-- User Menu -->
        <UDropdown
          v-if="user"
          :items="userMenuItems"
          :popper="{ placement: 'bottom-end' }"
        >
          <UAvatar
            :alt="user.email || 'User'"
            size="sm"
            class="cursor-pointer"
          >
            <template #fallback>
              <span class="text-xs font-semibold">{{ userInitials }}</span>
            </template>
          </UAvatar>

          <template #account>
            <div class="text-left">
              <p class="truncate font-medium text-sm">
                {{ user.email }}
              </p>
            </div>
          </template>
        </UDropdown>

        <!-- Sign In Button (if not authenticated) -->
        <UButton
          v-else
          to="/auth/login"
          color="primary"
          size="sm"
        >
          Sign In
        </UButton>
      </div>
    </div>
  </header>
</template>

<style scoped>
.container {
  @apply max-w-screen-2xl mx-auto px-4;
}

.bg-background {
  @apply bg-white dark:bg-gray-950;
}

.text-foreground {
  @apply text-gray-900 dark:text-gray-100;
}

.text-foreground\/60 {
  @apply text-gray-600 dark:text-gray-400;
}

.text-foreground\/80 {
  @apply text-gray-700 dark:text-gray-300;
}

.border-b {
  @apply border-gray-200 dark:border-gray-800;
}
</style>
