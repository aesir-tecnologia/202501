<script setup lang="ts">
import type { ProjectRow } from '~/lib/supabase/projects';
import type { StintRow } from '~/lib/supabase/stints';
import type { DailyProgress } from '~/types/progress';
import { PROJECT, STINT, type ProjectColor } from '~/constants';
import { getColorClasses, getColorPillClasses } from '~/utils/project-colors';
import { calculateRemainingSeconds } from '~/utils/stint-time';

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

const emit = defineEmits<{
  edit: [project: ProjectRow]
  toggleActive: [project: ProjectRow]
  startStint: [project: ProjectRow]
  pauseStint: [stint: StintRow]
  resumeStint: [stint: StintRow]
  completeStint: [stint: StintRow]
  resumePausedStint: [stint: StintRow]
  abandonPausedStint: [stint: StintRow]
}>();

function formatDuration(minutes: number | null): string {
  const duration = minutes ?? STINT.DURATION_MINUTES.DEFAULT;
  if (duration < 60) return `${duration}m`;
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function isProjectColor(color: unknown): color is ProjectColor {
  return PROJECT.COLORS.includes(color as ProjectColor);
}

// Extracted style constants for maintainability
const cardStyles = {
  base: [
    'group relative flex flex-col md:flex-row items-stretch rounded-2xl',
    'transition-all duration-300 ease-out overflow-hidden min-h-[120px]',
    'ring-1 ring-inset backdrop-blur-[2px]',
  ].join(' '),
  active: [
    'bg-gradient-to-br from-white/90 to-white/60 dark:from-slate-900/55 dark:to-slate-800/50',
    'ring-primary-500/25 shadow-lg',
    'hover:ring-primary-500/40 hover:shadow-xl hover:-translate-y-1',
  ].join(' '),
  inactive: [
    'bg-gradient-to-br from-white/60 to-white/40 dark:from-slate-900/35 dark:to-slate-800/35',
    'ring-slate-200/80 dark:ring-slate-800/80',
    'hover:ring-slate-300/80 dark:hover:ring-slate-700/80',
    'hover:from-white/70 hover:to-white/50 dark:hover:from-slate-900/45 dark:hover:to-slate-800/45',
    'hover:-translate-y-0.5 opacity-85 saturate-[0.95]',
  ].join(' '),
};

const hasActiveStint = computed(() => {
  return props.activeStint?.project_id === props.project.id;
});

const hasPausedStint = computed(() => {
  return props.pausedStint?.project_id === props.project.id;
});

const projectColor = computed(() => {
  const tag = props.project.color_tag;
  if (!isProjectColor(tag)) return null;
  return {
    ...getColorClasses(tag),
    pill: getColorPillClasses(tag),
  };
});

const statusPill = computed(() => {
  if (!props.project.is_active) {
    return {
      label: 'Inactive',
      classes: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    };
  }

  if (hasActiveStint.value) {
    if (isPaused.value) {
      return {
        label: 'Paused',
        classes: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
      };
    }

    return {
      label: 'Running',
      classes: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
    };
  }

  if (hasPausedStint.value) {
    return {
      label: 'Paused',
      classes: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
    };
  }

  // With pause-and-switch, other projects show "Ready" (dialog handles conflicts)
  return {
    label: 'Ready',
    classes: projectColor.value
      ? `${projectColor.value.pill.text} ${projectColor.value.pill.bg} ${projectColor.value.pill.border}`
      : 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-500/10 border-primary-200 dark:border-primary-500/20',
  };
});

const canStartStint = computed(() => {
  if (!props.project.is_active) return false;
  // Don't block if same project has the active stint
  if (hasActiveStint.value) return false;
  // Allow clicking even if another project has active stint - dialog handles conflicts
  return true;
});

// Timer state (from singleton)
const { isPaused, secondsRemaining } = useStintTimer();

const formattedTime = computed(() => {
  const mins = Math.floor(secondsRemaining.value / 60);
  const secs = secondsRemaining.value % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
});

// Paused stint remaining time (calculated locally since timer singleton only tracks active)
const pausedStintRemainingSeconds = computed(() => {
  if (!hasPausedStint.value || !props.pausedStint) return 0;
  return calculateRemainingSeconds(props.pausedStint);
});

const formattedPausedTime = computed(() => {
  const mins = Math.floor(pausedStintRemainingSeconds.value / 60);
  const secs = pausedStintRemainingSeconds.value % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
});

const progressSegmentsCount = computed(() => {
  const expected = Math.max(0, props.dailyProgress.expected);
  return Math.max(1, Math.min(expected, PROJECT.PROGRESS_BAR.MAX_SEGMENTS));
});

const filledSegmentsCount = computed(() => {
  const expected = Math.max(0, props.dailyProgress.expected);
  const completed = Math.max(0, props.dailyProgress.completed);

  if (expected <= PROJECT.PROGRESS_BAR.MAX_SEGMENTS) return Math.min(completed, progressSegmentsCount.value);
  if (expected === 0) return 0;

  const ratio = Math.min(completed / expected, 1);
  return Math.round(ratio * progressSegmentsCount.value);
});

const dailyProgressSummary = computed(() => {
  const expected = Math.max(0, props.dailyProgress.expected);
  const completed = Math.max(0, props.dailyProgress.completed);
  const extra = expected > 0 ? Math.max(0, completed - expected) : 0;

  return {
    text: expected > 0 ? `${completed}/${expected} today` : `${completed} today`,
    extraText: extra > 0 ? `+${extra} extra` : '',
  };
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

function handleResumePausedStint() {
  if (props.pausedStint) {
    emit('resumePausedStint', props.pausedStint);
  }
}

function handleAbandonPausedStint() {
  if (props.pausedStint) {
    emit('abandonPausedStint', props.pausedStint);
  }
}
</script>

<template>
  <li
    :class="[
      cardStyles.base,
      project.is_active ? cardStyles.active : cardStyles.inactive,
    ]"
  >
    <!-- Subtle Glass Highlight -->
    <div
      aria-hidden="true"
      class="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent dark:from-white/[0.06] pointer-events-none z-0"
    />

    <!-- Active Accent (left edge) -->
    <div
      v-if="project.is_active"
      aria-hidden="true"
      class="absolute left-0 top-0 h-full w-1.5 z-0 opacity-80"
      :class="projectColor?.bg ?? 'bg-primary-500'"
    />

    <!-- Background Progress Tint for Active Projects -->
    <div
      v-if="project.is_active"
      aria-hidden="true"
      class="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary-500/90 via-indigo-400/40 to-transparent opacity-25 transition-all duration-1000 z-0"
      :style="{ width: `${Math.max(5, dailyProgress.percentage)}%` }"
    />

    <!-- Main Content Area -->
    <div class="flex-1 p-5 md:p-6 flex flex-col justify-center gap-4 z-10">
      <div class="flex items-start gap-4">
        <!-- Drag Handle -->
        <div
          v-if="isDraggable"
          class="drag-handle hidden md:flex items-center text-slate-400 dark:text-slate-600 cursor-grab active:cursor-grabbing hover:text-slate-600 dark:hover:text-slate-400 mt-1"
        >
          <UIcon
            name="i-lucide-grip-vertical"
            class="w-5 h-5"
          />
        </div>

        <div class="flex-1 space-y-1">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-2 min-w-0 pt-0.5">
              <h3
                class="text-xl font-bold tracking-tight transition-colors truncate"
                :class="project.is_active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'"
              >
                {{ project.name }}
              </h3>

              <span
                class="shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border"
                :class="statusPill.classes"
              >
                {{ statusPill.label }}
              </span>
            </div>

            <!-- Desktop Toolbar -->
            <div class="hidden md:flex">
              <ProjectCardToolbar
                :is-active="project.is_active ?? true"
                :is-toggling="isToggling ?? false"
                variant="desktop"
                @toggle-active="handleToggleActive"
                @edit="handleEdit"
              />
            </div>

            <!-- Numeric Badge (Mobile Only) -->
            <div class="md:hidden flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300">
              <span :class="{ 'text-primary-600 dark:text-primary-400': dailyProgress.completed > 0 }">{{ dailyProgress.completed }}</span>
              <span class="text-slate-400 dark:text-slate-600">/</span>
              <span>{{ dailyProgress.expected }}</span>
            </div>
          </div>

          <div class="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <div class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded text-xs font-medium border border-slate-200 dark:border-slate-700/50">
              <UIcon
                name="i-lucide-clock"
                class="w-3 h-3 text-slate-500"
              />
              <span>{{ formatDuration(project.custom_stint_duration) }} / stint</span>
            </div>

            <div
              v-if="hasActiveStint"
              class="flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded border"
              :class="isPaused ? 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' : 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'"
            >
              <span
                v-if="!isPaused"
                class="relative flex h-2 w-2"
              >
                <span class="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <UIcon
                v-else
                name="i-lucide-pause"
                class="w-3 h-3"
              />
              <span class="tabular-nums">
                <span class="sr-only">Time remaining:</span>
                {{ formattedTime }}
              </span>
            </div>

            <div
              v-else-if="hasPausedStint"
              class="flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded border text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20"
            >
              <UIcon
                name="i-lucide-pause"
                class="w-3 h-3"
              />
              <span class="tabular-nums">
                <span class="sr-only">Time remaining:</span>
                {{ formattedPausedTime }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Visual Indicator: Segmented Progress Pills -->
      <div class="md:pl-9 space-y-2">
        <div class="flex items-end justify-between gap-3 text-xs mb-1.5">
          <span class="text-slate-500 font-semibold tracking-wide">
            Daily progress
          </span>

          <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
            <span class="tabular-nums">
              <span class="text-slate-900 dark:text-white">{{ dailyProgressSummary.text }}</span>
            </span>
            <span
              v-if="dailyProgressSummary.extraText"
              class="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-1.5 py-0.5 rounded-full font-semibold"
            >
              {{ dailyProgressSummary.extraText }}
            </span>
            <span
              v-if="dailyProgress.isMet"
              class="text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/20 px-1.5 py-0.5 rounded-full font-semibold"
            >
              Met
            </span>
          </div>
        </div>

        <div
          class="relative flex gap-1.5 h-2.5 w-full"
          role="progressbar"
          :aria-label="dailyProgress.expected > 0 ? `Daily progress: ${dailyProgress.completed} of ${dailyProgress.expected} stints completed today` : `Daily progress: ${dailyProgress.completed} stints completed today`"
          :aria-valuemin="0"
          :aria-valuemax="Math.max(1, dailyProgress.expected)"
          :aria-valuenow="Math.max(0, dailyProgress.completed)"
        >
          <!-- Subtle track behind segments -->
          <div
            aria-hidden="true"
            class="absolute inset-0 rounded-full bg-slate-100/70 dark:bg-slate-900/30 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800/70"
          />
          <div
            v-for="index in progressSegmentsCount"
            :key="index"
            class="relative h-full flex-1 rounded-full transition-all duration-500 ease-out border border-transparent overflow-hidden"
            :class="[
              index <= filledSegmentsCount
                ? [projectColor?.bg ?? 'bg-gradient-to-r from-primary-500 to-indigo-400', 'shadow-[0_0_10px_rgba(99,102,241,0.35)] ring-1 ring-inset ring-white/25']
                : 'bg-slate-200/90 dark:bg-slate-800/80 hover:bg-slate-300/90 dark:hover:bg-slate-700/80 ring-1 ring-inset ring-slate-200/60 dark:ring-slate-700/30',
            ]"
            :title="dailyProgress.expected <= PROJECT.PROGRESS_BAR.MAX_SEGMENTS ? `Stint ${index}` : `Progress segment ${index} of ${progressSegmentsCount}`"
          />
        </div>

        <p
          v-if="dailyProgress.expected > PROJECT.PROGRESS_BAR.MAX_SEGMENTS"
          class="text-[11px] leading-tight text-slate-400 dark:text-slate-500"
        >
          Showing {{ progressSegmentsCount }} segments (goal is {{ dailyProgress.expected }} stints).
        </p>
      </div>
    </div>

    <!-- Actions Section -->
    <div class="flex items-stretch border-t md:border-t-0 md:border-l border-white/5 bg-transparent z-10">
      <!-- Mobile Toolbar -->
      <div class="md:hidden flex items-center justify-center px-4 py-4">
        <ProjectCardToolbar
          :is-active="project.is_active ?? true"
          :is-toggling="isToggling ?? false"
          variant="mobile"
          @toggle-active="handleToggleActive"
          @edit="handleEdit"
        />
      </div>

      <!-- Right Action Group: Play/Pause/Stop (Dark Panel) -->
      <div class="w-24 md:w-24 md:border-l border-slate-200/80 dark:border-white/5 flex flex-col items-center justify-center py-4 md:py-0 bg-white/15 dark:bg-black/20">
        <div class="flex flex-col items-center justify-center rounded-2xl px-3 py-3 bg-white/25 dark:bg-black/25 ring-1 ring-inset ring-slate-200/60 dark:ring-white/10 backdrop-blur-md shadow-sm">
          <div
            v-if="hasActiveStint"
            class="flex flex-col gap-3"
          >
            <UTooltip :text="isPaused ? 'Resume' : 'Pause'">
              <button
                type="button"
                :disabled="isPausing || isCompleting"
                :aria-label="isPaused ? 'Resume stint' : 'Pause stint'"
                :aria-pressed="isPaused"
                class="group/btn w-11 h-11 rounded-2xl border transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0B1120] active:scale-[0.98] border-yellow-500/25 text-yellow-700 dark:text-yellow-400 bg-yellow-500/5 hover:bg-yellow-500/10 hover:border-yellow-500/40"
                @click="isPaused ? handleResumeStint() : handlePauseStint()"
              >
                <UIcon
                  v-if="isPausing"
                  name="i-lucide-loader-2"
                  class="w-[18px] h-[18px] animate-spin"
                />
                <UIcon
                  v-else
                  :name="isPaused ? 'i-lucide-play' : 'i-lucide-pause'"
                  class="w-[20px] h-[20px] opacity-85 group-hover/btn:opacity-100 fill-current"
                />
              </button>
            </UTooltip>

            <UTooltip text="Stop">
              <button
                type="button"
                :disabled="isPausing || isCompleting"
                aria-label="Stop stint"
                class="group/btn w-11 h-11 rounded-2xl border transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0B1120] active:scale-[0.98] border-red-500/25 text-red-700 dark:text-red-400 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/45"
                @click="handleCompleteStint"
              >
                <UIcon
                  v-if="isCompleting"
                  name="i-lucide-loader-2"
                  class="w-[18px] h-[18px] animate-spin"
                />
                <UIcon
                  v-else
                  name="i-lucide-square"
                  class="w-[20px] h-[20px] opacity-85 group-hover/btn:opacity-100 fill-current"
                />
              </button>
            </UTooltip>
          </div>

          <div
            v-else-if="hasPausedStint"
            class="flex flex-col gap-3"
          >
            <UTooltip text="Resume">
              <button
                type="button"
                :disabled="isPausing || isCompleting"
                aria-label="Resume paused stint"
                class="group/btn w-11 h-11 rounded-2xl border transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0B1120] active:scale-[0.98] border-yellow-500/25 text-yellow-700 dark:text-yellow-400 bg-yellow-500/5 hover:bg-yellow-500/10 hover:border-yellow-500/40"
                @click="handleResumePausedStint"
              >
                <UIcon
                  v-if="isPausing"
                  name="i-lucide-loader-2"
                  class="w-[18px] h-[18px] animate-spin"
                />
                <UIcon
                  v-else
                  name="i-lucide-play"
                  class="w-[20px] h-[20px] opacity-85 group-hover/btn:opacity-100 fill-current"
                />
              </button>
            </UTooltip>

            <UTooltip text="Abandon">
              <button
                type="button"
                :disabled="isPausing || isCompleting"
                aria-label="Abandon paused stint"
                class="group/btn w-11 h-11 rounded-2xl border transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0B1120] active:scale-[0.98] border-red-500/25 text-red-700 dark:text-red-400 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/45"
                @click="handleAbandonPausedStint"
              >
                <UIcon
                  v-if="isCompleting"
                  name="i-lucide-loader-2"
                  class="w-[18px] h-[18px] animate-spin"
                />
                <UIcon
                  v-else
                  name="i-lucide-x"
                  class="w-[20px] h-[20px] opacity-85 group-hover/btn:opacity-100"
                />
              </button>
            </UTooltip>
          </div>

          <div v-else>
            <UTooltip :text="project.is_active ? 'Start Session' : 'Activate project to start'">
              <button
                type="button"
                :disabled="!canStartStint || isStarting"
                aria-label="Start stint"
                class="group/play w-12 h-12 rounded-2xl border transition-all duration-200 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0B1120] active:scale-[0.98]"
                :class="[
                  canStartStint && !isStarting
                    ? 'border-slate-300/80 dark:border-slate-600/60 text-slate-700 dark:text-slate-200 bg-white/10 dark:bg-white/[0.03] hover:bg-white/20 dark:hover:bg-white/[0.06] hover:border-slate-400/80 dark:hover:border-slate-500/60 shadow-sm'
                    : 'border-slate-200/70 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50 bg-transparent',
                ]"
                @click="handleStartStint"
              >
                <UIcon
                  v-if="isStarting"
                  name="i-lucide-loader-2"
                  class="w-6 h-6 animate-spin"
                />
                <UIcon
                  v-else
                  name="i-lucide-play"
                  class="w-6 h-6 fill-current"
                  :class="{ 'ml-0.5': canStartStint }"
                />
              </button>
            </UTooltip>
          </div>
        </div>
      </div>
    </div>
  </li>
</template>

<style scoped>
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>
