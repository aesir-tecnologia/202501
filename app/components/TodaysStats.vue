<script setup lang="ts">
interface Props {
  completedStints: number
  totalGoal: number
  focusMinutes: number
  bestBlockMinutes: number
  weeklyChange: number | null
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
});

const focusDisplay = computed(() => {
  const hours = props.focusMinutes / 60;
  if (hours >= 1) {
    return { value: hours.toFixed(1), suffix: 'h' };
  }
  return { value: Math.round(props.focusMinutes).toString(), suffix: 'm' };
});

const bestBlockDisplay = computed(() => {
  if (props.bestBlockMinutes >= 60) {
    const hours = Math.floor(props.bestBlockMinutes / 60);
    const mins = props.bestBlockMinutes % 60;
    if (mins === 0) {
      return { value: hours.toString(), suffix: 'h' };
    }
    return { value: `${hours}h${mins}`, suffix: 'm' };
  }
  return { value: props.bestBlockMinutes.toString(), suffix: 'm' };
});

const weeklyChangeDisplay = computed(() => {
  if (props.weeklyChange === null) return null;
  const sign = props.weeklyChange >= 0 ? '+' : '';
  return `${sign}${Math.round(props.weeklyChange)}`;
});

const weeklyChangePositive = computed(() => {
  return props.weeklyChange !== null && props.weeklyChange >= 0;
});
</script>

<template>
  <div class="stats-card">
    <h3 class="stats-title font-serif">
      Today's Stats
    </h3>

    <div class="stats-grid">
      <!-- Daily Goal -->
      <div class="stat-item">
        <div
          v-if="isLoading"
          class="stat-skeleton"
        />
        <template v-else>
          <div class="stat-value">
            {{ completedStints }}<span class="stat-suffix">/{{ totalGoal }}</span>
          </div>
          <div class="stat-label">
            Daily Goal
          </div>
        </template>
      </div>

      <!-- Deep Focus -->
      <div class="stat-item">
        <div
          v-if="isLoading"
          class="stat-skeleton"
        />
        <template v-else>
          <div class="stat-value">
            {{ focusDisplay.value }}<span class="stat-suffix">{{ focusDisplay.suffix }}</span>
          </div>
          <div class="stat-label">
            Deep Focus
          </div>
        </template>
      </div>

      <!-- Best Block -->
      <div class="stat-item">
        <div
          v-if="isLoading"
          class="stat-skeleton"
        />
        <template v-else>
          <div class="stat-value">
            {{ bestBlockMinutes > 0 ? bestBlockDisplay.value : '--' }}<span
              v-if="bestBlockMinutes > 0"
              class="stat-suffix"
            >{{ bestBlockDisplay.suffix }}</span>
          </div>
          <div class="stat-label">
            Best Block
          </div>
        </template>
      </div>

      <!-- vs Last Week -->
      <div class="stat-item">
        <div
          v-if="isLoading"
          class="stat-skeleton"
        />
        <template v-else>
          <div
            class="stat-value"
            :class="weeklyChangePositive ? 'text-[var(--accent-secondary)]' : 'text-red-500'"
          >
            <template v-if="weeklyChangeDisplay !== null">
              {{ weeklyChangeDisplay }}<span class="stat-suffix">%</span>
            </template>
            <template v-else>
              --
            </template>
          </div>
          <div class="stat-label">
            vs Last Week
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: var(--shadow-soft);
}

@media (min-width: 768px) {
  .stats-card {
    padding: 24px;
    border-radius: var(--radius-xl);
  }
}

.stats-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 16px;
}

@media (min-width: 768px) {
  .stats-title {
    font-size: 18px;
    margin-bottom: 20px;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (min-width: 768px) {
  .stats-grid {
    gap: 16px;
  }
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

@media (min-width: 768px) {
  .stat-item {
    padding: 16px;
  }
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
}

@media (min-width: 768px) {
  .stat-value {
    font-size: 24px;
  }
}

.stat-suffix {
  font-size: 14px;
  color: var(--text-muted);
  font-weight: 400;
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}

@media (min-width: 768px) {
  .stat-label {
    font-size: 12px;
  }
}

.stat-skeleton {
  height: 40px;
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
