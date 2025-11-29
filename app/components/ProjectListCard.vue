<script setup lang="ts">
import type { ProjectRow } from '~/lib/supabase/projects';
import type { StintRow } from '~/lib/supabase/stints';
import type { DailyProgress } from '~/types/progress';
import { resolveStintDuration } from '~/utils/stint-duration';

const props = defineProps<{
  project: ProjectRow
  activeStint: StintRow | null
  dailyProgress: DailyProgress
  isToggling?: boolean
  isStarting?: boolean
  isDraggable?: boolean
  isPausing?: boolean
  isCompleting?: boolean
}>();

const emit = defineEmits<{
  edit: [project: ProjectRow]
  toggleActive: [project: ProjectRow]
  startStint: [project: ProjectRow]
  pauseStint: [stint: StintRow]
  resumeStint: [stint: StintRow]
  completeStint: [stint: StintRow]
}>();

function formatDuration(minutes: number | null): string {
  const duration = resolveStintDuration({ projectCustomDuration: minutes });
  if (duration < 60) return `${duration}m`;
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function getColorBorderClass(colorTag: string | null): string {
  if (!colorTag) return '';

  const colorMap: Record<string, string> = {
    red: 'border-l-red-500',
    orange: 'border-l-orange-500',
    amber: 'border-l-amber-500',
    green: 'border-l-green-500',
    teal: 'border-l-teal-500',
    blue: 'border-l-blue-500',
    purple: 'border-l-purple-500',
    pink: 'border-l-pink-500',
  };

  return colorMap[colorTag] || '';
}

const hasActiveStint = computed(() => {
  return props.activeStint?.project_id === props.project.id;
});

const canStartStint = computed(() => {
  if (!props.project.is_active) return false;
  if (props.activeStint) return false;
  return true;
});

const isCheckingCanStart = computed(() => false);

const disabledReason = computed(() => {
  if (!props.project.is_active) return 'Project is inactive';
  if (props.activeStint) return 'Stop current stint to start new one';
  return '';
});

// Computed: Progress text display
const progressText = computed(() => {
  const progress = props.dailyProgress;

  if (progress.expected === 0) {
    return '0 stints/day';
  }

  if (progress.isOverAchieving) {
    return `${progress.completed}/${progress.expected} 🔥`;
  }

  return `${progress.completed}/${progress.expected} stints`;
});

// Computed: Progress bar color
const progressBarColor = computed(() => {
  const progress = props.dailyProgress;
  if (progress.isMet) return 'success';
  return 'primary';
});

// Timer state (from singleton)
const { secondsRemaining, isPaused } = useStintTimer();

// Computed: Timer text display
const timerText = computed(() => {
  if (!hasActiveStint.value) return '';

  const mins = Math.floor(secondsRemaining.value / 60);
  const secs = secondsRemaining.value % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
});

// Event handlers
function handleEdit() {
  emit('edit', props.project);
}

function handleToggleActive() {
  emit('toggleActive', props.project);
}

function handleStartStint() {
  emit('startStint', props.project);
}

function handlePauseStint() {
  if (props.activeStint) {
    emit('pauseStint', props.activeStint);
  }
}

function handleResumeStint() {
  if (props.activeStint) {
    emit('resumeStint', props.activeStint);
  }
}

function handleCompleteStint() {
  if (props.activeStint) {
    emit('completeStint', props.activeStint);
  }
}
</script>

<template>
  <li
    :class="[
      'grid grid-cols-[40px_1fr_auto_auto_96px] items-center gap-3 p-4 rounded-lg border-2 motion-safe:transition-all border-l-4',
      'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700',
      getColorBorderClass(project.color_tag),
    ]"
  >
    <!-- Drag handle (always reserves space, visible only for active projects) -->
    <div :class="{ invisible: !isDraggable }">
      <UTooltip
        text="Reorder project"
        :disabled="!isDraggable"
      >
        <button
          type="button"
          class="drag-handle cursor-move p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded motion-safe:transition-all motion-safe:duration-200"
          :aria-label="isDraggable ? 'Reorder project' : undefined"
          :disabled="!isDraggable"
          :tabindex="isDraggable ? 0 : -1"
        >
          <Icon
            name="i-lucide-grip-vertical"
            class="h-5 w-5 text-neutral-400 dark:text-neutral-500"
          />
        </button>
      </UTooltip>
    </div>

    <!-- Project Info Block -->
    <div class="min-w-0">
      <!-- Row 1: Name + Badges -->
      <div class="flex items-center gap-2">
        <h3 class="text-base font-medium leading-normal text-neutral-900 dark:text-neutral-50 truncate">
          {{ project.name }}
        </h3>
        <!-- Inactive badge (only for inactive projects) -->
        <UBadge
          v-if="!project.is_active"
          color="neutral"
          variant="subtle"
          size="sm"
        >
          Inactive
        </UBadge>
        <!-- Goal met celebration badge -->
        <UBadge
          v-if="project.is_active && dailyProgress.isMet"
          color="success"
          variant="subtle"
          size="sm"
        >
          <Icon
            name="i-lucide-check-circle"
            class="h-3 w-3"
          />
        </UBadge>
      </div>

      <!-- Row 2: Metadata icons (stints/day | duration | progress | timer) -->
      <div class="mt-1 flex items-center gap-4 text-sm leading-normal text-neutral-500 dark:text-neutral-400">
        <span class="flex items-center gap-1">
          <Icon
            name="i-lucide-repeat"
            class="h-4 w-4"
          />
          {{ project.expected_daily_stints }} stints/day
        </span>
        <span class="flex items-center gap-1">
          <Icon
            name="i-lucide-timer"
            class="h-4 w-4"
          />
          {{ formatDuration(project.custom_stint_duration) }} per stint
        </span>
        <!-- Progress text (inline) -->
        <span
          v-if="project.is_active"
          :class="[
            'flex items-center gap-1 font-medium',
            dailyProgress.isMet ? 'text-success-600 dark:text-success-400' : 'text-neutral-700 dark:text-neutral-300',
          ]"
          :aria-label="`Daily progress: ${dailyProgress.completed} of ${dailyProgress.expected} stints completed`"
        >
          {{ progressText }}
        </span>
        <!-- Timer display (when active stint) -->
        <span
          v-if="hasActiveStint && timerText"
          class="flex items-center gap-1 font-mono font-semibold tabular-nums"
          :class="isPaused ? 'text-warning-600 dark:text-warning-400' : 'text-success-600 dark:text-success-400'"
        >
          <Icon
            :name="isPaused ? 'i-lucide-pause-circle' : 'i-lucide-play-circle'"
            class="h-4 w-4"
          />
          {{ timerText }}
        </span>
      </div>

      <!-- Row 3: Progress bar (if active project) -->
      <div
        v-if="project.is_active && dailyProgress.expected > 0"
        class="mt-2"
      >
        <UProgress
          :model-value="dailyProgress.percentage"
          :color="progressBarColor"
          size="sm"
        />
      </div>
    </div>

    <!-- Toggle Switch -->
    <UTooltip :text="project.is_active ? 'Deactivate project' : 'Activate project'">
      <span>
        <USwitch
          :model-value="project.is_active ?? true"
          :loading="isToggling"
          :disabled="isToggling"
          aria-label="Toggle project active status"
          @update:model-value="handleToggleActive"
        />
      </span>
    </UTooltip>

    <!-- Settings Button -->
    <UTooltip text="Edit project">
      <span>
        <UButton
          icon="i-lucide-settings"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Edit project"
          class="motion-safe:transition-all motion-safe:duration-200"
          @click="handleEdit"
        />
      </span>
    </UTooltip>

    <!-- Action Buttons -->
    <div class="flex flex-col items-stretch gap-2 w-24">
      <!-- Play button (when no active stint and project is active) -->
      <UTooltip
        v-if="canStartStint"
        text="Start stint"
      >
        <span>
          <UButton
            icon="i-lucide-play"
            color="neutral"
            variant="ghost"
            size="md"
            :loading="isStarting || isCheckingCanStart"
            :disabled="isStarting || isCheckingCanStart"
            aria-label="Start stint"
            @click="handleStartStint"
          />
        </span>
      </UTooltip>

      <!-- Pause/Resume button (when stint is active on this project) -->
      <UTooltip
        v-if="hasActiveStint"
        :text="isPaused ? 'Resume stint' : 'Pause stint'"
      >
        <span>
          <UButton
            :icon="isPaused ? 'i-lucide-play' : 'i-lucide-pause'"
            color="warning"
            variant="ghost"
            size="md"
            :loading="isPausing"
            :disabled="isPausing || isCompleting"
            :aria-label="isPaused ? 'Resume stint' : 'Pause stint'"
            @click="isPaused ? handleResumeStint() : handlePauseStint()"
          />
        </span>
      </UTooltip>

      <!-- Stop button (when stint is active on this project) -->
      <UTooltip
        v-if="hasActiveStint"
        text="Stop stint"
      >
        <span>
          <UButton
            icon="i-lucide-square"
            color="error"
            variant="ghost"
            size="md"
            :loading="isCompleting"
            :disabled="isPausing || isCompleting"
            aria-label="Stop stint"
            @click="handleCompleteStint"
          />
        </span>
      </UTooltip>

      <!-- Disabled play button with tooltip (when can't start) -->
      <UTooltip
        v-if="!canStartStint && !hasActiveStint"
        :text="disabledReason || 'Cannot start stint'"
      >
        <span>
          <UButton
            icon="i-lucide-play"
            color="neutral"
            variant="ghost"
            size="md"
            :loading="isCheckingCanStart"
            :disabled="true"
            aria-label="Start stint (disabled)"
          />
        </span>
      </UTooltip>
    </div>
  </li>
</template>

<style scoped>
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>
