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
    description="Add optional notes about what you accomplished"
  >
    <template #content>
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">
            Complete Stint
          </h3>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Add optional notes about what you accomplished during this stint.
          </p>

          <div>
            <UTextarea
              v-model="notes"
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
          </div>

          <div class="flex justify-end gap-2 pt-4">
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
          </div>
        </div>
      </UCard>
    </template>
  </UModal>
</template>
