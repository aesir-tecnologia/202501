<script setup lang="ts">
import type { StintRow } from '~/lib/supabase/stints';
import type { ProjectRow } from '~/lib/supabase/projects';
import { useStintTimer } from '~/composables/useStintTimer';
import { parseSafeDate } from '~/utils/date-helpers';
import { formatCountdown, formatDuration } from '~/utils/time-format';
import { PROJECT, type ProjectColor } from '~/constants';

interface DailyProgress {
  completed: number
  expected: number
}

interface Props {
  activeStint: StintRow | null
  project: ProjectRow | null
  dailyProgress: DailyProgress
}

const props = defineProps<Props>();

const emit = defineEmits<{
  pause: [stint: StintRow]
  resume: [stint: StintRow]
  complete: [stint: StintRow]
}>();

const { secondsRemaining, isPaused } = useStintTimer();

const hasSession = computed(() => props.activeStint !== null);
const isRunning = computed(() => props.activeStint !== null && !isPaused.value);

// Snapshot refs - preserve last known values during hide animation
const snapshotProjectName = ref<string | null>(null);
const snapshotTimerDisplay = ref('00:00');
const snapshotMeta = ref<{
  started: string
  plannedDuration: string
  pausedDisplay: string
  ends: string
} | null>(null);

const snapshotIsOvertime = ref(false);
const snapshotIsPaused = ref(false);
const snapshotProgress = ref(0);

// Update snapshots only when we have active data
watch(
  () => props.project?.name,
  (name) => {
    if (name) snapshotProjectName.value = name;
  },
  { immediate: true },
);

watch(
  secondsRemaining,
  (seconds) => {
    if (props.activeStint) {
      snapshotTimerDisplay.value = formatCountdown(seconds);
      snapshotIsOvertime.value = seconds < 0;
    }
  },
  { immediate: true },
);

watch(
  isPaused,
  (paused) => {
    if (props.activeStint) {
      snapshotIsPaused.value = paused;
    }
  },
  { immediate: true },
);

const progressPercentage = computed(() => {
  if (!props.activeStint?.planned_duration) return 0;
  const plannedSeconds = props.activeStint.planned_duration * 60;
  const elapsed = plannedSeconds - secondsRemaining.value;
  return Math.min(100, Math.max(0, (elapsed / plannedSeconds) * 100));
});

watch(
  progressPercentage,
  (pct) => {
    if (props.activeStint) {
      snapshotProgress.value = pct;
    }
  },
  { immediate: true },
);

// Compute and snapshot session meta
watch(
  () => props.activeStint,
  (stint) => {
    if (!stint) return;

    const startedAt = parseSafeDate(stint.started_at);
    if (!startedAt) return;

    const plannedMinutes = stint.planned_duration || 30;
    const pausedSeconds = stint.paused_duration || 0;

    const endTime = new Date(startedAt.getTime() + (plannedMinutes * 60 * 1000) + (pausedSeconds * 1000));

    snapshotMeta.value = {
      started: startedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      plannedDuration: formatDuration(plannedMinutes * 60),
      pausedDisplay: formatDuration(pausedSeconds, { delta: true }),
      ends: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  },
  { immediate: true },
);

const colorDotClass = computed(() => {
  const color = props.project?.color_tag;
  if (!color || !PROJECT.COLORS.includes(color as ProjectColor)) {
    return 'bg-stone-400 dark:bg-stone-500';
  }
  const dotColorMap: Record<ProjectColor, string> = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    amber: 'bg-amber-500',
    green: 'bg-green-500',
    teal: 'bg-teal-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
  };
  return dotColorMap[color as ProjectColor];
});

// Display values use snapshots (persist during fade)
const displayProjectName = computed(() => snapshotProjectName.value);
const displayTimerValue = computed(() => snapshotTimerDisplay.value);
const displayMeta = computed(() => snapshotMeta.value);
const displayIsOvertime = computed(() => snapshotIsOvertime.value);
const displayIsPaused = computed(() => snapshotIsPaused.value);
const displayProgress = computed(() => snapshotProgress.value);
const timerSegments = computed(() => displayTimerValue.value.split(':'));

function handlePause(stint: StintRow) {
  emit('pause', stint);
}

function handleResume(stint: StintRow) {
  emit('resume', stint);
}

function handleComplete(stint: StintRow) {
  emit('complete', stint);
}
</script>

<template>
  <div
    class="session-card"
    :class="{ 'is-visible': hasSession }"
  >
    <!-- Ambient glow effect -->
    <div class="ambient-glow" />

    <!-- Active Session State -->
    <div class="session-content">
      <div class="session-header">
        <h2 class="session-project">
          <span
            class="project-dot"
            :class="colorDotClass"
          />
          {{ displayProjectName }}
        </h2>
      </div>

      <!-- Session Metadata -->
      <div
        v-if="displayMeta"
        class="session-meta"
      >
        <div class="meta-chip">
          <span class="meta-label">Started</span>
          <span class="meta-value">{{ displayMeta.started }}</span>
        </div>
        <div class="meta-chip">
          <span class="meta-label">Duration</span>
          <span class="meta-value">
            {{ displayMeta.plannedDuration }}<span
              v-if="displayMeta.pausedDisplay"
              class="text-(--ui-text-muted)"
            > {{ displayMeta.pausedDisplay }}</span>
          </span>
        </div>
        <div class="meta-chip">
          <span class="meta-label">Ends</span>
          <span class="meta-value">{{ displayMeta.ends }}</span>
        </div>
      </div>

      <!-- Timer Display -->
      <div
        class="session-timer"
        :class="{ 'timer-paused': displayIsPaused, 'timer-overtime': displayIsOvertime }"
      >
        <div class="timer-glow-ring" />
        <div
          class="timer-display"
          :class="{ 'is-paused': displayIsPaused, 'is-overtime': displayIsOvertime }"
        >
          <template
            v-for="(segment, idx) in timerSegments"
            :key="idx"
          >
            <span
              v-if="idx > 0"
              class="timer-colon"
            >:</span>
            <span class="timer-segment">{{ segment }}</span>
          </template>
        </div>
        <div class="timer-label">
          {{ displayIsOvertime ? 'Overtime' : 'Time Remaining' }}
        </div>
        <div class="stint-progress-track">
          <div
            class="stint-progress-fill"
            :style="{ width: `${displayProgress}%` }"
          />
          <div
            class="stint-progress-bubble"
            :style="{ left: `${displayProgress}%` }"
          />
        </div>
      </div>

      <!-- Control Buttons -->
      <div class="session-controls">
        <UButton
          v-if="isRunning"
          variant="outline"
          color="warning"
          class="ctrl-btn"
          @click="handlePause(activeStint!)"
        >
          <Icon
            name="i-lucide-pause"
            class="w-4 h-4"
          />
          Pause
        </UButton>
        <UButton
          v-else
          variant="outline"
          color="success"
          class="ctrl-btn"
          @click="handleResume(activeStint!)"
        >
          <Icon
            name="i-lucide-redo"
            class="w-4 h-4"
          />
          Resume
        </UButton>
        <UButton
          variant="outline"
          color="error"
          class="ctrl-btn"
          @click="handleComplete(activeStint!)"
        >
          <Icon
            name="i-lucide-square"
            class="w-4 h-4"
          />
          Stop
        </UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.session-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
  opacity: 0;
  transition: opacity 300ms ease;
}

.session-card.is-visible {
  opacity: 1;
  transition: opacity 300ms ease;
}

@media (min-width: 768px) {
  .session-card {
    padding: 32px;
    border-radius: var(--radius-xl);
  }
}

/* Ambient glow effect */
.ambient-glow {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--accent-primary-glow) 0%, transparent 60%);
  pointer-events: none;
  opacity: 0.4;
}

@media (min-width: 768px) {
  .ambient-glow {
    width: 500px;
    height: 500px;
  }
}

/* Session Header */
.session-header {
  margin-bottom: 16px;
}

@media (min-width: 768px) {
  .session-header {
    margin-bottom: 20px;
  }
}

.session-project {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.project-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .session-project {
    font-size: 22px;
  }

  .project-dot {
    width: 12px;
    height: 12px;
  }
}

/* Session Metadata */
.session-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

@media (min-width: 768px) {
  .session-meta {
    gap: 12px;
    margin-bottom: 20px;
  }
}

.meta-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
}

@media (min-width: 768px) {
  .meta-chip {
    padding: 10px 16px;
    gap: 6px;
  }
}

.meta-value {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

@media (min-width: 768px) {
  .meta-value {
    font-size: 18px;
  }
}

.meta-label {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

@media (min-width: 768px) {
  .meta-label {
    font-size: 11px;
  }
}

/* Timer Display */
.session-timer {
  text-align: center;
  padding: 16px 0 24px;
  position: relative;
  z-index: 1;
}

.timer-display {
  font-family: var(--font-display);
  font-size: 48px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1;
  text-shadow: 0 0 40px var(--accent-primary-glow);
  display: flex;
  align-items: baseline;
  justify-content: center;
  position: relative;
  z-index: 1;
}

@media (min-width: 768px) {
  .timer-display {
    font-size: 72px;
    text-shadow: 0 0 60px var(--accent-primary-glow);
  }
}

.timer-display.is-paused {
  color: var(--accent-amber);
}

.timer-display.is-overtime {
  color: var(--accent-danger);
}

.timer-label {
  font-size: 13px;
  color: var(--accent-primary);
  margin-top: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  z-index: 1;
}

@media (min-width: 768px) {
  .timer-label {
    font-size: 14px;
    margin-top: 12px;
  }
}

/* Control Buttons */
.session-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ctrl-btn {
  width: 100%;
  min-height: 48px;
  padding: 14px 20px !important;
  font-size: 14px !important;
  border-radius: var(--radius-lg) !important;
}

@media (min-width: 768px) {
  .ctrl-btn {
    min-height: 52px;
    padding: 16px 28px !important;
    font-size: 15px !important;
  }
}

/* Timer Segments */
.timer-segment { display: inline-block; }

.timer-colon {
  display: inline-block;
  margin: 0 2px;
  animation: colon-blink 1s step-end infinite;
}

@keyframes colon-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.timer-display.is-paused .timer-colon {
  animation: none;
  color: var(--accent-amber);
}

.timer-display.is-overtime .timer-colon {
  color: var(--accent-danger);
}

/* Timer Glow Ring */
.timer-glow-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, var(--accent-primary-glow) 0%, transparent 70%);
  filter: blur(20px);
  opacity: 0.6;
  pointer-events: none;
  z-index: 0;
}

@media (min-width: 768px) {
  .timer-glow-ring { width: 320px; height: 320px; }
}

.timer-paused .timer-glow-ring {
  background: radial-gradient(circle, rgba(217, 119, 6, 0.2) 0%, transparent 70%);
}
.timer-overtime .timer-glow-ring {
  background: radial-gradient(circle, rgba(220, 38, 38, 0.2) 0%, transparent 70%);
}
:root.dark .timer-paused .timer-glow-ring {
  background: radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, transparent 70%);
}
:root.dark .timer-overtime .timer-glow-ring {
  background: radial-gradient(circle, rgba(248, 113, 113, 0.2) 0%, transparent 70%);
}

/* Session Progress Bar */
.stint-progress-track {
  position: relative;
  width: 100%;
  height: 3px;
  background: var(--border-light);
  border-radius: 2px;
  margin-top: 16px;
  overflow: visible;
}

.stint-progress-fill {
  height: 100%;
  background: var(--accent-primary);
  border-radius: 2px;
  transition: width 1s linear;
}

.stint-progress-bubble {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: var(--accent-primary);
  border-radius: 50%;
  box-shadow: var(--shadow-progress-glow);
  transition: left 1s linear;
}

@media (min-width: 768px) {
  .stint-progress-bubble { width: 12px; height: 12px; }
  .stint-progress-track { margin-top: 20px; }
}

.timer-paused .stint-progress-fill { background: var(--accent-amber); }
.timer-paused .stint-progress-bubble {
  background: var(--accent-amber);
  box-shadow: 0 0 8px rgba(217, 119, 6, 0.4), 0 0 16px rgba(217, 119, 6, 0.2);
}
:root.dark .timer-paused .stint-progress-bubble {
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.5), 0 0 16px rgba(251, 191, 36, 0.3);
}

.timer-overtime .stint-progress-fill { background: var(--accent-danger); }
.timer-overtime .stint-progress-bubble {
  background: var(--accent-danger);
  box-shadow: 0 0 8px rgba(220, 38, 38, 0.4), 0 0 16px rgba(220, 38, 38, 0.2);
}
:root.dark .timer-overtime .stint-progress-bubble {
  box-shadow: 0 0 8px rgba(248, 113, 113, 0.5), 0 0 16px rgba(248, 113, 113, 0.3);
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .timer-colon { animation: none; }
  .timer-glow-ring { display: none; }
  .stint-progress-fill { transition: none; }
  .stint-progress-bubble { transition: none; box-shadow: none; }
}

/* Empty State */
.no-session {
  text-align: center;
  padding: 32px 16px;
}

@media (min-width: 768px) {
  .no-session {
    padding: 48px 24px;
  }
}

.no-session-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: 50%;
  color: var(--text-muted);
}

@media (min-width: 768px) {
  .no-session-icon {
    width: 64px;
    height: 64px;
    margin-bottom: 20px;
  }
}

.no-session h3 {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 8px;
}

@media (min-width: 768px) {
  .no-session h3 {
    font-size: 20px;
  }
}

.no-session p {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

@media (min-width: 768px) {
  .no-session p {
    font-size: 14px;
  }
}
</style>
