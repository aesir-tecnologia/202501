<script setup lang="ts">
const route = useRoute()

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
</script>

<template>
  <UApp>
    <UHeader to="/dashboard">
      <template #title>
        LifeStint
      </template>

      <UNavigationMenu :items="items" />

      <template #right>
        <UColorModeButton />
      </template>
    </UHeader>

    <UMain>
      <slot />
    </UMain>
  </UApp>
</template>
