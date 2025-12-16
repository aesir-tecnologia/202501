<script setup lang="ts">
import { useStreakQuery } from '~/composables/useStreaks';

const { data: streak, isLoading } = useStreakQuery();

const showStreak = computed(() =>
  streak.value && streak.value.currentStreak > 0,
);

const streakText = computed(() =>
  streak.value?.currentStreak === 1 ? 'day streak' : 'days streak',
);
</script>

<template>
  <!-- Hidden when streak is 0 (FR-008) -->
  <div
    v-if="showStreak && !isLoading"
    class="mb-6"
  >
    <UCard
      class="bg-gradient-to-br from-violet-500 to-emerald-500 text-white shadow-lg"
      :class="{ 'ring-2 ring-yellow-400': streak?.isAtRisk }"
    >
      <div class="flex items-center justify-between">
        <!-- Current streak display -->
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-white/20">
            <Icon
              name="i-lucide-flame"
              class="h-8 w-8"
            />
          </div>
          <div>
            <div class="text-3xl font-bold">
              {{ streak?.currentStreak }}
            </div>
            <div class="text-sm opacity-90">
              {{ streakText }}
            </div>
          </div>
        </div>

        <!-- At-risk indicator (FR-006) -->
        <div
          v-if="streak?.isAtRisk"
          class="flex items-center gap-2 text-yellow-200"
        >
          <Icon
            name="i-lucide-alert-triangle"
            class="h-5 w-5"
          />
          <span class="text-sm font-medium">At risk - complete a stint today!</span>
        </div>

        <!-- Longest streak display (FR-005) -->
        <div
          v-else
          class="text-right"
        >
          <div class="text-sm opacity-75">
            Longest
          </div>
          <div class="text-xl font-semibold">
            {{ streak?.longestStreak }} days
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
