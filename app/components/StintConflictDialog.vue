<script setup lang="ts">
export type ConflictResolutionAction
  = | 'pause-and-switch'
    | 'complete-active-and-start'
    | 'start-alongside'
    | 'complete-paused-and-start'
    | 'resume-paused'
    | 'cancel'
    | 'dismiss-dual-conflict';

interface ExistingStintInfo {
  id: string
  status: 'active' | 'paused'
  projectName: string
  remainingSeconds: number
}

export interface DualConflictInfo {
  activeStint: { projectName: string, remainingSeconds: number }
  pausedStint: { projectName: string, remainingSeconds: number }
}

interface Props {
  existingStint?: ExistingStintInfo
  dualConflict?: DualConflictInfo
  newProjectName: string
  isPending?: boolean
}

const props = defineProps<Props>();
const isOpen = defineModel<boolean>('open', { required: true });

const emit = defineEmits<{
  resolve: [action: ConflictResolutionAction]
}>();

function handleAction(action: ConflictResolutionAction) {
  emit('resolve', action);
}

function handleCancel() {
  handleAction('cancel');
  isOpen.value = false;
}

const formattedTime = computed(() => {
  if (!props.existingStint) return '0:00';
  const mins = Math.floor(props.existingStint.remainingSeconds / 60);
  const secs = props.existingStint.remainingSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
});

const isDualConflict = computed(() => !!props.dualConflict);

const isExistingActive = computed(() => props.existingStint?.status === 'active');

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const dialogTitle = computed(() => {
  if (isDualConflict.value) return 'Cannot Start Stint';
  return isExistingActive.value ? 'Switch Projects?' : 'Start New Stint?';
});

const statusLabel = computed(() =>
  isExistingActive.value ? 'running' : 'paused',
);

const statusBgClass = computed(() =>
  isExistingActive.value
    ? 'bg-green-50 dark:bg-green-950/50'
    : 'bg-amber-50 dark:bg-amber-950/50',
);

const statusTextClass = computed(() =>
  isExistingActive.value
    ? 'text-green-800 dark:text-green-200'
    : 'text-amber-800 dark:text-amber-200',
);
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="dialogTitle"
    :description="isDualConflict
      ? 'You have two stints in progress'
      : `Manage existing stint on ${existingStint?.projectName} before starting ${newProjectName}`"
  >
    <template #content>
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">
            {{ dialogTitle }}
          </h3>
        </template>

        <!-- Dual-conflict mode: Both active AND paused stints exist -->
        <div
          v-if="isDualConflict && dualConflict"
          class="space-y-4"
        >
          <div class="rounded-lg bg-red-50 dark:bg-red-950/50 p-4">
            <div class="flex items-start gap-3">
              <UIcon
                name="i-lucide-alert-circle"
                class="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 shrink-0"
              />
              <div>
                <p class="text-sm font-medium text-red-800 dark:text-red-200">
                  Cannot start a third stint
                </p>
                <p class="mt-1 text-sm text-red-700 dark:text-red-300">
                  You already have two stints in progress.
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-lg bg-green-50 dark:bg-green-950/50 p-4">
            <p class="text-sm text-green-800 dark:text-green-200">
              <strong>Active:</strong> {{ dualConflict.activeStint.projectName }}
              <span class="tabular-nums">({{ formatTime(dualConflict.activeStint.remainingSeconds) }} remaining)</span>
            </p>
          </div>

          <div class="rounded-lg bg-amber-50 dark:bg-amber-950/50 p-4">
            <p class="text-sm text-amber-800 dark:text-amber-200">
              <strong>Paused:</strong> {{ dualConflict.pausedStint.projectName }}
              <span class="tabular-nums">({{ formatTime(dualConflict.pausedStint.remainingSeconds) }} remaining)</span>
            </p>
          </div>

          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Complete or abandon one of your existing stints before starting <strong>{{ newProjectName }}</strong>.
          </p>
        </div>

        <!-- Single-conflict mode: Either active OR paused stint exists -->
        <div
          v-else-if="existingStint"
          class="space-y-4"
        >
          <div
            :class="['rounded-lg p-4', statusBgClass]"
          >
            <p :class="['text-sm', statusTextClass]">
              <strong>{{ existingStint.projectName }}</strong> is {{ statusLabel }}
              with <strong class="tabular-nums">{{ formattedTime }}</strong> remaining.
            </p>
          </div>

          <p class="text-sm text-slate-600 dark:text-slate-400">
            You're about to start a stint on <strong>{{ newProjectName }}</strong>.
          </p>

          <div
            v-if="isExistingActive"
            class="space-y-2"
          >
            <UButton
              block
              color="primary"
              :loading="isPending"
              @click="handleAction('pause-and-switch')"
            >
              <UIcon
                name="i-lucide-pause"
                class="w-4 h-4 mr-1"
              />
              Pause & Switch
            </UButton>

            <UButton
              block
              variant="outline"
              :disabled="isPending"
              @click="handleAction('complete-active-and-start')"
            >
              <UIcon
                name="i-lucide-check-circle"
                class="w-4 h-4 mr-1"
              />
              Complete Current & Start New
            </UButton>
          </div>

          <div
            v-else
            class="space-y-2"
          >
            <UButton
              block
              color="primary"
              :loading="isPending"
              @click="handleAction('start-alongside')"
            >
              <UIcon
                name="i-lucide-play"
                class="w-4 h-4 mr-1"
              />
              Start New Stint
            </UButton>

            <UButton
              block
              variant="outline"
              :disabled="isPending"
              @click="handleAction('complete-paused-and-start')"
            >
              <UIcon
                name="i-lucide-check-circle"
                class="w-4 h-4 mr-1"
              />
              Complete Paused & Start New
            </UButton>

            <UButton
              block
              variant="ghost"
              :disabled="isPending"
              @click="handleAction('resume-paused')"
            >
              <UIcon
                name="i-lucide-play-circle"
                class="w-4 h-4 mr-1"
              />
              Resume Paused Instead
            </UButton>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton
              v-if="isDualConflict"
              color="primary"
              @click="handleAction('dismiss-dual-conflict')"
            >
              OK
            </UButton>
            <UButton
              v-else
              variant="ghost"
              :disabled="isPending"
              @click="handleCancel"
            >
              Cancel
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<style scoped>
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>
