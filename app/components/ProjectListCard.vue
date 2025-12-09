<script setup lang="ts">
import type { ProjectRow } from '~/lib/supabase/projects';
import type { StintRow } from '~/lib/supabase/stints';
import type { DailyProgress } from '~/types/progress';

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
  // TODO: When user_preferences is implemented, fall back to user's default_stint_duration before using global default
  const GLOBAL_DEFAULT_DURATION = 45;
  const duration = minutes ?? GLOBAL_DEFAULT_DURATION;
  if (duration < 60) return `${duration}m`;
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

const hasActiveStint = computed(() => {
  return props.activeStint?.project_id === props.project.id;
});

const canStartStint = computed(() => {
  if (!props.project.is_active) return false;
  if (props.activeStint) return false;
  return true;
});

// Timer state (from singleton)
const { isPaused, secondsRemaining } = useStintTimer();

const formattedTime = computed(() => {
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
      'group relative flex flex-col md:flex-row items-stretch rounded-2xl transition-all duration-300 ease-out border overflow-hidden min-h-[120px]',
      project.is_active
        ? 'bg-white/80 dark:bg-slate-800/80 border-primary-500/30 shadow-lg hover:border-primary-500/50 hover:shadow-xl hover:-translate-y-1'
        : 'bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:-translate-y-0.5 opacity-80',
    ]"
  >
    <!-- Background Progress Tint for Active Projects -->
    <div
      v-if="project.is_active"
      class="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary-500 to-transparent opacity-20 transition-all duration-1000 z-0"
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
          <div class="flex items-center justify-between">
            <h3
              class="text-xl font-bold tracking-tight transition-colors"
              :class="project.is_active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'"
            >
              {{ project.name }}
            </h3>

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
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <UIcon
                v-else
                name="i-lucide-pause"
                class="w-3 h-3"
              />
              <span class="tabular-nums">{{ formattedTime }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Visual Indicator: Segmented Progress Pills -->
      <div class="md:pl-9 space-y-2">
        <div class="flex justify-between items-end text-xs mb-1.5">
          <span class="text-slate-500 font-medium uppercase tracking-wider">Daily Progress</span>
          <span class="hidden md:block text-slate-400 font-medium">
            <span class="text-slate-900 dark:text-white">{{ dailyProgress.completed }}</span> of {{ dailyProgress.expected }} completed
          </span>
        </div>
        <div class="flex gap-1.5 h-2.5 w-full">
          <div
            v-for="index in Math.max(1, dailyProgress.expected)"
            :key="index"
            class="h-full flex-1 rounded-full transition-all duration-500 ease-out border border-transparent"
            :class="[
              index <= dailyProgress.completed
                ? 'bg-gradient-to-r from-primary-500 to-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                : 'bg-slate-200 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700',
            ]"
            :title="`Stint ${index}`"
          />
        </div>
      </div>
    </div>

    <!-- Actions Section -->
    <div class="flex items-stretch border-t md:border-t-0 md:border-l border-white/5 bg-transparent z-10">
      <!-- Left Action Group: Toggle & Settings -->
      <div class="flex items-center gap-3 px-6 py-4 md:py-0 md:bg-gray-50/50 md:dark:bg-white/[0.02] md:border-r border-slate-200 dark:border-white/5">
        <div class="flex items-center gap-3">
          <span class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider md:hidden">Status</span>
          <UTooltip :text="project.is_active ? 'Deactivate project' : 'Activate project'">
            <USwitch
              :model-value="project.is_active ?? true"
              :loading="isToggling"
              :disabled="isToggling"
              size="lg"
              checked-icon="i-lucide-check"
              unchecked-icon="i-lucide-power"
              @update:model-value="handleToggleActive"
            />
          </UTooltip>
        </div>

        <div class="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block" />

        <UTooltip text="Settings">
          <UButton
            icon="i-lucide-settings-2"
            color="neutral"
            variant="ghost"
            size="sm"
            class="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 transition-colors rounded-full"
            aria-label="Edit project settings"
            @click="handleEdit"
          />
        </UTooltip>
      </div>

      <!-- Right Action Group: Play/Pause/Stop (Dark Panel) -->
      <div class="w-20 bg-gray-100/50 dark:bg-[#0B1120] border-l border-slate-200 dark:border-white/5 flex flex-col items-center justify-center gap-4 py-4 md:py-0 transition-colors hover:bg-gray-200/50 dark:hover:bg-black/40">
        <div
          v-if="hasActiveStint"
          class="flex flex-col gap-3"
        >
          <UTooltip :text="isPaused ? 'Resume' : 'Pause'">
            <button
              :disabled="isPausing || isCompleting"
              :aria-label="isPaused ? 'Resume stint' : 'Pause stint'"
              class="group/btn p-1.5 rounded-lg border border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-500/10 transition-all text-yellow-600 dark:text-yellow-500 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-yellow-500/30 disabled:hover:bg-transparent"
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
                class="w-[18px] h-[18px] opacity-80 group-hover/btn:opacity-100 fill-current"
              />
            </button>
          </UTooltip>

          <UTooltip text="Stop">
            <button
              :disabled="isPausing || isCompleting"
              aria-label="Stop stint"
              class="group/btn p-1.5 rounded-lg border border-red-500/30 hover:border-red-500 hover:bg-red-500/10 transition-all text-red-600 dark:text-red-500 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-red-500/30 disabled:hover:bg-transparent"
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
                class="w-[18px] h-[18px] opacity-80 group-hover/btn:opacity-100 fill-current"
              />
            </button>
          </UTooltip>
        </div>

        <div v-else>
          <UTooltip :text="project.is_active ? 'Start Session' : 'Activate project to start'">
            <button
              :disabled="!canStartStint || isStarting"
              aria-label="Start stint"
              class="group/play p-3 rounded-xl border transition-all duration-300 flex items-center justify-center"
              :class="[
                canStartStint && !isStarting
                  ? 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-white hover:bg-white/5 hover:scale-110 shadow-lg'
                  : 'border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50',
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
  </li>
</template>

<style scoped>
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>
