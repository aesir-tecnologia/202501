<script setup lang="ts">
import { useProjectMutations } from '~/composables/useProjectMutations'
import type { ProjectRow } from '~/lib/supabase/projects'

const props = defineProps<{
  open: boolean
  project: ProjectRow
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const toast = useToast()
const { updateProject } = useProjectMutations()

const isSubmitting = ref(false)

function closeModal() {
  emit('update:open', false)
}

async function handleSubmit(data: { name: string, expectedDailyStints: number, customStintDuration: number }) {
  isSubmitting.value = true

  try {
    const { error } = await updateProject(props.project.id, data)

    if (error) {
      toast.add({
        title: 'Failed to update project',
        description: error.message,
        color: 'error',
      })
      return
    }

    toast.add({
      title: 'Project updated',
      description: `${data.name} has been updated successfully`,
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
          Edit Project
        </h3>
      </template>

      <ProjectForm
        :project="project"
        mode="edit"
        @submit="handleSubmit"
        @cancel="closeModal"
      />
    </UCard>
  </UModal>
</template>
