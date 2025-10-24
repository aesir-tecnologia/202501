<script setup lang="ts">
import { useCreateProject } from '~/composables/useProjects'

const toast = useToast()
const { mutateAsync: createProject, isPending } = useCreateProject()

const isOpen = defineModel<boolean>('open')

function closeModal() {
  isOpen.value = false
}

async function handleSubmit(data: { name: string, expectedDailyStints: number, customStintDuration: number }) {
  try {
    await createProject(data)

    toast.add({
      title: 'Project created',
      description: `${data.name} has been created successfully`,
      color: 'success',
    })

    closeModal()
  }
  catch (error) {
    toast.add({
      title: 'Failed to create project',
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
            Create New Project
          </h3>
        </template>

        <ProjectForm
          mode="create"
          :loading="isPending"
          @submit="handleSubmit"
          @cancel="closeModal"
        />
      </UCard>
    </template>
  </UModal>
</template>
