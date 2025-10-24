<script setup lang="ts">
import { useUpdateProject } from '~/composables/useProjects'
import type { ProjectRow } from '~/lib/supabase/projects'

const props = defineProps<{
  project: ProjectRow
}>()

const toast = useToast()
const { mutateAsync: updateProject, isPending } = useUpdateProject()

const isOpen = defineModel<boolean>('open')

function closeModal() {
  isOpen.value = false
}

async function handleSubmit(data: { name: string, expectedDailyStints: number, customStintDuration: number }) {
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
  <UModal v-model:open="isOpen">
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
      </UCard>
    </template>
  </UModal>
</template>
