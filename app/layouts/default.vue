<script setup lang="ts">
import type { NavigationMenuItem } from '#ui/components/NavigationMenu.vue'

const appConfig = useAppConfig()
const route = useRoute()
const supabase = useSupabaseClient()

const items = computed<NavigationMenuItem[]>(() => [{
  label: 'Dashboard',
  to: '/dashboard',
  active: route.path.startsWith('/dashboard'),
}])

const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    alert(error.message)
  }

  navigateTo(appConfig.auth.home)
}

// Initialize real-time subscriptions for authenticated users
const { showConflictModal, conflictData, dismissConflict } = useStintRealtime()

// Initialize stint timer (singleton, auto-manages based on active stint)
useStintTimer()

function handleConflictResolved() {
  dismissConflict()
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

    <!-- Stint Conflict Resolution Modal -->
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
