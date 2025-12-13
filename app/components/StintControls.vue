<script setup lang="ts">
import type { StintRow } from '~/lib/supabase/stints';

const props = defineProps<{
  stint: StintRow
}>();

// Mutation hooks
const { mutateAsync: pauseStint, isPending: isPausing } = usePauseStint();
const { mutateAsync: resumeStint, isPending: isResuming } = useResumeStint();
const { mutateAsync: completeStint, isPending: isCompleting } = useCompleteStint();

const toast = useToast();

// State for notes modal (placeholder for Task 10)
const showNotesModal = ref(false);
const completionNotes = ref('');

/**
 * Pause the active stint
 */
async function handlePause(): Promise<void> {
  try {
    await pauseStint(props.stint.id);
  }
  catch (error) {
    console.error('Failed to pause stint:', error);

    toast.add({
      title: 'Pause Failed',
      description: error instanceof Error ? error.message : 'Could not pause stint. Please try again.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
}

/**
 * Resume the paused stint
 */
async function handleResume(): Promise<void> {
  try {
    await resumeStint(props.stint.id);
  }
  catch (error) {
    console.error('Failed to resume stint:', error);

    toast.add({
      title: 'Resume Failed',
      description: error instanceof Error ? error.message : 'Could not resume stint. Please try again.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
}

/**
 * Stop the stint (show notes modal first)
 */
function handleStopClick(): void {
  showNotesModal.value = true;
}

/**
 * Cancel the stop action
 */
function handleStopCancel(): void {
  showNotesModal.value = false;
  completionNotes.value = '';
}

/**
 * Confirm stop and complete the stint with optional notes
 */
async function handleStopConfirm(notes: string): Promise<void> {
  try {
    await completeStint({
      stintId: props.stint.id,
      completionType: 'manual',
      notes: notes || undefined,
    });

    // Reset modal state
    showNotesModal.value = false;
    completionNotes.value = '';
  }
  catch (error) {
    console.error('Failed to complete stint:', error);

    toast.add({
      title: 'Stop Failed',
      description: error instanceof Error ? error.message : 'Could not complete stint. Please try again.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
}

// Determine if any action is in progress
const isAnyPending = computed(() => isPausing.value || isResuming.value || isCompleting.value);
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Pause Button (shown when active) -->
    <UButton
      v-if="stint.status === 'active'"
      color="warning"
      variant="soft"
      icon="i-lucide-pause"
      :loading="isPausing"
      :disabled="isAnyPending"
      @click="handlePause"
    >
      Pause
    </UButton>

    <!-- Resume Button (shown when paused) -->
    <UButton
      v-if="stint.status === 'paused'"
      color="success"
      variant="soft"
      icon="i-lucide-play"
      :loading="isResuming"
      :disabled="isAnyPending"
      @click="handleResume"
    >
      Resume
    </UButton>

    <!-- Stop Button (always shown for active/paused) -->
    <UButton
      v-if="stint.status === 'active' || stint.status === 'paused'"
      color="error"
      variant="soft"
      icon="i-lucide-square"
      :loading="isCompleting"
      :disabled="isAnyPending"
      @click="handleStopClick"
    >
      Stop
    </UButton>

    <!-- Stint Completion Modal -->
    <StintCompletionModal
      v-model:open="showNotesModal"
      :stint-id="stint.id"
      @cancel="handleStopCancel"
      @confirm="handleStopConfirm"
    />
  </div>
</template>
