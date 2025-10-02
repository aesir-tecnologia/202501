<script setup lang="ts">
import type { ProjectRow } from '~/lib/supabase/projects'

export interface ProjectDeleteModalProps {
  project: ProjectRow
}

const props = defineProps<ProjectDeleteModalProps>()
const isOpen = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  deleted: [projectId: string]
}>()

const { deleteProject } = useProjectMutations()
const { showError, showSuccess } = useErrorToast()

const isDeleting = ref(false)
const confirmText = ref('')

const isConfirmed = computed(() =>
  confirmText.value.toLowerCase() === props.project.name.toLowerCase(),
)

async function handleDelete() {
  if (!isConfirmed.value)
    return

  isDeleting.value = true

  try {
    const result = await deleteProject(props.project.id)

    if (result.error) {
      showError(result.error)
    }
    else {
      showSuccess('Project deleted successfully')
      emit('deleted', props.project.id)
      handleClose()
    }
  }
  finally {
    isDeleting.value = false
  }
}

function handleClose() {
  isOpen.value = false
  confirmText.value = ''
}
</script>

<template>
  <UModal
    v-model="isOpen"
    :ui="{ width: 'sm:max-w-md' }"
  >
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-red-600">
            Delete Project
          </h3>
          <UButton
            icon="i-lucide-x"
            color="gray"
            variant="ghost"
            size="sm"
            @click="handleClose"
          />
        </div>
      </template>

      <div class="space-y-4">
        <UAlert
          icon="i-lucide-alert-triangle"
          color="red"
          variant="soft"
          title="Warning"
          description="This action cannot be undone. All stints associated with this project will also be deleted."
        />

        <div class="space-y-2">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            You are about to delete:
          </p>
          <p class="font-semibold text-gray-900 dark:text-white">
            {{ project.name }}
          </p>
        </div>

        <UFormGroup
          label="Type the project name to confirm"
          required
        >
          <UInput
            v-model="confirmText"
            placeholder="Enter project name"
            autofocus
          />
        </UFormGroup>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <UButton
            color="gray"
            variant="ghost"
            @click="handleClose"
          >
            Cancel
          </UButton>
          <UButton
            color="red"
            :loading="isDeleting"
            :disabled="!isConfirmed || isDeleting"
            @click="handleDelete"
          >
            Delete Project
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
