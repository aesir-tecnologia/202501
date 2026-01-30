<script setup lang="ts">
import { projectCreateSchema, projectUpdateSchema, type ProjectColor } from '~/schemas/projects';
import { PROJECT } from '~/constants';
import type { ProjectRow } from '~/lib/supabase/projects';
import { getColorClasses } from '~/utils/project-colors';

const props = defineProps<{
  project?: ProjectRow
  mode: 'create' | 'edit'
  hideButtons?: boolean
}>();

const emit = defineEmits<{
  submit: [data: { name: string, expectedDailyStints: number, customStintDuration: number | null, colorTag: ProjectColor | null }]
  cancel: []
}>();

// Form state
const formData = ref({
  name: props.project?.name ?? '',
  expectedDailyStints: props.project?.expected_daily_stints ?? PROJECT.DAILY_STINTS.DEFAULT,
  customStintDuration: props.project?.custom_stint_duration ?? null,
  colorTag: (props.project?.color_tag as ProjectColor | null) ?? null,
});

// Validation state
const errors = ref<Record<string, string>>({});

function normalizeNumberInput(value: unknown): number | null {
  if (value === '' || value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }
  return typeof value === 'number' ? value : null;
}

// Validate form
function validateForm() {
  errors.value = {};

  const normalizedData = {
    ...formData.value,
    expectedDailyStints: normalizeNumberInput(formData.value.expectedDailyStints) ?? PROJECT.DAILY_STINTS.DEFAULT,
    customStintDuration: normalizeNumberInput(formData.value.customStintDuration),
  };

  const schema = props.mode === 'create' ? projectCreateSchema : projectUpdateSchema;
  const result = schema.safeParse(normalizedData);

  if (!result.success) {
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as string;
      errors.value[field] = issue.message;
    });
    return false;
  }

  return true;
}

// Handle submit
function handleSubmit() {
  if (!validateForm()) return;

  emit('submit', {
    name: formData.value.name.trim(),
    expectedDailyStints: normalizeNumberInput(formData.value.expectedDailyStints) ?? PROJECT.DAILY_STINTS.DEFAULT,
    customStintDuration: normalizeNumberInput(formData.value.customStintDuration),
    colorTag: formData.value.colorTag,
  });
}

// Color selection helper
function selectColor(color: ProjectColor | null) {
  formData.value.colorTag = color;
}

// Handle cancel
function handleCancel() {
  emit('cancel');
}

// Expose methods for external control
defineExpose({
  submit: handleSubmit,
});
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
      <div class="flex items-center gap-4">
        <USlider
          v-model="formData.expectedDailyStints"
          :min="PROJECT.DAILY_STINTS.MIN"
          :max="PROJECT.DAILY_STINTS.MAX"
          :step="1"
          class="flex-1"
          @update:model-value="validateForm"
        />
        <span class="text-2xl font-bold tabular-nums min-w-[3ch] text-right text-primary">
          {{ formData.expectedDailyStints }}
        </span>
      </div>
    </UFormField>

    <UFormField
      label="Custom Stint Duration (minutes)"
      :error="errors.customStintDuration"
      help="How long should each stint last?"
    >
      <UInputNumber
        v-model="formData.customStintDuration"
        :min="PROJECT.CUSTOM_STINT_DURATION_MINUTES.MIN"
        :max="PROJECT.CUSTOM_STINT_DURATION_MINUTES.MAX"
        :step="5"
        class="w-full"
        placeholder="Default: 120"
        @blur="validateForm"
      />
    </UFormField>

    <UFormField
      label="Color Tag (optional)"
      :error="errors.colorTag"
      help="Choose a color to visually identify this project"
    >
      <div class="flex items-center gap-2">
        <!-- None option -->
        <button
          type="button"
          :class="[
            'w-10 h-10 rounded-md border-2 motion-safe:transition-all flex items-center justify-center',
            formData.colorTag === null
              ? 'border-neutral-900 dark:border-neutral-100 ring-2 ring-neutral-900 dark:ring-neutral-100'
              : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600',
          ]"
          @click="selectColor(null)"
        >
          <Icon
            name="i-lucide-x"
            class="h-5 w-5 text-neutral-400"
          />
        </button>

        <!-- Color options -->
        <button
          v-for="color in PROJECT.COLORS"
          :key="color"
          type="button"
          :class="[
            'w-10 h-10 rounded-md border-2 motion-safe:transition-all flex items-center justify-center',
            getColorClasses(color).bg,
            formData.colorTag === color
              ? `${getColorClasses(color).border} ring-2 ${getColorClasses(color).ring}`
              : 'border-transparent hover:border-neutral-300 dark:hover:border-neutral-600',
          ]"
          :aria-label="`Select ${color} color`"
          @click="selectColor(color)"
        >
          <Icon
            v-if="formData.colorTag === color"
            name="i-lucide-check"
            class="h-5 w-5 text-white drop-shadow-sm"
          />
        </button>
      </div>
    </UFormField>

    <div
      v-if="!hideButtons"
      class="flex justify-end gap-3 pt-4"
    >
      <UButton
        type="button"
        color="neutral"
        variant="ghost"
        class="min-w-24"
        @click="handleCancel"
      >
        Cancel
      </UButton>
      <UButton
        type="submit"
        color="primary"
        class="min-w-24"
      >
        {{ mode === 'create' ? 'New Project' : 'Save Changes' }}
      </UButton>
    </div>
  </form>
</template>
