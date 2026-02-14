<script setup lang="ts">
import type { StintRow } from '~/lib/supabase/stints';
import { formatCountdown, formatDuration } from '~/utils/time-format';

const props = defineProps<{
  stint: StintRow | null
}>();

// Get timer state from singleton composable
const { secondsRemaining, isPaused, timerCompleted } = useStintTimer();

// Format time using shared utility
const formattedTime = computed(() => formatCountdown(secondsRemaining.value));

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
  const elapsedSeconds = Math.floor((Date.now() - new Date(pausedAt).getTime()) / 1000);
  pausedDuration.value = formatDuration(elapsedSeconds);
}

// Cleanup interval on unmount
onUnmounted(() => {
  if (pausedIntervalId) {
    clearInterval(pausedIntervalId);
  }
});

// Animation state
const showCompletionAnimation = ref(false);

watch(timerCompleted, (completed) => {
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
      <div class="text-sm font-medium leading-normal text-warning-600 dark:text-warning-400">
        Paused
      </div>
      <div class="font-mono text-2xl font-bold leading-tight tabular-nums text-neutral-900 dark:text-neutral-50">
        {{ formattedTime }}
      </div>
      <div class="text-xs leading-tight text-neutral-500 dark:text-neutral-400">
        Paused for {{ pausedDuration }}
      </div>
    </div>

    <!-- Active State -->
    <div
      v-else-if="stint && !timerCompleted"
      class="flex flex-col items-center gap-2"
    >
      <div class="text-sm font-medium leading-normal text-success-600 dark:text-success-400">
        Active
      </div>
      <div
        class="font-mono text-4xl font-bold leading-tight tabular-nums text-neutral-900 dark:text-neutral-50"
      >
        {{ formattedTime }}
      </div>
    </div>

    <!-- Completed Animation -->
    <div
      v-if="showCompletionAnimation"
      class="absolute inset-0 flex items-center justify-center bg-success-50 dark:bg-success-950 rounded-lg motion-safe:animate-pulse"
    >
      <div class="text-center">
        <div class="text-4xl leading-tight mb-2">
          🎉
        </div>
        <div class="text-lg font-semibold leading-snug text-success-700 dark:text-success-300">
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
