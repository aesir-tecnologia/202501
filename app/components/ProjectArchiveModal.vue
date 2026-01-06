<script setup lang="ts">
import { useArchiveProject } from '~/composables/useProjects';
import { useActiveStintCheck } from '~/composables/useActiveStintCheck';
import type { ProjectRow } from '~/lib/supabase/projects';

const props = defineProps<{
  project: ProjectRow
}>();

const toast = useToast();
const { mutateAsync: archiveProject, isPending } = useArchiveProject();

const isOpen = defineModel<boolean>('open');
const projectId = computed(() => props.project.id);
const { hasActive, isCheckingActive } = useActiveStintCheck(projectId, isOpen as Ref<boolean>);

function closeModal(): void {
  isOpen.value = false;
}

async function handleArchive(): Promise<void> {
  if (hasActive.value) {
    toast.add({
      title: 'Cannot archive project',
      description: 'Please stop the active stint before archiving this project',
      color: 'error',
    });
    return;
  }

  try {
    await archiveProject(props.project.id);

    toast.add({
      title: 'Project archived',
      description: `${props.project.name} has been archived. Past stints are preserved for analytics.`,
      color: 'success',
    });

    closeModal();
  }
  catch (error) {
    toast.add({
      title: 'Failed to archive project',
      description: error instanceof Error ? error.message : 'An unexpected error occurred',
      color: 'error',
    });
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Archive Project"
    description="Confirm archiving of the project"
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
              Cannot Archive Project
            </h3>
            <div class="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>This project has an active stint. Please stop the stint before archiving the project.</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <p class="leading-normal text-stone-700 dark:text-stone-300">
          Archive <strong>{{ project.name }}</strong>? Past stints will be preserved for analytics.
        </p>

        <div class="mt-4 rounded-md bg-orange-50 dark:bg-orange-950 p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <Icon
                name="i-lucide-info"
                class="h-5 w-5 text-orange-500"
              />
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-orange-800 dark:text-orange-200">
                About Archiving
              </h3>
              <div class="mt-2 text-sm text-orange-700 dark:text-orange-300">
                <p>Archived projects are hidden from the dashboard but all stint history is preserved. You can view archived projects anytime from the "View Archived" link.</p>
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
        color="primary"
        :loading="isPending"
        :disabled="isCheckingActive"
        @click="handleArchive"
      >
        Archive Project
      </UButton>
    </template>
  </UModal>
</template>
