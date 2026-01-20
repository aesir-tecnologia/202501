<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui';
import { usePeriodNavigation } from '~/composables/usePeriodNavigation';
import type { PeriodType } from '~/composables/usePeriodNavigation';
import { useDailySummariesQuery } from '~/composables/useDailySummaries';

const {
  periodType,
  dateRange,
  formattedLabel,
  isCurrentPeriod,
  previous,
  next,
  goToToday,
  setPeriodType,
} = usePeriodNavigation('daily');

const periodTabs: TabsItem[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

function onPeriodChange(value: PeriodType) {
  setPeriodType(value);
}

const { data: summaries, isLoading } = useDailySummariesQuery(dateRange);

const aggregatedStats = computed(() => {
  if (!summaries.value || summaries.value.length === 0) {
    return {
      completedStints: 0,
      focusSeconds: 0,
      totalSeconds: 0,
      breakSeconds: 0,
    };
  }

  return summaries.value.reduce(
    (acc, summary) => ({
      completedStints: acc.completedStints + summary.totalStints,
      focusSeconds: acc.focusSeconds + summary.totalFocusSeconds,
      totalSeconds: acc.totalSeconds + summary.totalFocusSeconds + summary.totalPauseSeconds,
      breakSeconds: acc.breakSeconds + summary.totalPauseSeconds,
    }),
    { completedStints: 0, focusSeconds: 0, totalSeconds: 0, breakSeconds: 0 },
  );
});

function formatTime(totalSeconds: number): string {
  if (totalSeconds === 0) return '-';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
  }
  else {
    if (minutes > 0) {
      parts.push(`${minutes}m`);
    }
    parts.push(`${seconds}s`);
  }

  return parts.join(' ');
}

const focusDisplay = computed(() => formatTime(aggregatedStats.value.focusSeconds));
const totalDisplay = computed(() => formatTime(aggregatedStats.value.totalSeconds));
const breakDisplay = computed(() => formatTime(aggregatedStats.value.breakSeconds));

const focusRatio = computed(() => {
  if (aggregatedStats.value.totalSeconds === 0) return 0;
  return Math.round((aggregatedStats.value.focusSeconds / aggregatedStats.value.totalSeconds) * 100);
});
</script>

<template>
  <div class="achievement-card">
    <!-- Navigation Header -->
    <div class="nav-header">
      <!-- Period Type Tabs -->
      <div class="nav-tabs">
        <UTabs
          v-model="periodType"
          :items="periodTabs"
          :content="false"
          variant="pill"
          size="sm"
          :ui="{ list: 'justify-center' }"
          @update:model-value="(v) => onPeriodChange(v as PeriodType)"
        />
      </div>

      <!-- Period Navigation -->
      <div class="nav-period">
        <UButton
          icon="i-lucide-chevron-left"
          color="primary"
          variant="solid"
          size="sm"
          class="nav-arrow"
          aria-label="Previous period"
          @click="previous"
        />

        <span class="date-label">{{ formattedLabel }}</span>

        <UButton
          icon="i-lucide-chevron-right"
          color="primary"
          variant="solid"
          size="sm"
          class="nav-arrow"
          :disabled="isCurrentPeriod"
          aria-label="Next period"
          @click="next"
        />
      </div>

      <!-- Jump to Today Link -->
      <button
        v-if="!isCurrentPeriod"
        class="jump-to-today"
        @click="goToToday"
      >
        Jump to today
      </button>
    </div>

    <!-- Hero Section: Focus Time -->
    <div class="hero-section">
      <div
        v-if="isLoading"
        class="hero-skeleton"
      />
      <template v-else>
        <div class="hero-label">
          <UIcon
            name="i-lucide-flame"
            class="hero-label-icon"
          />
          Focus
        </div>
        <div class="hero-value">
          {{ focusDisplay }}
        </div>
        <!-- Focus Ratio -->
        <div class="focus-ratio">
          <div class="focus-ratio-bar">
            <div
              class="focus-ratio-fill"
              :style="{ width: `${focusRatio}%` }"
            />
          </div>
          <div class="focus-ratio-label">
            {{ focusRatio }}% focus ratio
          </div>
        </div>
      </template>
    </div>

    <!-- Stats Row -->
    <div class="stats-row">
      <!-- Stints -->
      <div class="stat-item">
        <div
          v-if="isLoading"
          class="stat-skeleton"
        />
        <template v-else>
          <div class="stat-value">
            {{ aggregatedStats.completedStints || '-' }}
          </div>
          <div class="stat-label">
            <UIcon
              name="i-lucide-hash"
              class="stat-label-icon"
            />
            Stints
          </div>
        </template>
      </div>

      <!-- Total -->
      <div class="stat-item stat-item--bordered">
        <div
          v-if="isLoading"
          class="stat-skeleton"
        />
        <template v-else>
          <div class="stat-value">
            {{ totalDisplay }}
          </div>
          <div class="stat-label">
            <UIcon
              name="i-lucide-clock"
              class="stat-label-icon"
            />
            Total
          </div>
        </template>
      </div>

      <!-- Break -->
      <div class="stat-item stat-item--bordered stat-item--muted">
        <div
          v-if="isLoading"
          class="stat-skeleton"
        />
        <template v-else>
          <div class="stat-value">
            {{ breakDisplay }}
          </div>
          <div class="stat-label">
            <UIcon
              name="i-lucide-coffee"
              class="stat-label-icon"
            />
            Break
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.achievement-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: var(--shadow-soft);
}

@media (min-width: 768px) {
  .achievement-card {
    padding: 24px;
    border-radius: var(--radius-xl);
  }
}

/* Navigation Header */
.nav-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
}

.nav-tabs {
  display: flex;
  justify-content: center;
}

.nav-period {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.nav-arrow {
  border-radius: var(--radius-lg) !important;
}

.date-label {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  text-align: center;
}

.jump-to-today {
  display: block;
  width: 100%;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.15s ease;
}

.jump-to-today:hover {
  color: var(--accent-primary);
}

@media (min-width: 768px) {
  .nav-header {
    gap: 16px;
    padding-bottom: 20px;
    margin-bottom: 20px;
  }

  .date-label {
    font-size: 15px;
  }

  .jump-to-today {
    font-size: 13px;
  }
}

/* Hero Section */
.hero-section {
  text-align: center;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
}

@media (min-width: 768px) {
  .hero-section {
    padding-bottom: 20px;
    margin-bottom: 20px;
  }
}

.hero-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 4px;
  font-weight: 500;
}

.hero-label-icon {
  width: 16px;
  height: 16px;
  color: var(--accent-primary);
}

@media (min-width: 768px) {
  .hero-label {
    font-size: 16px;
    margin-bottom: 8px;
  }

  .hero-label-icon {
    width: 18px;
    height: 18px;
  }
}

.hero-value {
  font-family: var(--font-mono);
  font-size: 36px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

@media (min-width: 768px) {
  .hero-value {
    font-size: 48px;
  }
}

.hero-skeleton {
  height: 60px;
  background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
  margin: 0 auto;
  width: 60%;
}

/* Focus Ratio */
.focus-ratio {
  margin-top: 12px;
}

.focus-ratio-bar {
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.focus-ratio-fill {
  height: 100%;
  background: var(--accent-primary);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.focus-ratio-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 6px;
  font-weight: 500;
}

@media (min-width: 768px) {
  .focus-ratio {
    margin-top: 16px;
  }

  .focus-ratio-bar {
    height: 8px;
  }

  .focus-ratio-label {
    font-size: 12px;
    margin-top: 8px;
  }
}

/* Stats Row */
.stats-row {
  display: flex;
  justify-content: space-between;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 0 8px;
}

.stat-item--bordered {
  border-left: 1px solid var(--border-light);
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
}

@media (min-width: 768px) {
  .stat-value {
    font-size: 22px;
  }
}

.stat-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
  font-weight: 500;
}

.stat-label-icon {
  width: 12px;
  height: 12px;
}

.stat-item--muted .stat-value {
  opacity: 0.7;
}

.stat-item--muted .stat-label-icon {
  color: var(--accent-tertiary);
}

@media (min-width: 768px) {
  .stat-label {
    font-size: 12px;
  }

  .stat-label-icon {
    width: 14px;
    height: 14px;
  }
}

.stat-skeleton {
  height: 36px;
  background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
