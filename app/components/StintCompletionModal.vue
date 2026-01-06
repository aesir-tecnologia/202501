<script setup lang="ts">
import { STINT } from '~/constants';

defineProps<{
  stintId: string
}>();

const emit = defineEmits<{
  cancel: []
  confirm: [notes: string]
}>();

const isOpen = defineModel<boolean>('open');
const notes = ref('');

const remainingCharacters = computed(() => STINT.NOTES.MAX_LENGTH - notes.value.length);

function closeModal() {
  isOpen.value = false;
  notes.value = '';
}

function handleCancel() {
  emit('cancel');
  closeModal();
}

function handleConfirm() {
  emit('confirm', notes.value.trim());
  closeModal();
}

watch(isOpen, (open) => {
  if (open) {
    notes.value = '';
  }
});
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Complete Stint"
    description="Add optional notes about what you accomplished during this stint."
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <UTextarea
        v-model="notes"
        class="w-full"
        placeholder="What did you accomplish during this stint?"
        :maxlength="STINT.NOTES.MAX_LENGTH"
        autoresize
        :maxrows="4"
        :rows="3"
        autofocus
      />
      <div class="flex justify-end mt-1">
        <span class="text-xs text-neutral-500 dark:text-neutral-400">
          {{ remainingCharacters }} characters remaining
        </span>
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
        @click="handleConfirm"
      >
        Complete Stint
      </UButton>
    </template>
  </UModal>
</template>
