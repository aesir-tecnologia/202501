<script setup lang="ts">
import type { NavigationMenuItem } from '#ui/components/NavigationMenu.vue';

const appConfig = useAppConfig();
const route = useRoute();
const supabase = useSupabaseClient();
const toast = useToast();

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Dashboard',
    to: '/',
    active: route.path === '/' || route.path === '',
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

useStintTimer();
</script>

<template>
  <div>
    <UHeader to="/">
      <template #title>
        LifeStint
      </template>

      <UNavigationMenu :items="items" />

      <template #right>
        <UColorModeButton />
        <UButton
          icon="i-lucide-log-out"
          variant="ghost"
          color="neutral"
          @click="signOut"
        />
      </template>
    </UHeader>

    <UMain class="pt-6">
      <slot />
    </UMain>
  </div>
</template>
