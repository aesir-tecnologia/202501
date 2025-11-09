<script setup lang="ts">
import type { NavigationMenuItem } from '#ui/components/NavigationMenu.vue';

const appConfig = useAppConfig();
const route = useRoute();
const supabase = useSupabaseClient();
const toast = useToast();

const items = computed<NavigationMenuItem[]>(() => [{
  label: 'Dashboard',
  to: '/dashboard',
  active: route.path.startsWith('/dashboard'),
}]);

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

const { showConflictModal, conflictData, dismissConflict } = useStintRealtime();

useStintTimer();

function handleConflictResolved() {
  dismissConflict();
}
</script>

<template>
  <div>
    <UHeader to="/dashboard">
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

    <UMain>
      <slot />
    </UMain>

    <StintConflictModal
      v-if="showConflictModal && conflictData"
      v-model:open="showConflictModal"
      :current-stint="conflictData.currentStint"
      :new-stint="conflictData.newStint"
      @dismiss="dismissConflict"
      @resolved="handleConflictResolved"
    />
  </div>
</template>
