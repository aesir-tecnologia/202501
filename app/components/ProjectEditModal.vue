<script setup lang="ts">
import { useUpdateProject } from '~/composables/useProjects';
import type { ProjectRow } from '~/lib/supabase/projects';
import type { ProjectColor } from '~/schemas/projects';

const props = defineProps<{
  project: ProjectRow
  isTogglingActive?: boolean
}>();

const emit = defineEmits<{
  archive: [project: ProjectRow]
  toggleActive: [project: ProjectRow]
}>();

const toast = useToast();
const { mutateAsync: updateProject, isPending } = useUpdateProject();

const isOpen = defineModel<boolean>('open');

const formRef = ref<{ submit: () => void } | null>(null);

function closeModal() {
  isOpen.value = false;
}

function handleArchiveClick() {
  closeModal();
  emit('archive', props.project);
}

function handleToggleActive() {
  emit('toggleActive', props.project);
}

function triggerSubmit() {
  formRef.value?.submit();
}

async function handleSubmit(data: { name: string, expectedDailyStints: number, customStintDuration: number | null, colorTag: ProjectColor | null }) {
  try {
    await updateProject({ id: props.project.id, data });

    toast.add({
      title: 'Project updated',
      description: `${data.name} has been updated successfully`,
      color: 'success',
    });

    closeModal();
  }
  catch (error) {
    toast.add({
      title: 'Failed to update project',
      description: error instanceof Error ? error.message : 'An unexpected error occurred',
      color: 'error',
    });
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Edit Project"
    description="Update the project details below"
  >
    <template #body>
      <ProjectForm
        ref="formRef"
        :project="project"
        mode="edit"
        :loading="isPending"
        hide-buttons
        @submit="handleSubmit"
        @cancel="closeModal"
      />
    </template>

    <template #footer>
      <div class="flex items-center justify-between w-full gap-4">
        <!-- Left side: Status and Archive -->
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <USwitch
              :model-value="project.is_active ?? true"
              :loading="isTogglingActive"
              size="lg"
              checked-icon="i-lucide-check"
              unchecked-icon="i-lucide-power-off"
              @update:model-value="handleToggleActive"
            />
            <span
              class="text-sm font-medium"
              :class="project.is_active ? 'text-green-600 dark:text-green-400' : 'text-stone-500 dark:text-stone-400'"
            >
              {{ project.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <UTooltip text="Archive this project">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-archive"
              size="sm"
              @click="handleArchiveClick"
            >
              Archive
            </UButton>
          </UTooltip>
        </div>

        <!-- Right side: Cancel and Save -->
        <div class="flex items-center gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            class="min-w-20"
            @click="closeModal"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            class="min-w-20"
            :loading="isPending"
            @click="triggerSubmit"
          >
            Save
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
