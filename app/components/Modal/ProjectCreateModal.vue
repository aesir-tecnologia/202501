<script setup lang="ts">
import { z } from 'zod'
import { projectCreateSchema, PROJECT_SCHEMA_LIMITS } from '~/schemas/projects'
import type { ProjectCreatePayload } from '~/schemas/projects'

const isOpen = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  created: [project: any]
}>()

const { createProject } = useProjectMutations()
const { showError, showSuccess } = useErrorToast()

const form = reactive<ProjectCreatePayload>({
  name: '',
  expectedDailyStints: 2,
  customStintDuration: null,
})

const isSubmitting = ref(false)
const errors = ref<Record<string, string>>({})

function validateForm(): boolean {
  errors.value = {}
  try {
    projectCreateSchema.parse(form)
    return true
  }
  catch (err) {
    if (err instanceof z.ZodError) {
      err.errors.forEach((error) => {
        const field = error.path[0] as string
        errors.value[field] = error.message
      })
    }
    return false
  }
}

async function handleSubmit() {
  if (!validateForm())
    return

  isSubmitting.value = true

  try {
    const result = await createProject(form)

    if (result.error) {
      showError(result.error)
    }
    else {
      showSuccess('Project created successfully')
      emit('created', result.data)
      handleClose()
    }
  }
  finally {
    isSubmitting.value = false
  }
}

function handleClose() {
  isOpen.value = false
  // Reset form
  form.name = ''
  form.expectedDailyStints = 2
  form.customStintDuration = null
  errors.value = {}
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
          <h3 class="text-lg font-semibold">
            Create New Project
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

      <form
        class="space-y-4"
        @submit.prevent="handleSubmit"
      >
        <!-- Project Name -->
        <UFormGroup
          label="Project Name"
          :error="errors.name"
          required
        >
          <UInput
            v-model="form.name"
            placeholder="Enter project name"
            :maxlength="PROJECT_SCHEMA_LIMITS.NAME_MAX"
            autofocus
          />
          <template #hint>
            {{ form.name.length }}/{{ PROJECT_SCHEMA_LIMITS.NAME_MAX }}
          </template>
        </UFormGroup>

        <!-- Expected Daily Stints -->
        <UFormGroup
          label="Expected Daily Stints"
          :error="errors.expectedDailyStints"
          hint="How many stints do you plan to complete each day?"
        >
          <UInput
            v-model.number="form.expectedDailyStints"
            type="number"
            :min="PROJECT_SCHEMA_LIMITS.DAILY_STINTS_MIN"
            :max="PROJECT_SCHEMA_LIMITS.DAILY_STINTS_MAX"
          />
        </UFormGroup>

        <!-- Custom Stint Duration -->
        <UFormGroup
          label="Custom Stint Duration (minutes)"
          :error="errors.customStintDuration"
          hint="Leave empty to use default duration"
        >
          <UInput
            v-model.number="form.customStintDuration"
            type="number"
            placeholder="Optional"
            :min="PROJECT_SCHEMA_LIMITS.CUSTOM_DURATION_MIN_MINUTES"
            :max="PROJECT_SCHEMA_LIMITS.CUSTOM_DURATION_MAX_MINUTES"
          />
        </UFormGroup>
      </form>

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
            color="primary"
            :loading="isSubmitting"
            :disabled="isSubmitting"
            @click="handleSubmit"
          >
            Create Project
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
