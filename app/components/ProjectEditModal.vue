<script setup lang="ts">
import { useUpdateProject } from '~/composables/useProjects'
import type { ProjectRow } from '~/lib/supabase/projects'
import type { ProjectColor } from '~/schemas/projects'

const props = defineProps<{
  project: ProjectRow
}>()

const emit = defineEmits<{
  archive: [project: ProjectRow]
}>()

const toast = useToast()
const { mutateAsync: updateProject, isPending } = useUpdateProject()

const isOpen = defineModel<boolean>('open')

function closeModal() {
  isOpen.value = false
}

function handleArchiveClick() {
  closeModal()
  emit('archive', props.project)
}

async function handleSubmit(data: { name: string, expectedDailyStints: number, customStintDuration: number, colorTag: ProjectColor | null }) {
  try {
    await updateProject({ id: props.project.id, data })

    toast.add({
      title: 'Project updated',
      description: `${data.name} has been updated successfully`,
      color: 'success',
    })

    closeModal()
  }
  catch (error) {
    toast.add({
      title: 'Failed to update project',
      description: error instanceof Error ? error.message : 'An unexpected error occurred',
      color: 'error',
    })
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Edit Project"
    description="Update the project details below"
  >
    <template #content>
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">
            Edit Project
          </h3>
        </template>

        <ProjectForm
          :project="project"
          mode="edit"
          :loading="isPending"
          @submit="handleSubmit"
          @cancel="closeModal"
        />

        <template #footer>
          <div class="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-800">
            <UTooltip text="Archive this project">
              <span>
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="lucide:archive"
                  class="transition-all duration-200"
                  @click="handleArchiveClick"
                >
                  Archive Project
                </UButton>
              </span>
            </UTooltip>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
