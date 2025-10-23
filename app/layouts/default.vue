<script setup lang="ts">
import type { NavigationMenuItem } from '#ui/components/NavigationMenu.vue'

const appConfig = useAppConfig()
const route = useRoute()
const supabase = useSupabaseClient()

const items = computed<NavigationMenuItem[]>(() => [{
  label: 'Dashboard',
  to: '/dashboard',
  active: route.path.startsWith('/dashboard'),
}, {
  label: 'Figma',
  to: 'https://go.nuxt.com/figma-ui',
  target: '_blank',
}, {
  label: 'Releases',
  to: 'https://github.com/nuxt/ui/releases',
  target: '_blank',
}])

const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    alert(error.message)
  }

  navigateTo(appConfig.auth.home)
}
</script>

<template>
  <UHeader to="/dashboard">
    <template #title>
      LifeStint
    </template>

    <UNavigationMenu :items="items" />

    <template #right>
      <UColorModeButton />
      <UButton
        icon="i-heroicons-arrow-right-start-on-rectangle"
        variant="ghost"
        color="neutral"
        @click="signOut"
      />
    </template>
  </UHeader>

  <UMain>
    <slot />
  </UMain>
</template>
