<script setup lang="ts">
export type ConflictResolutionAction
  = 'pause-and-switch'
    | 'complete-active-and-start'
    | 'cancel';

interface ExistingStintInfo {
  id: string
  projectName: string
  remainingSeconds: number
}

interface Props {
  existingStint?: ExistingStintInfo
  newProjectName: string
  isPending?: boolean
}

const props = defineProps<Props>();
const isOpen = defineModel<boolean>('open', { required: true });

const previousActiveElement = ref<HTMLElement | null>(null);

watch(isOpen, (newValue, oldValue) => {
  if (newValue && !oldValue) {
    previousActiveElement.value = document.activeElement as HTMLElement | null;
  }
  else if (!newValue && oldValue) {
    nextTick(() => {
      if (previousActiveElement.value && typeof previousActiveElement.value.focus === 'function') {
        previousActiveElement.value.focus();
      }
      previousActiveElement.value = null;
    });
  }
});

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
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Switch Projects?"
    :description="`Manage existing stint on ${existingStint?.projectName} before starting ${newProjectName}`"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <div
        v-if="existingStint"
        class="space-y-4"
      >
        <div class="rounded-lg bg-green-50 dark:bg-green-950/50 p-4">
          <p class="text-sm text-green-800 dark:text-green-200">
            <strong>{{ existingStint.projectName }}</strong> is running
            with <strong class="tabular-nums">{{ formattedTime }}</strong> remaining.
          </p>
        </div>

        <p class="text-sm text-stone-600 dark:text-stone-400">
          You're about to start a stint on <strong>{{ newProjectName }}</strong>.
        </p>

        <div class="space-y-2">
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
      </div>
    </template>

    <template #footer>
      <UButton
        variant="ghost"
        :disabled="isPending"
        @click="handleCancel"
      >
        Cancel
      </UButton>
    </template>
  </UModal>
</template>

<style scoped>
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>
