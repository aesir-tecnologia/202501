<script setup lang="ts">
import type { StintRow } from '~/lib/supabase/stints';
import type { ProjectRow } from '~/lib/supabase/projects';

interface DailyProgress {
  completed: number
  expected: number
}

interface Props {
  activeStint: StintRow | null
  pausedStint: StintRow | null
  activeProject: ProjectRow | null
  dailyProgress: DailyProgress
  completedStints: number
  totalGoal: number
  focusMinutes: number
  bestBlockMinutes: number
  weeklyChange: number | null
  isLoadingStats?: boolean
}

withDefaults(defineProps<Props>(), {
  isLoadingStats: false,
});

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
    <!-- Timer Hero / Session Card -->
    <DashboardTimerHero
      :active-stint="activeStint"
      :paused-stint="pausedStint"
      :project="activeProject"
      :daily-progress="dailyProgress"
      @pause="handlePause"
      @resume="handleResume"
      @complete="handleComplete"
    />

    <!-- Streak Banner (self-contained, fetches own data) -->
    <StreakBanner class="!mb-0" />

    <!-- Today's Stats -->
    <TodaysStats
      :completed-stints="completedStints"
      :total-goal="totalGoal"
      :focus-minutes="focusMinutes"
      :best-block-minutes="bestBlockMinutes"
      :weekly-change="weeklyChange"
      :is-loading="isLoadingStats"
    />
  </aside>
</template>

<style scoped>
.dashboard-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (min-width: 1024px) {
  .dashboard-sidebar {
    gap: 24px;
    position: sticky;
    top: 100px;
  }
}
</style>
