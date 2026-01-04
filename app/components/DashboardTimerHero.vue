<script setup lang="ts">
import type { StintRow } from '~/lib/supabase/stints';
import type { ProjectRow } from '~/lib/supabase/projects';
import { useStintTimer } from '~/composables/useStintTimer';
import { parseSafeDate } from '~/utils/date-helpers';

interface DailyProgress {
  completed: number
  expected: number
}

interface Props {
  activeStint: StintRow | null
  pausedStint: StintRow | null
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

const currentStint = computed(() => props.activeStint || props.pausedStint);
const hasSession = computed(() => currentStint.value !== null);
const isRunning = computed(() => props.activeStint !== null && !isPaused.value);
const isPausedState = computed(() => props.pausedStint !== null || isPaused.value);

const timerDisplay = computed(() => {
  const total = secondsRemaining.value;
  const mins = Math.floor(Math.abs(total) / 60);
  const secs = Math.abs(total) % 60;
  const sign = total < 0 ? '-' : '';
  return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
});

const sessionMeta = computed(() => {
  const stint = currentStint.value;
  if (!stint) return null;

  const startedAt = parseSafeDate(stint.started_at);
  if (!startedAt) return null;

  const plannedMinutes = stint.planned_duration || 30;
  const pausedSeconds = stint.paused_duration || 0;
  const pausedMinutes = Math.round(pausedSeconds / 60);

  const endTime = new Date(startedAt.getTime() + (plannedMinutes * 60 * 1000) + (pausedSeconds * 1000));

  return {
    started: startedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    duration: plannedMinutes,
    pausedMinutes,
    ends: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
});

const progressSegments = computed(() => {
  const { completed, expected } = props.dailyProgress;
  if (expected === 0) return [];

  const segments: Array<'completed' | 'current' | 'remaining'> = [];
  const currentSessionActive = hasSession.value ? 1 : 0;

  for (let i = 0; i < expected; i++) {
    if (i < completed) {
      segments.push('completed');
    }
    else if (i === completed && currentSessionActive) {
      segments.push('current');
    }
    else {
      segments.push('remaining');
    }
  }

  return segments;
});

const progressText = computed(() => {
  const { completed, expected } = props.dailyProgress;
  return `${completed}/${expected} stints`;
});

function handlePause() {
  if (props.activeStint) {
    emit('pause', props.activeStint);
  }
}

function handleResume() {
  if (props.pausedStint) {
    emit('resume', props.pausedStint);
  }
}

function handleComplete() {
  const stint = currentStint.value;
  if (stint) {
    emit('complete', stint);
  }
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
        <span
          class="session-status"
          :class="isRunning ? 'running' : 'paused'"
        >
          {{ isRunning ? 'Running' : 'Paused' }}
        </span>
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
          <span class="meta-value">
            {{ sessionMeta.duration }}m<span
              v-if="sessionMeta.pausedMinutes > 0"
              class="meta-paused"
            >+{{ sessionMeta.pausedMinutes }}</span>
          </span>
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

      <!-- Progress Bar -->
      <div
        v-if="dailyProgress.expected > 0"
        class="session-progress"
      >
        <div class="progress-header">
          <span class="progress-label">Today's progress</span>
          <span class="progress-count">{{ progressText }}</span>
        </div>
        <div class="progress-bar">
          <div
            v-for="(segment, index) in progressSegments"
            :key="index"
            class="progress-segment"
            :class="segment"
          />
        </div>
      </div>

      <!-- Control Buttons -->
      <div class="session-controls">
        <UButton
          v-if="isRunning"
          variant="outline"
          color="neutral"
          class="ctrl-btn warning"
          @click="handlePause"
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
          color="neutral"
          class="ctrl-btn success"
          @click="handleResume"
        >
          <Icon
            name="i-lucide-play"
            class="w-4 h-4"
          />
          Resume
        </UButton>
        <UButton
          variant="outline"
          color="neutral"
          class="ctrl-btn danger"
          @click="handleComplete"
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

/* Ambient glow effect */
.ambient-glow {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--accent-primary-glow, rgba(194, 65, 12, 0.2)) 0%, transparent 60%);
  pointer-events: none;
  opacity: 0.4;
}

@media (min-width: 768px) {
  .ambient-glow {
    width: 500px;
    height: 500px;
  }
}

.dark .ambient-glow {
  --accent-primary-glow: rgba(234, 88, 12, 0.25);
}

/* Session Header */
.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
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

.session-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 100px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@media (min-width: 768px) {
  .session-status {
    gap: 8px;
    padding: 6px 14px;
    font-size: 12px;
  }
}

.session-status::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

@media (min-width: 768px) {
  .session-status::before {
    width: 8px;
    height: 8px;
  }
}

.session-status.running {
  background: rgba(34, 197, 94, 0.1);
  color: var(--accent-secondary);
}

.session-status.running::before {
  background: var(--accent-secondary);
  animation: pulse 1.5s ease-in-out infinite;
}

.session-status.paused {
  background: rgba(217, 119, 6, 0.1);
  color: var(--accent-amber);
}

.session-status.paused::before {
  background: var(--accent-amber);
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
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

.meta-paused {
  font-size: 12px;
  color: var(--accent-amber);
  font-weight: 500;
}

@media (min-width: 768px) {
  .meta-paused {
    font-size: 14px;
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
  text-shadow: 0 0 40px var(--accent-primary-glow, rgba(194, 65, 12, 0.15));
}

@media (min-width: 768px) {
  .timer-display {
    font-size: 72px;
    text-shadow: 0 0 60px var(--accent-primary-glow, rgba(194, 65, 12, 0.15));
  }
}

.dark .timer-display {
  --accent-primary-glow: rgba(234, 88, 12, 0.2);
}

.timer-display.is-paused {
  color: var(--accent-amber);
}

.timer-display.is-overtime {
  color: #dc2626;
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

/* Progress Bar */
.session-progress {
  margin-bottom: 24px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.progress-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

@media (min-width: 768px) {
  .progress-label {
    font-size: 13px;
  }
}

.progress-count {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 600;
}

@media (min-width: 768px) {
  .progress-count {
    font-size: 14px;
  }
}

.progress-bar {
  display: flex;
  gap: 6px;
}

@media (min-width: 768px) {
  .progress-bar {
    gap: 8px;
  }
}

.progress-segment {
  flex: 1;
  height: 8px;
  border-radius: 100px;
  background: var(--bg-tertiary);
  transition: all 0.3s ease;
}

@media (min-width: 768px) {
  .progress-segment {
    height: 10px;
  }
}

.progress-segment.completed {
  background: var(--accent-tertiary);
  box-shadow: 0 2px 8px rgba(132, 204, 22, 0.2);
}

.progress-segment.current {
  background: linear-gradient(90deg, var(--accent-primary) 60%, var(--bg-tertiary) 60%);
  position: relative;
  overflow: hidden;
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

.ctrl-btn.warning {
  border-color: var(--accent-amber) !important;
  color: var(--accent-amber) !important;
}

.ctrl-btn.warning:hover {
  background: rgba(217, 119, 6, 0.1) !important;
}

.ctrl-btn.success {
  border-color: var(--accent-secondary) !important;
  color: var(--accent-secondary) !important;
}

.ctrl-btn.success:hover {
  background: rgba(34, 197, 94, 0.1) !important;
}

.ctrl-btn.danger {
  border-color: #dc2626 !important;
  color: #dc2626 !important;
}

.ctrl-btn.danger:hover {
  background: rgba(220, 38, 38, 0.1) !important;
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
