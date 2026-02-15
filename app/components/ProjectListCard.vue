<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core';
import type { ProjectRow } from '~/lib/supabase/projects';
import type { StintRow } from '~/lib/supabase/stints';
import type { DailyProgress } from '~/types/progress';
import { PROJECT, STINT, type ProjectColor } from '~/constants';
import { formatDuration, formatClockTime, formatRelativeTime } from '~/utils/time-format';
import { parseSafeDate } from '~/utils/date-helpers';
import { createLogger } from '~/utils/logger';

const props = defineProps<{
  project: ProjectRow
  activeStint: StintRow | null
  pausedStint: StintRow | null
  dailyProgress: DailyProgress
  isToggling?: boolean
  isStarting?: boolean
  isDraggable?: boolean
  isPausing?: boolean
  isCompleting?: boolean
}>();

const log = createLogger('project-list-card');

const emit = defineEmits<{
  edit: [project: ProjectRow]
  toggleActive: [project: ProjectRow]
  startStint: [project: ProjectRow]
  pauseStint: [stint: StintRow]
  resumeStint: [stint: StintRow]
  completeStint: [stint: StintRow]
}>();

function formatProjectDuration(minutes: number | null): string {
  const mins = minutes ?? STINT.DURATION_MINUTES.DEFAULT;
  return formatDuration(mins * 60);
}

const now = ref(new Date());

useIntervalFn(() => {
  now.value = new Date();
}, 30000);

const hasActiveStint = computed(() => {
  return props.activeStint?.project_id === props.project.id;
});

const hasPausedStint = computed(() => {
  return props.pausedStint?.project_id === props.project.id;
});

const { isPaused } = useStintTimer();

const showStintsModal = ref(false);

const metaText = computed(() => {
  if (hasActiveStint.value && !isPaused.value) {
    const startedAt = parseSafeDate(props.activeStint?.started_at);
    if (startedAt) {
      return `Started ${formatClockTime(startedAt)}`;
    }
  }

  if (hasPausedStint.value || (hasActiveStint.value && isPaused.value)) {
    const pausedAt = parseSafeDate(props.pausedStint?.paused_at || props.activeStint?.paused_at);
    if (pausedAt) {
      return `Paused ${formatRelativeTime(pausedAt, now.value)}`;
    }
  }

  if (!props.project.is_active) {
    return 'Inactive';
  }

  return `${formatProjectDuration(props.project.custom_stint_duration)} per stint`;
});

const extraStints = computed(() => {
  const { completed, expected } = props.dailyProgress;
  if (expected > 0 && completed > expected) {
    return completed - expected;
  }
  return 0;
});

const colorRingClass = computed(() => {
  const color = props.project.color_tag;
  if (!color || !PROJECT.COLORS.includes(color as ProjectColor)) {
    return 'border-stone-400 dark:border-stone-500';
  }

  const ringColorMap: Record<ProjectColor, string> = {
    red: 'border-red-500',
    orange: 'border-orange-500',
    amber: 'border-amber-500',
    green: 'border-green-500',
    teal: 'border-teal-500',
    blue: 'border-blue-500',
    purple: 'border-purple-500',
    pink: 'border-pink-500',
  };

  return ringColorMap[color as ProjectColor];
});

const canStartStint = computed(() => {
  if (!props.project.is_active) return false;
  if (hasActiveStint.value) return false;
  return true;
});

function handleEdit() {
  emit('edit', props.project);
}

function handleStartStint() {
  emit('startStint', props.project);
}

function handlePauseStint() {
  if (!props.activeStint) {
    log.error('[ProjectListCard] handlePauseStint called but activeStint is null');
    return;
  }
  emit('pauseStint', props.activeStint);
}

function handleResumeStint() {
  if (props.activeStint) {
    emit('resumeStint', props.activeStint);
    return;
  }
  if (props.pausedStint) {
    emit('resumeStint', props.pausedStint);
    return;
  }
  log.error('[ProjectListCard] handleResumeStint called without active or paused stint');
}

function handleCompleteStint() {
  const stint = props.activeStint || props.pausedStint;
  if (!stint) {
    log.error('[ProjectListCard] handleCompleteStint called without any stint');
    return;
  }
  emit('completeStint', stint);
}
</script>

<template>
  <li
    class="card-v27"
    :class="{
      'state-running': hasActiveStint && !isPaused,
      'state-paused': hasPausedStint || (hasActiveStint && isPaused),
      'state-inactive': !project.is_active,
    }"
  >
    <div
      v-if="isDraggable"
      class="drag-handle"
    >
      <UIcon
        name="i-lucide-grip-vertical"
        class="w-4 h-4"
      />
    </div>

    <div class="project-color-wrapper">
      <div
        class="project-color"
        :class="colorRingClass"
      />
      <span
        v-if="hasPausedStint || (hasActiveStint && isPaused)"
        class="paused-indicator"
      />
    </div>

    <div class="project-info">
      <div class="project-name">
        {{ project.name }}
      </div>
      <div
        class="project-meta"
        :class="{
          'text-green-600 dark:text-green-400': hasActiveStint && !isPaused,
          'text-amber-600 dark:text-amber-400': hasPausedStint || isPaused,
        }"
      >
        {{ metaText }}
      </div>
    </div>

    <button
      type="button"
      class="progress-badge progress-badge-btn"
      aria-label="View completed stints"
      @click="showStintsModal = true"
    >
      <span class="filled">{{ dailyProgress.completed }}</span>
      <span class="sep">/</span>
      <span>{{ dailyProgress.expected }}</span>
      <span
        v-if="extraStints > 0"
        class="extra"
      >+{{ extraStints }}</span>
    </button>

    <StintProgressModal
      v-model:open="showStintsModal"
      :project-id="project.id"
      :project-name="project.name"
    />

    <UTooltip text="Edit Project">
      <button
        type="button"
        class="edit-btn"
        aria-label="Edit project"
        @click="handleEdit"
      >
        <UIcon
          name="i-lucide-pencil"
          class="w-4 h-4"
        />
      </button>
    </UTooltip>

    <div
      v-if="hasActiveStint || hasPausedStint"
      class="action-buttons"
    >
      <UTooltip :text="isPaused || hasPausedStint ? 'Resume' : 'Pause'">
        <button
          type="button"
          class="action-btn"
          :class="isPaused || hasPausedStint ? 'resume' : 'pause'"
          :disabled="isPausing || isCompleting"
          :aria-label="isPaused || hasPausedStint ? 'Resume stint' : 'Pause stint'"
          @click="isPaused || hasPausedStint ? handleResumeStint() : handlePauseStint()"
        >
          <UIcon
            v-if="isPausing"
            name="i-lucide-loader-2"
            class="w-4 h-4 animate-spin"
          />
          <UIcon
            v-else
            :name="isPaused || hasPausedStint ? 'i-lucide-step-forward' : 'i-lucide-pause'"
            class="w-4 h-4"
          />
        </button>
      </UTooltip>

      <UTooltip text="Stop">
        <button
          type="button"
          class="action-btn stop"
          :disabled="isPausing || isCompleting"
          aria-label="Stop stint"
          @click="handleCompleteStint"
        >
          <UIcon
            v-if="isCompleting"
            name="i-lucide-loader-2"
            class="w-4 h-4 animate-spin"
          />
          <UIcon
            v-else
            name="i-lucide-square"
            class="w-4 h-4"
          />
        </button>
      </UTooltip>
    </div>

    <UTooltip
      v-else
      :text="project.is_active ? 'Start Session' : 'Activate project to start'"
    >
      <button
        type="button"
        class="play-btn"
        :disabled="!canStartStint || isStarting"
        aria-label="Start stint"
        @click="handleStartStint"
      >
        <UIcon
          v-if="isStarting"
          name="i-lucide-loader-2"
          class="w-5 h-5 animate-spin"
        />
        <UIcon
          v-else
          name="i-lucide-play"
          class="w-5 h-5"
        />
      </button>
    </UTooltip>
  </li>
</template>

<style scoped>
.card-v27 {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  transition: all 0.15s ease;
}

:root.dark .card-v27 {
  background: rgba(41, 37, 36, 0.5);
  border-color: rgba(255, 255, 255, 0.08);
}

.card-v27.state-running {
  box-shadow: 0 2px 12px rgba(22, 163, 74, 0.1);
}

.card-v27.state-paused {
  box-shadow: 0 2px 12px rgba(217, 119, 6, 0.12);
  border-color: rgba(217, 119, 6, 0.2);
}

:root.dark .card-v27.state-paused {
  box-shadow: 0 2px 16px rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.15);
}

.card-v27.state-inactive {
  opacity: 0.7;
  filter: saturate(0.85);
}

.card-v27.state-inactive .project-name {
  color: var(--color-stone-500);
}

:root.dark .card-v27.state-inactive .project-name {
  color: var(--color-stone-400);
}

.drag-handle {
  display: flex;
  align-items: center;
  color: rgba(120, 113, 108, 0.4);
  cursor: grab;
  transition: color 0.15s ease;
}

.drag-handle:hover {
  color: var(--color-stone-500);
}

.drag-handle:active {
  cursor: grabbing;
}

:root.dark .drag-handle {
  color: rgba(168, 162, 158, 0.3);
}

:root.dark .drag-handle:hover {
  color: var(--color-stone-400);
}

.project-color-wrapper {
  position: relative;
  flex-shrink: 0;
}

.project-color {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  flex-shrink: 0;
  background: transparent;
  border-width: 3.5px;
  border-style: solid;
}

.paused-indicator {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 10px;
  height: 12px;
  display: flex;
  gap: 2px;
  animation: indicator-pulse 2s ease-in-out infinite;
}

.paused-indicator::before,
.paused-indicator::after {
  content: '';
  width: 3px;
  height: 100%;
  background: #b45309;
  border-radius: 1px;
}

:root.dark .paused-indicator::before,
:root.dark .paused-indicator::after {
  background: #fbbf24;
}

@keyframes indicator-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

.project-info {
  flex: 1;
  min-width: 0;
}

.project-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-stone-900);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:root.dark .project-name {
  color: var(--color-stone-50);
}

.project-meta {
  font-size: 13px;
  color: var(--color-stone-500);
}

:root.dark .project-meta {
  color: var(--color-stone-400);
}

.progress-badge {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-stone-500);
  background: var(--color-stone-100);
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--color-stone-200);
}

:root.dark .progress-badge {
  background: var(--color-stone-800);
  border-color: var(--color-stone-700);
  color: var(--color-stone-400);
}

.progress-badge .filled {
  color: #16a34a;
}

:root.dark .progress-badge .filled {
  color: #4ade80;
}

.progress-badge-btn {
  cursor: pointer;
  transition: all 0.15s ease;
}

.progress-badge-btn:hover {
  background: rgba(120, 113, 108, 0.15);
  border-color: var(--color-stone-300);
}

:root.dark .progress-badge-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: var(--color-stone-600);
}

.progress-badge .sep {
  opacity: 0.5;
}

.progress-badge .extra {
  color: #15803d;
  margin-left: 4px;
  font-weight: 700;
}

:root.dark .progress-badge .extra {
  color: #4ade80;
}

.card-v27.state-inactive .progress-badge .filled {
  color: var(--color-stone-500);
}

:root.dark .card-v27.state-inactive .progress-badge .filled {
  color: var(--color-stone-500);
}

.edit-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: rgba(120, 113, 108, 0.08);
  color: var(--color-stone-500);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.edit-btn:hover {
  background: rgba(120, 113, 108, 0.15);
  color: var(--color-stone-700);
}

:root.dark .edit-btn {
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-stone-400);
}

:root.dark .edit-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: var(--color-stone-200);
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  background: transparent;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.pause {
  color: #b45309;
  border-color: rgba(217, 119, 6, 0.25);
  background: rgba(217, 119, 6, 0.05);
}

.action-btn.pause:hover:not(:disabled) {
  background: rgba(217, 119, 6, 0.15);
  border-color: rgba(217, 119, 6, 0.4);
}

:root.dark .action-btn.pause {
  color: #fbbf24;
}

.action-btn.resume {
  color: #16a34a;
  border-color: rgba(22, 163, 74, 0.25);
  background: rgba(22, 163, 74, 0.05);
}

.action-btn.resume:hover:not(:disabled) {
  background: rgba(22, 163, 74, 0.15);
  border-color: rgba(22, 163, 74, 0.4);
}

:root.dark .action-btn.resume {
  color: #4ade80;
  border-color: rgba(74, 222, 128, 0.25);
  background: rgba(74, 222, 128, 0.1);
}

:root.dark .action-btn.resume:hover:not(:disabled) {
  background: rgba(74, 222, 128, 0.2);
  border-color: rgba(74, 222, 128, 0.4);
}

.action-btn.stop {
  color: #dc2626;
  border-color: rgba(220, 38, 38, 0.25);
  background: rgba(220, 38, 38, 0.05);
}

.action-btn.stop:hover:not(:disabled) {
  background: rgba(220, 38, 38, 0.15);
  border-color: rgba(220, 38, 38, 0.4);
}

:root.dark .action-btn.stop {
  color: #f87171;
}

.play-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: rgba(22, 101, 52, 0.05);
  color: #166534;
  border: 1px solid rgba(22, 101, 52, 0.25);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.play-btn:hover:not(:disabled) {
  background: rgba(22, 101, 52, 0.15);
  border-color: rgba(22, 101, 52, 0.4);
}

:root.dark .play-btn {
  background: rgba(34, 197, 94, 0.05);
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.25);
}

:root.dark .play-btn:hover:not(:disabled) {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.4);
}

.play-btn:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

@media (max-width: 640px) {
  .card-v27 {
    flex-wrap: wrap;
    gap: 10px;
    padding: 12px 16px;
  }

  .project-info {
    order: 1;
    flex-basis: calc(100% - 50px);
  }

  .drag-handle {
    order: 0;
  }

  .project-color-wrapper {
    order: 0;
  }

  .progress-badge {
    order: 2;
  }

  .edit-btn {
    order: 3;
  }

  .action-buttons,
  .play-btn {
    order: 3;
    margin-left: auto;
  }
}
</style>
