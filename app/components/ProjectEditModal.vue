<script setup lang="ts">
import { useProjectMutations } from '~/composables/useProjectMutations'
import type { ProjectRow } from '~/lib/supabase/projects'

const props = defineProps<{
  project: ProjectRow
}>()

const toast = useToast()
const { updateProject } = useProjectMutations()

const isSubmitting = ref(false)
const isOpen = defineModel<boolean>('open')

function closeModal() {
  isOpen.value = false
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
          :loading="isSubmitting"
          @submit="handleSubmit"
          @cancel="closeModal"
        />
      </UCard>
    </template>
  </UModal>
</template>
