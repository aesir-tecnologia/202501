<script setup lang="ts">
import { useProjectMutations } from '~/composables/useProjectMutations'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const toast = useToast()
const { createProject } = useProjectMutations()

const isSubmitting = ref(false)

function closeModal() {
  emit('update:open', false)
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
  <UModal
    :model-value="open"
    @update:model-value="emit('update:open', $event)"
  >
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">
          Create New Project
        </h3>
      </template>

      <ProjectForm
        mode="create"
        @submit="handleSubmit"
        @cancel="closeModal"
      />
    </UCard>
  </UModal>
</template>
