<script setup lang="ts">
import { useDeleteProject } from '~/composables/useProjects';
import { useActiveStintCheck } from '~/composables/useActiveStintCheck';
import type { ProjectRow } from '~/lib/supabase/projects';

const props = defineProps<{
  project: ProjectRow
}>();

const toast = useToast();
const { mutateAsync: deleteProject, isPending } = useDeleteProject();

const isOpen = defineModel<boolean>('open');
const projectId = computed(() => props.project.id);
const { hasActive, isCheckingActive } = useActiveStintCheck(projectId, isOpen as Ref<boolean>);

function closeModal(): void {
  isOpen.value = false;
}

async function handleDelete(): Promise<void> {
  if (hasActive.value) {
    toast.add({
      title: 'Cannot delete project',
      description: 'Please stop the active stint before deleting this project',
      color: 'error',
    });
    return;
  }

  try {
    await deleteProject(props.project.id);

    toast.add({
      title: 'Project deleted',
      description: `${props.project.name} and all associated stints have been deleted`,
      color: 'success',
    });

    closeModal();
  }
  catch (error) {
    toast.add({
      title: 'Failed to delete project',
      description: error instanceof Error ? error.message : 'An unexpected error occurred',
      color: 'error',
    });
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Delete Project"
    description="Confirm deletion of the project and all associated data"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <p v-if="isCheckingActive">
        Checking for active stints...
      </p>

      <div
        v-else-if="hasActive"
        class="rounded-md bg-red-50 dark:bg-red-950 p-4"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <Icon
              name="i-lucide-alert-triangle"
              class="h-5 w-5 text-red-400"
            />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
              Cannot Delete Project
            </h3>
            <div class="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>This project has an active stint. Please stop the stint before deleting the project.</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <p class="leading-normal text-neutral-700 dark:text-neutral-300">
          Are you sure you want to delete <strong>{{ project.name }}</strong>?
        </p>

        <div class="mt-4 rounded-md bg-warning-50 dark:bg-warning-950 p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <Icon
                name="i-lucide-alert-triangle"
                class="h-5 w-5 text-warning-400"
              />
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium leading-normal text-warning-800 dark:text-warning-200">
                Warning
              </h3>
              <div class="mt-2 text-sm leading-normal text-warning-700 dark:text-warning-300">
                <p>This will permanently delete the project and all associated stint history. This action cannot be undone.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton
        color="neutral"
        variant="ghost"
        @click="closeModal"
      >
        Cancel
      </UButton>
      <UButton
        v-if="!hasActive"
        color="error"
        :loading="isPending"
        :disabled="isCheckingActive"
        @click="handleDelete"
      >
        Delete Project
      </UButton>
    </template>
  </UModal>
</template>
