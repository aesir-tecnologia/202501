<script setup lang="ts">
interface Props {
  completedStints: number
  focusSeconds: number
  totalSeconds: number
  breakSeconds: number
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
});

function formatTime(totalSeconds: number): string {
  if (totalSeconds === 0) return '-';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0 || hours > 0) {
    parts.push(`${minutes}m`);
  }
  parts.push(`${seconds}s`);

  return parts.join(' ');
}

const focusDisplay = computed(() => formatTime(props.focusSeconds));
const totalDisplay = computed(() => formatTime(props.totalSeconds));
const breakDisplay = computed(() => formatTime(props.breakSeconds));
</script>

<template>
  <div class="stats-card">
    <!-- Hero Section: Focus Time -->
    <div class="hero-section">
      <div
        v-if="isLoading"
        class="hero-skeleton"
      />
      <template v-else>
        <div class="hero-label">
          Focus
        </div>
        <div class="hero-value">
          {{ focusDisplay }}
        </div>
      </template>
    </div>

    <!-- Stats Row -->
    <div class="stats-row">
      <!-- Sessions -->
      <div class="stat-item">
        <div
          v-if="isLoading"
          class="stat-skeleton"
        />
        <template v-else>
          <div class="stat-value">
            {{ completedStints || '-' }}
          </div>
          <div class="stat-label">
            Sessions
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
            Total
          </div>
        </template>
      </div>

      <!-- Break -->
      <div class="stat-item stat-item--bordered">
        <div
          v-if="isLoading"
          class="stat-skeleton"
        />
        <template v-else>
          <div class="stat-value">
            {{ breakDisplay }}
          </div>
          <div class="stat-label">
            Break
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
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 4px;
  font-weight: 500;
}

@media (min-width: 768px) {
  .hero-label {
    font-size: 16px;
    margin-bottom: 8px;
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
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
  font-weight: 500;
}

@media (min-width: 768px) {
  .stat-label {
    font-size: 12px;
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
