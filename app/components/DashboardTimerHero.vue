<script setup lang="ts">
import type { StintRow } from '~/lib/supabase/stints';
import type { ProjectRow } from '~/lib/supabase/projects';
import { useStintTimer } from '~/composables/useStintTimer';
import { parseSafeDate } from '~/utils/date-helpers';
import { formatStintTime } from '~/utils/stint-time';
import { STINT } from '~/constants';

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
const isPausedState = computed(() => props.activeStint !== null && isPaused.value);

const timerDisplay = computed(() => formatStintTime(secondsRemaining.value));

const sessionMeta = computed(() => {
  const stint = props.activeStint;
  if (!stint) return null;

  const startedAt = parseSafeDate(stint.started_at);
  if (!startedAt) return null;

  const plannedSeconds = stint.planned_duration || STINT.DURATION_SECONDS.DEFAULT;
  const pausedSeconds = stint.paused_duration || 0;

  const plannedMinutes = Math.round(plannedSeconds / 60);
  const pausedMinutes = Math.round(pausedSeconds / 60);

  const endTime = new Date(startedAt.getTime() + (plannedSeconds * 1000) + (pausedSeconds * 1000));

  const totalMinutes = plannedMinutes + pausedMinutes;
  const durationHours = Math.floor(totalMinutes / 60);
  const durationMins = totalMinutes % 60;
  const formattedDuration = durationHours > 0
    ? `${durationHours}h ${durationMins}m`
    : `${totalMinutes}m`;

  return {
    started: startedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    duration: formattedDuration,
    ends: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
});

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
    :class="{ 'has-session': hasSession }"
  >
    <!-- Ambient glow effect (only when session active) -->
    <div
      v-if="hasSession"
      class="ambient-glow"
    />

    <!-- Active Session State -->
    <template v-if="hasSession && project">
      <div class="session-header">
        <h2 class="session-project font-serif">
          {{ project.name }}
        </h2>
      </div>

      <!-- Session Metadata -->
      <div
        v-if="sessionMeta"
        class="session-meta"
      >
        <div class="meta-item">
          <span class="meta-value">{{ sessionMeta.started }}</span>
          <span class="meta-label">Started</span>
        </div>
        <div class="meta-item">
          <span class="meta-value">{{ sessionMeta.duration }}</span>
          <span class="meta-label">Duration</span>
        </div>
        <div class="meta-item">
          <span class="meta-value">{{ sessionMeta.ends }}</span>
          <span class="meta-label">Ends</span>
        </div>
      </div>

      <!-- Timer Display -->
      <div class="session-timer">
        <div
          class="timer-display"
          :class="{ 'is-paused': isPausedState, 'is-overtime': secondsRemaining < 0 }"
        >
          {{ timerDisplay }}
        </div>
        <div class="timer-label">
          {{ secondsRemaining < 0 ? 'Overtime' : 'Time Remaining' }}
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
            name="i-lucide-play"
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
    </template>

    <!-- Empty State -->
    <template v-else>
      <div class="no-session">
        <div class="no-session-icon">
          <Icon
            name="i-lucide-clock"
            class="w-8 h-8"
          />
        </div>
        <h3 class="font-serif">
          No active session
        </h3>
        <p>Select a project to start a focused work stint</p>
      </div>
    </template>
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
}

@media (min-width: 768px) {
  .session-card {
    padding: 32px;
    border-radius: var(--radius-xl);
  }
}

@media (max-width: 767.98px) {
  .session-card:not(.has-session) {
    display: none;
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
  text-align: center;
  margin-bottom: 16px;
}

@media (min-width: 768px) {
  .session-header {
    margin-bottom: 20px;
  }
}

.session-project {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}

@media (min-width: 768px) {
  .session-project {
    font-size: 22px;
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
  }
}

.meta-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

@media (min-width: 768px) {
  .meta-item {
    gap: 4px;
  }
}

.meta-value {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
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
  font-family: var(--font-mono);
  font-size: 48px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.02em;
  line-height: 1;
  text-shadow: 0 0 40px var(--accent-primary-glow);
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

.dark .timer-display.is-overtime {
  color: var(--accent-danger);
}

.timer-label {
  font-size: 13px;
  color: var(--accent-primary);
  margin-top: 8px;
  font-weight: 500;
}

@media (min-width: 768px) {
  .timer-label {
    font-size: 14px;
    margin-top: 12px;
  }
}

/* Control Buttons */
.session-controls {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.ctrl-btn {
  min-height: 44px;
  padding: 12px 20px !important;
  font-size: 13px !important;
  border-radius: 100px !important;
}

@media (min-width: 768px) {
  .ctrl-btn {
    padding: 14px 28px !important;
    font-size: 14px !important;
  }
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
