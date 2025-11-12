<script setup lang="ts">
import type { StintRow } from '~/lib/supabase/stints';

const props = defineProps<{
  stint: StintRow | null
}>();

// Get timer state from singleton composable
const { secondsRemaining, isPaused, isCompleted } = useStintTimer();

// Format time as MM:SS
const formattedTime = computed(() => {
  const mins = Math.floor(secondsRemaining.value / 60);
  const secs = secondsRemaining.value % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
});

// Calculate pause duration (live updating)
const pausedDuration = ref<string>('');
let pausedIntervalId: ReturnType<typeof setInterval> | null = null;

// Update paused duration every second
watch(
  () => props.stint?.paused_at,
  (pausedAt) => {
    // Clear existing interval
    if (pausedIntervalId) {
      clearInterval(pausedIntervalId);
      pausedIntervalId = null;
    }

    if (pausedAt && isPaused.value) {
      // Update immediately
      updatePausedDuration(pausedAt);

      // Then update every second
      pausedIntervalId = setInterval(() => {
        updatePausedDuration(pausedAt);
      }, 1000);
    }
    else {
      pausedDuration.value = '';
    }
  },
  { immediate: true },
);

function updatePausedDuration(pausedAt: string): void {
  const pausedMs = new Date(pausedAt).getTime();
  const elapsedMs = Date.now() - pausedMs;
  const mins = Math.floor(elapsedMs / 60000);
  const secs = Math.floor((elapsedMs % 60000) / 1000);

  if (mins > 0) {
    pausedDuration.value = `${mins}m ${secs}s`;
  }
  else {
    pausedDuration.value = `${secs}s`;
  }
}

// Cleanup interval on unmount
onUnmounted(() => {
  if (pausedIntervalId) {
    clearInterval(pausedIntervalId);
  }
});

// Animation state
const showCompletionAnimation = ref(false);

watch(isCompleted, (completed) => {
  if (completed) {
    showCompletionAnimation.value = true;
    // Hide animation after 3 seconds
    setTimeout(() => {
      showCompletionAnimation.value = false;
    }, 3000);
  }
});
</script>

<template>
  <div class="relative">
    <!-- Paused State -->
    <div
      v-if="isPaused && stint"
      class="flex flex-col items-center gap-2"
    >
      <div class="text-sm font-medium text-orange-600 dark:text-orange-400">
        Paused
      </div>
      <div class="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100">
        {{ formattedTime }}
      </div>
      <div class="text-xs text-gray-500 dark:text-gray-400">
        Paused for {{ pausedDuration }}
      </div>
    </div>

    <!-- Active State -->
    <div
      v-else-if="stint && !isCompleted"
      class="flex flex-col items-center gap-2"
    >
      <div class="text-sm font-medium text-green-600 dark:text-green-400">
        Active
      </div>
      <div
        class="text-4xl font-mono font-bold text-gray-900 dark:text-gray-100 tabular-nums"
      >
        {{ formattedTime }}
      </div>
    </div>

    <!-- Completed Animation -->
    <div
      v-if="showCompletionAnimation"
      class="absolute inset-0 flex items-center justify-center bg-green-50 dark:bg-green-950 rounded-lg animate-pulse"
    >
      <div class="text-center">
        <div class="text-4xl mb-2">
          🎉
        </div>
        <div class="text-lg font-semibold text-green-700 dark:text-green-300">
          Stint Complete!
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure tabular numbers for timer to prevent layout shift */
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>
