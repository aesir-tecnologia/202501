<script setup lang="ts">
import { projectCreateSchema, projectUpdateSchema, type ProjectColor } from '~/schemas/projects';
import { PROJECT } from '~/constants';
import type { ProjectRow } from '~/lib/supabase/projects';

const props = defineProps<{
  project?: ProjectRow
  mode: 'create' | 'edit'
}>();

const emit = defineEmits<{
  submit: [data: { name: string, expectedDailyStints: number, customStintDuration: number, colorTag: ProjectColor | null }]
  cancel: []
}>();

// Form state
const formData = ref({
  name: props.project?.name ?? '',
  expectedDailyStints: props.project?.expected_daily_stints ?? 3,
  customStintDuration: props.project?.custom_stint_duration ?? 45,
  colorTag: (props.project?.color_tag as ProjectColor | null) ?? null,
});

// Validation state
const errors = ref<Record<string, string>>({});

// Validate form
function validateForm() {
  errors.value = {};

  const schema = props.mode === 'create' ? projectCreateSchema : projectUpdateSchema;
  const result = schema.safeParse(formData.value);

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
    expectedDailyStints: formData.value.expectedDailyStints,
    customStintDuration: formData.value.customStintDuration,
    colorTag: formData.value.colorTag,
  });
}

// Color selection helper
function selectColor(color: ProjectColor | null) {
  formData.value.colorTag = color;
}

// Get TailwindCSS classes for each color
function getColorClasses(color: ProjectColor) {
  const colorMap: Record<ProjectColor, { bg: string, ring: string, border: string }> = {
    red: { bg: 'bg-red-500', ring: 'ring-red-500', border: 'border-red-500' },
    orange: { bg: 'bg-orange-500', ring: 'ring-orange-500', border: 'border-orange-500' },
    amber: { bg: 'bg-amber-500', ring: 'ring-amber-500', border: 'border-amber-500' },
    green: { bg: 'bg-green-500', ring: 'ring-green-500', border: 'border-green-500' },
    teal: { bg: 'bg-teal-500', ring: 'ring-teal-500', border: 'border-teal-500' },
    blue: { bg: 'bg-blue-500', ring: 'ring-blue-500', border: 'border-blue-500' },
    purple: { bg: 'bg-purple-500', ring: 'ring-purple-500', border: 'border-purple-500' },
    pink: { bg: 'bg-pink-500', ring: 'ring-pink-500', border: 'border-pink-500' },
  };
  return colorMap[color];
}

// Handle cancel
function handleCancel() {
  emit('cancel');
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
            'w-10 h-10 rounded-md border-2 motion-safe:transition-all',
            getColorClasses(color).bg,
            formData.colorTag === color
              ? `${getColorClasses(color).border} ring-2 ${getColorClasses(color).ring}`
              : 'border-transparent hover:border-neutral-300 dark:hover:border-neutral-600',
          ]"
          :aria-label="`Select ${color} color`"
          @click="selectColor(color)"
        />
      </div>
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
