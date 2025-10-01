<script setup lang="ts">
import { z } from 'zod'
import { projectUpdateSchema, PROJECT_SCHEMA_LIMITS } from '~/schemas/projects'
import type { ProjectUpdatePayload } from '~/schemas/projects'
import type { ProjectRow } from '~/lib/supabase/projects'

export interface ProjectEditModalProps {
  project: ProjectRow
}

const props = defineProps<ProjectEditModalProps>()
const isOpen = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  updated: [project: any]
}>()

const { updateProject } = useProjectMutations()
const { showError, showSuccess } = useErrorToast()

const form = reactive<ProjectUpdatePayload>({
  name: props.project.name,
  expectedDailyStints: props.project.expected_daily_stints ?? 2,
  customStintDuration: props.project.custom_stint_duration,
  isActive: props.project.is_active ?? true,
})

const isSubmitting = ref(false)
const errors = ref<Record<string, string>>({})

// Watch for project prop changes
watch(() => props.project, (newProject) => {
  form.name = newProject.name
  form.expectedDailyStints = newProject.expected_daily_stints ?? 2
  form.customStintDuration = newProject.custom_stint_duration
  form.isActive = newProject.is_active ?? true
  errors.value = {}
}, { immediate: true })

function validateForm(): boolean {
  errors.value = {}
  try {
    projectUpdateSchema.parse(form)
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
    const result = await updateProject(props.project.id, form)

    if (result.error) {
      showError(result.error)
    }
    else {
      showSuccess('Project updated successfully')
      emit('updated', result.data)
      handleClose()
    }
  }
  finally {
    isSubmitting.value = false
  }
}

function handleClose() {
  isOpen.value = false
  errors.value = {}
}
</script>

<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-md' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">
            Edit Project
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

      <form class="space-y-4" @submit.prevent="handleSubmit">
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
            {{ form.name?.length || 0 }}/{{ PROJECT_SCHEMA_LIMITS.NAME_MAX }}
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

        <!-- Active Status -->
        <UFormGroup
          label="Status"
          :error="errors.isActive"
        >
          <UToggle
            v-model="form.isActive"
          >
            <template #label>
              <span class="text-sm">
                {{ form.isActive ? 'Active' : 'Inactive' }}
              </span>
            </template>
          </UToggle>
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
            Save Changes
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
