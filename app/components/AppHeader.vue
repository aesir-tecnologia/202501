<script setup lang="ts">
const { user, userProfile, userInitials, signOut } = useAuth()
const colorMode = useColorMode()
const router = useRouter()

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (value) => {
    colorMode.preference = value ? 'dark' : 'light'
  },
})

async function handleSignOut() {
  try {
    await signOut()
  }
  catch (error) {
    console.error('Sign out error:', error)
  }
}

const userMenuItems = computed(() => [
  [
    {
      label: userProfile.value?.email || 'User',
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
</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-950/60">
    <UContainer class="flex h-14 items-center">
      <div class="mr-4 flex">
        <NuxtLink
          to="/"
          class="mr-6 flex items-center space-x-2"
        >
          <UIcon
            name="i-lucide-timer"
            class="h-6 w-6"
          />
          <span class="font-bold">LifeStint</span>
        </NuxtLink>

        <!-- Navigation -->
        <nav class="flex items-center space-x-6 text-sm font-medium">
          <NuxtLink
            to="/dashboard"
            class="transition-colors hover:text-gray-700 dark:hover:text-gray-300"
            active-class="text-gray-900 dark:text-gray-100"
            inactive-class="text-gray-600 dark:text-gray-400"
          >
            Dashboard
          </NuxtLink>
          <NuxtLink
            to="/projects"
            class="transition-colors hover:text-gray-700 dark:hover:text-gray-300"
            active-class="text-gray-900 dark:text-gray-100"
            inactive-class="text-gray-600 dark:text-gray-400"
          >
            Projects
          </NuxtLink>
          <NuxtLink
            to="/stints"
            class="transition-colors hover:text-gray-700 dark:hover:text-gray-300"
            active-class="text-gray-900 dark:text-gray-100"
            inactive-class="text-gray-600 dark:text-gray-400"
          >
            Stints
          </NuxtLink>
          <NuxtLink
            to="/analytics"
            class="transition-colors hover:text-gray-700 dark:hover:text-gray-300"
            active-class="text-gray-900 dark:text-gray-100"
            inactive-class="text-gray-600 dark:text-gray-400"
          >
            Analytics
          </NuxtLink>
        </nav>
      </div>

      <div class="flex flex-1 items-center justify-end space-x-2">
        <!-- Connection Status -->
        <ConnectionStatus />

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
            :alt="userProfile?.email || 'User'"
            :src="userProfile?.avatarUrl"
            size="sm"
            class="cursor-pointer"
          >
            <template #fallback>
              <span class="text-xs font-semibold">{{ userInitials }}</span>
            </template>
          </UAvatar>

          <template #account>
            <div class="text-left">
              <p
                v-if="userProfile?.fullName"
                class="font-medium text-sm"
              >
                {{ userProfile.fullName }}
              </p>
              <p class="truncate text-xs text-gray-600 dark:text-gray-400">
                {{ userProfile?.email }}
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
    </UContainer>
  </header>
</template>

