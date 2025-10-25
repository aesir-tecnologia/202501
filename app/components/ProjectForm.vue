<script setup lang="ts">
import { projectCreateSchema, projectUpdateSchema } from '~/schemas/projects'
import type { ProjectRow } from '~/lib/supabase/projects'

const props = defineProps<{
  project?: ProjectRow
  mode: 'create' | 'edit'
}>()

const emit = defineEmits<{
  submit: [data: { name: string, expectedDailyStints: number, customStintDuration: number }]
  cancel: []
}>()

// Form state
const formData = ref({
  name: props.project?.name ?? '',
  expectedDailyStints: props.project?.expected_daily_stints ?? 3,
  customStintDuration: props.project?.custom_stint_duration ?? 45,
})

// Validation state
const errors = ref<Record<string, string>>({})

// Validate form
function validateForm() {
  errors.value = {}

  const schema = props.mode === 'create' ? projectCreateSchema : projectUpdateSchema
  const result = schema.safeParse(formData.value)

  if (!result.success) {
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as string
      errors.value[field] = issue.message
    })
    return false
  }

  return true
}

// Handle submit
function handleSubmit() {
  if (!validateForm()) return

  emit('submit', {
    name: formData.value.name.trim(),
    expectedDailyStints: formData.value.expectedDailyStints,
    customStintDuration: formData.value.customStintDuration,
  })
}

// Handle cancel
function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <form
    class="space-y-4"
    @submit.prevent="handleSubmit"
  >
    <UFormField
      label="Project Name"
      :error="errors.name"
      required
    >
      <UInput
        v-model="formData.name"
        class="w-full"
        placeholder="e.g., Client Alpha"
        @blur="validateForm"
      />
    </UFormField>

    <UFormField
      label="Expected Daily Stints"
      :error="errors.expectedDailyStints"
      help="How many stints do you aim to complete per day?"
    >
      <UInput
        v-model.number="formData.expectedDailyStints"
        type="number"
        min="1"
        max="100"
        @blur="validateForm"
      />
    </UFormField>

    <UFormField
      label="Custom Stint Duration (minutes)"
      :error="errors.customStintDuration"
      help="How long should each stint last?"
    >
      <UInput
        v-model.number="formData.customStintDuration"
        type="number"
        min="1"
        max="1440"
        @blur="validateForm"
      />
    </UFormField>

    <div class="flex justify-end gap-2 pt-4">
      <UButton
        type="button"
        color="neutral"
        variant="ghost"
        @click="handleCancel"
      >
        Cancel
      </UButton>
      <UButton
        type="submit"
        color="primary"
      >
        {{ mode === 'create' ? 'Create Project' : 'Save Changes' }}
      </UButton>
    </div>
  </form>
</template>
