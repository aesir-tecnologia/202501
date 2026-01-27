<script setup lang="ts">
import type { StintRow } from '~/lib/supabase/stints';
import type { ProjectRow } from '~/lib/supabase/projects';

interface DailyProgress {
  completed: number
  expected: number
}

interface Props {
  activeStint: StintRow | null
  activeProject: ProjectRow | null
  dailyProgress: DailyProgress
}

defineProps<Props>();

const emit = defineEmits<{
  pauseStint: [stint: StintRow]
  resumeStint: [stint: StintRow]
  completeStint: [stint: StintRow]
}>();

function handlePause(stint: StintRow) {
  emit('pauseStint', stint);
}

function handleResume(stint: StintRow) {
  emit('resumeStint', stint);
}

function handleComplete(stint: StintRow) {
  emit('completeStint', stint);
}
</script>

<template>
  <aside class="dashboard-sidebar">
    <!-- Timer Hero wrapper for grid animation -->
    <div
      class="hero-timer-row"
      :class="{ 'is-visible': activeStint }"
    >
      <div class="hero-timer-content">
        <DashboardTimerHero
          :active-stint="activeStint"
          :project="activeProject"
          :daily-progress="dailyProgress"
          @pause="handlePause"
          @resume="handleResume"
          @complete="handleComplete"
        />
      </div>
    </div>

    <!-- Achievement Card (self-contained, fetches own data) -->
    <AchievementCard />
  </aside>
</template>

<style scoped>
.dashboard-sidebar {
  display: grid;
  grid-template-rows: auto auto;
  gap: 16px;
}

@media (min-width: 1024px) {
  .dashboard-sidebar {
    gap: 24px;
    position: sticky;
    top: 100px;
  }
}

/* Hero timer row animation */
.hero-timer-row {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 500ms ease;
}

.hero-timer-row.is-visible {
  grid-template-rows: 1fr;
}

.hero-timer-content {
  overflow: hidden;
  min-height: 0;
}
</style>
