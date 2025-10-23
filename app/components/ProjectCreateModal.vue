<script setup lang="ts">
import { useProjectMutations } from '~/composables/useProjectMutations'

const toast = useToast()
const { createProject } = useProjectMutations()

const isSubmitting = ref(false)
const isOpen = defineModel<boolean>('open')

function closeModal() {
  isOpen.value = false
}

async function handleSubmit(data: { name: string, expectedDailyStints: number, customStintDuration: number }) {
  isSubmitting.value = true

  try {
    const { error } = await createProject(data)

    if (error) {
      toast.add({
        title: 'Failed to create project',
        description: error.message,
        color: 'error',
      })
      return
    }

    toast.add({
      title: 'Project created',
      description: `${data.name} has been created successfully`,
      color: 'success',
    })

    closeModal()
  }
  finally {
    isSubmitting.value = false
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
          :loading="isSubmitting"
          @submit="handleSubmit"
          @cancel="closeModal"
        />
      </UCard>
    </template>
  </UModal>
</template>
