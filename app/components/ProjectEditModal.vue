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
        :project="project"
        mode="edit"
        :loading="isPending"
        @submit="handleSubmit"
        @cancel="closeModal"
      />
    </template>

    <template #footer>
      <div class="flex flex-col gap-4 w-full">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium text-stone-700 dark:text-stone-300">
              Project Status
            </span>
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
        </div>

        <div class="flex justify-between items-center">
          <UTooltip text="Archive this project">
            <span>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-archive"
                class="transition-all duration-200"
                @click="handleArchiveClick"
              >
                Archive Project
              </UButton>
            </span>
          </UTooltip>
        </div>
      </div>
    </template>
  </UModal>
</template>
