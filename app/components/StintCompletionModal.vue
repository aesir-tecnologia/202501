<script setup lang="ts">
import { STINT } from '~/constants';

const props = defineProps<{
  stintId: string
  spansMidnight?: boolean
  startDate?: string
  endDate?: string
  startDateLabel?: string
  endDateLabel?: string
}>();

const emit = defineEmits<{
  cancel: []
  confirm: [payload: { notes: string, attributedDate?: string, rememberChoice?: boolean }]
}>();

const isOpen = defineModel<boolean>('open');
const notes = ref('');
const selectedDate = ref<string | undefined>(undefined);
const rememberChoice = ref(false);

const remainingCharacters = computed(() => STINT.NOTES.MAX_LENGTH - notes.value.length);

const dateOptions = computed(() => {
  if (!props.spansMidnight || !props.startDate || !props.endDate) return [];
  return [
    {
      label: `${props.startDateLabel} (start date)`,
      value: props.startDate,
    },
    {
      label: `${props.endDateLabel} (end date)`,
      value: props.endDate,
    },
  ];
});

function closeModal() {
  isOpen.value = false;
  notes.value = '';
  selectedDate.value = undefined;
  rememberChoice.value = false;
}

function handleCancel() {
  emit('cancel');
  closeModal();
}

function handleConfirm() {
  emit('confirm', {
    notes: notes.value.trim(),
    attributedDate: props.spansMidnight ? selectedDate.value : undefined,
    rememberChoice: props.spansMidnight ? rememberChoice.value : undefined,
  });
  closeModal();
}

watch(isOpen, (open) => {
  if (open) {
    notes.value = '';
    selectedDate.value = props.endDate;
    rememberChoice.value = false;
  }
});
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Complete Stint"
    :description="spansMidnight
      ? 'This stint started on one day and ended on another. Choose which day it should count toward.'
      : 'Add optional notes about what you accomplished during this stint.'"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <div class="space-y-4">
        <div
          v-if="spansMidnight && startDateLabel && endDateLabel"
          class="space-y-3"
        >
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            This stint started on <span class="font-medium">{{ startDateLabel }}</span> and ended on <span class="font-medium">{{ endDateLabel }}</span>.
          </p>

          <URadioGroup
            v-model="selectedDate"
            legend="Which day should this count toward?"
            :items="dateOptions"
            :ui="{ legend: 'text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2' }"
          />

          <UCheckbox
            v-model="rememberChoice"
            label="Remember my choice for future stints"
            :ui="{ label: 'text-sm' }"
          />
        </div>

        <div>
          <UTextarea
            v-model="notes"
            class="w-full"
            placeholder="What did you accomplish during this stint?"
            :maxlength="STINT.NOTES.MAX_LENGTH"
            autoresize
            :maxrows="4"
            :rows="3"
            :autofocus="!spansMidnight"
          />
          <div class="flex justify-end mt-1">
            <span class="text-xs text-neutral-500 dark:text-neutral-400">
              {{ remainingCharacters }} characters remaining
            </span>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton
        color="neutral"
        variant="ghost"
        @click="handleCancel"
      >
        Cancel
      </UButton>
      <UButton
        color="primary"
        :disabled="spansMidnight && !selectedDate"
        @click="handleConfirm"
      >
        Complete Stint
      </UButton>
    </template>
  </UModal>
</template>
