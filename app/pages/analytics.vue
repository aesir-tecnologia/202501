<script setup lang="ts">
import type { ProjectRow } from '~/lib/supabase/projects';
import { useStintsQuery } from '~/composables/useStints';
import { useProjectsQuery } from '~/composables/useProjects';
import { parseSafeDate } from '~/utils/date-helpers';

definePageMeta({
  title: 'Analytics',
  middleware: 'auth',
});

useSeoMeta({
  title: 'Analytics - LifeStint',
  description: 'View your work patterns, track progress, and identify trends.',
});

const { data: stintsData, isLoading: stintsLoading } = useStintsQuery();
const { data: projectsData, isLoading: projectsLoading } = useProjectsQuery({ includeInactive: true });

const stints = computed(() => stintsData.value ?? []);
const projects = computed(() => projectsData.value ?? []);

// Filter completed stints only
const completedStints = computed(() =>
  stints.value.filter(s => s.status === 'completed' && s.ended_at && s.actual_duration),
);

// Calculate streak
const currentStreak = computed(() => {
  if (completedStints.value.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  const checkDate = new Date(today);

  // Check backwards from today
  while (true) {
    const hasStintOnDate = completedStints.value.some((stint) => {
      if (!stint.ended_at) return false;
      const stintDate = parseSafeDate(stint.ended_at);
      if (!stintDate) return false;
      stintDate.setHours(0, 0, 0, 0);
      return stintDate.getTime() === checkDate.getTime();
    });

    if (!hasStintOnDate) break;

    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
});

const longestStreak = computed(() => {
  if (completedStints.value.length === 0) return 0;

  const dates = new Set<string>();
  completedStints.value.forEach((stint) => {
    if (stint.ended_at) {
      const date = parseSafeDate(stint.ended_at);
      if (date) {
        date.setHours(0, 0, 0, 0);
        dates.add(date.toISOString());
      }
    }
  });

  const sortedDates = Array.from(dates)
    .map(d => parseSafeDate(d))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  if (sortedDates.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const diffDays = Math.floor(
      (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    }
    else {
      currentStreak = 1;
    }
  }

  return maxStreak;
});

// Today's summary
const todayStints = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return completedStints.value.filter((stint) => {
    if (!stint.ended_at) return false;
    const stintDate = parseSafeDate(stint.ended_at);
    if (!stintDate) return false;
    stintDate.setHours(0, 0, 0, 0);
    return stintDate.getTime() === today.getTime();
  });
});

const todayTotalTime = computed(() => {
  return todayStints.value.reduce((total, stint) => {
    return total + (stint.actual_duration || 0);
  }, 0);
});

const todayAverageDuration = computed(() => {
  if (todayStints.value.length === 0) return 0;
  return Math.round(todayTotalTime.value / todayStints.value.length / 60);
});

const todayGoalsMet = computed(() => {
  const todayProjects = new Set(todayStints.value.map(s => s.project_id));
  let goalsMet = 0;

  projects.value.forEach((project) => {
    if (project.archived_at) return;
    if (!todayProjects.has(project.id)) return;

    const projectStintsToday = todayStints.value.filter(s => s.project_id === project.id).length;
    if (projectStintsToday >= project.expected_daily_stints) {
      goalsMet++;
    }
  });

  return goalsMet;
});

const todayProjectsWorked = computed(() => {
  const projectIds = new Set(todayStints.value.map(s => s.project_id));
  return projects.value
    .filter(p => projectIds.has(p.id) && !p.archived_at)
    .map((project) => {
      const stints = todayStints.value.filter(s => s.project_id === project.id);
      const totalTime = stints.reduce((sum, s) => sum + (s.actual_duration || 0), 0);
      const goalMet = stints.length >= project.expected_daily_stints;

      return {
        project,
        stintCount: stints.length,
        totalTimeMinutes: Math.round(totalTime / 60),
        goalMet,
      };
    });
});

// Weekly overview
const weekStints = computed(() => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Sunday
  weekStart.setHours(0, 0, 0, 0);

  return completedStints.value.filter((stint) => {
    if (!stint.ended_at) return false;
    const stintDate = parseSafeDate(stint.ended_at);
    if (!stintDate) return false;
    return stintDate >= weekStart;
  });
});

const weekTotalStints = computed(() => weekStints.value.length);

const weekTotalTime = computed(() => {
  return weekStints.value.reduce((total, stint) => {
    return total + (stint.actual_duration || 0);
  }, 0);
});

const weekDataByDay = computed(() => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekData = days.map((day, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);

    const dayStints = weekStints.value.filter((stint) => {
      if (!stint.ended_at) return false;
      const stintDate = parseSafeDate(stint.ended_at);
      if (!stintDate) return false;
      stintDate.setHours(0, 0, 0, 0);
      return stintDate.getTime() === date.getTime();
    });

    const totalTime = dayStints.reduce((sum, s) => sum + (s.actual_duration || 0), 0);

    return {
      day,
      date: date.toISOString(),
      stintCount: dayStints.length,
      totalTimeMinutes: Math.round(totalTime / 60),
      isToday: date.getTime() === new Date(today.setHours(0, 0, 0, 0)).getTime(),
    };
  });

  return weekData;
});

const mostProductiveDay = computed(() => {
  if (weekDataByDay.value.length === 0) return 'N/A';

  const maxStints = Math.max(...weekDataByDay.value.map(d => d.stintCount));
  const productiveDay = weekDataByDay.value.find(d => d.stintCount === maxStints);

  return productiveDay?.day || 'N/A';
});

// Project breakdown (top 5)
const projectBreakdown = computed(() => {
  const projectStats = new Map<string, { project: ProjectRow, stintCount: number, totalTime: number }>();

  weekStints.value.forEach((stint) => {
    const existing = projectStats.get(stint.project_id);
    const timeMinutes = Math.round((stint.actual_duration || 0) / 60);

    if (existing) {
      existing.stintCount++;
      existing.totalTime += timeMinutes;
    }
    else {
      const project = projects.value.find(p => p.id === stint.project_id);
      if (project && !project.archived_at) {
        projectStats.set(stint.project_id, {
          project,
          stintCount: 1,
          totalTime: timeMinutes,
        });
      }
    }
  });

  return Array.from(projectStats.values())
    .sort((a, b) => b.stintCount - a.stintCount)
    .slice(0, 5);
});

const maxProjectStints = computed(() => {
  if (projectBreakdown.value.length === 0) return 1;
  return Math.max(...projectBreakdown.value.map(p => p.stintCount));
});

const maxWeekStints = computed(() => {
  if (weekDataByDay.value.length === 0) return 1;
  return Math.max(...weekDataByDay.value.map(d => d.stintCount));
});

// Format time helpers
function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatTimeSeconds(seconds: number): string {
  return formatTime(Math.round(seconds / 60));
}

const isLoading = computed(() => stintsLoading.value || projectsLoading.value);
</script>

<template>
  <UContainer>
    <div class="space-y-6">
      <!-- Page Header -->
      <div>
        <h1 class="text-3xl font-semibold text-gray-900 dark:text-gray-100">
          Analytics
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Review your work patterns and track your progress
        </p>
      </div>

      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="text-center py-12"
      >
        <Icon
          name="i-lucide-loader-2"
          class="h-8 w-8 mx-auto animate-spin text-gray-400 dark:text-gray-500"
        />
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Loading analytics...
        </p>
      </div>

      <!-- Content -->
      <div
        v-else
        class="space-y-6"
      >
        <!-- Streak Section -->
        <UCard class="bg-gradient-to-br from-brand-500 to-mint-500 text-white shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <Icon
                  name="i-lucide-flame"
                  class="h-6 w-6"
                />
                <h2 class="text-2xl font-semibold text-white">
                  Current Streak
                </h2>
              </div>
              <p class="text-4xl font-bold">
                {{ currentStreak }}
              </p>
              <p class="text-sm opacity-90 mt-1">
                {{ currentStreak === 1 ? 'day' : 'days' }} in a row
              </p>
            </div>
            <div class="text-right">
              <p class="text-sm opacity-90">
                Longest Streak
              </p>
              <p class="text-2xl font-bold">
                {{ longestStreak }}
              </p>
            </div>
          </div>
        </UCard>

        <!-- Today's Summary -->
        <div>
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Today's Summary
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-brand-100 dark:bg-brand-900/30">
                  <Icon
                    name="i-lucide-target"
                    class="h-5 w-5 text-brand-600 dark:text-brand-400"
                  />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Stints Completed
                  </p>
                  <p class="text-2xl font-bold">
                    {{ todayStints.length }}
                  </p>
                </div>
              </div>
            </UCard>

            <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-mint-100 dark:bg-mint-900/30">
                  <Icon
                    name="i-lucide-clock"
                    class="h-5 w-5 text-mint-600 dark:text-mint-400"
                  />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Total Focus Time
                  </p>
                  <p class="text-2xl font-bold">
                    {{ formatTimeSeconds(todayTotalTime) }}
                  </p>
                </div>
              </div>
            </UCard>

            <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-amberx-100 dark:bg-amberx-900/30">
                  <Icon
                    name="i-lucide-trending-up"
                    class="h-5 w-5 text-amberx-600 dark:text-amberx-400"
                  />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Average Duration
                  </p>
                  <p class="text-2xl font-bold">
                    {{ todayAverageDuration }}m
                  </p>
                </div>
              </div>
            </UCard>

            <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-mint-100 dark:bg-mint-900/30">
                  <Icon
                    name="i-lucide-calendar-check"
                    class="h-5 w-5 text-mint-600 dark:text-mint-400"
                  />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Daily Goals Met
                  </p>
                  <p class="text-2xl font-bold">
                    {{ todayGoalsMet }}
                  </p>
                </div>
              </div>
            </UCard>
          </div>

          <!-- Projects Worked Today -->
          <UCard
            v-if="todayProjectsWorked.length > 0"
            class="mt-4 bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70"
          >
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
              Projects Worked Today
            </h3>
            <div class="space-y-2">
              <div
                v-for="item in todayProjectsWorked"
                :key="item.project.id"
                class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div
                    v-if="item.project.color_tag"
                    class="w-3 h-3 rounded-full"
                    :class="`bg-${item.project.color_tag}-500`"
                  />
                  <span class="font-medium">
                    {{ item.project.name }}
                  </span>
                </div>
                <div class="flex items-center gap-4">
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    {{ item.stintCount }} {{ item.stintCount === 1 ? 'stint' : 'stints' }}
                  </span>
                  <UBadge
                    v-if="item.goalMet"
                    color="success"
                    variant="soft"
                  >
                    Goal Met
                  </UBadge>
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Weekly Overview -->
        <div>
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Weekly Overview
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Stints
              </p>
              <p class="text-2xl font-bold">
                {{ weekTotalStints }}
              </p>
            </UCard>

            <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Focus Time
              </p>
              <p class="text-2xl font-bold">
                {{ formatTimeSeconds(weekTotalTime) }}
              </p>
            </UCard>

            <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Most Productive Day
              </p>
              <p class="text-2xl font-bold">
                {{ mostProductiveDay }}
              </p>
            </UCard>
          </div>

          <!-- Weekly Chart -->
          <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Stints Per Day
            </h3>
            <div class="space-y-3">
              <div
                v-for="day in weekDataByDay"
                :key="day.day"
                class="flex items-center gap-4"
              >
                <div class="w-12 text-sm font-medium">
                  {{ day.day }}
                </div>
                <div class="flex-1">
                  <div class="relative h-8 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                    <div
                      class="h-full bg-brand-500 transition-all duration-500 flex items-center justify-end pr-2"
                      :class="day.isToday ? 'ring-2 ring-brand-300' : ''"
                      :style="{ width: maxWeekStints > 0 ? `${(day.stintCount / Math.max(maxWeekStints, 1)) * 100}%` : '0%' }"
                    >
                      <span
                        v-if="day.stintCount > 0"
                        class="text-xs font-medium text-white"
                      >
                        {{ day.stintCount }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="w-20 text-sm text-gray-600 dark:text-gray-400 text-right">
                  {{ formatTime(day.totalTimeMinutes) }}
                </div>
              </div>
            </div>
          </UCard>

          <!-- Project Breakdown -->
          <UCard
            v-if="projectBreakdown.length > 0"
            class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70"
          >
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Top Projects This Week
            </h3>
            <div class="space-y-3">
              <div
                v-for="item in projectBreakdown"
                :key="item.project.id"
                class="space-y-2"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div
                      v-if="item.project.color_tag"
                      class="w-3 h-3 rounded-full"
                      :class="`bg-${item.project.color_tag}-500`"
                    />
                    <span class="font-medium">
                      {{ item.project.name }}
                    </span>
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    {{ item.stintCount }} {{ item.stintCount === 1 ? 'stint' : 'stints' }} · {{ formatTime(item.totalTime) }}
                  </div>
                </div>
                <div class="relative h-2 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                  <div
                    class="h-full transition-all duration-500"
                    :class="`bg-${item.project.color_tag || 'brand'}-500`"
                    :style="{ width: maxProjectStints > 0 ? `${(item.stintCount / maxProjectStints) * 100}%` : '0%' }"
                  />
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </UContainer>
</template>
