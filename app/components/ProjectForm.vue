<script setup lang="ts">
import { projectCreateSchema, projectUpdateSchema, type ProjectColor, type ProjectCreatePayload } from '~/schemas/projects';
import type { ProjectRow } from '~/lib/supabase/projects';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { z } from 'zod';

const props = defineProps<{
  project?: ProjectRow
  mode: 'create' | 'edit'
}>();

const emit = defineEmits<{
  submit: [data: { name: string, expectedDailyStints: number, customStintDuration: number | null, colorTag: ProjectColor | null }]
  cancel: []
}>();

const schema = computed(() => props.mode === 'create' ? projectCreateSchema : projectUpdateSchema);

const PROJECT_COLORS: ProjectColor[] = ['red', 'orange', 'amber', 'green', 'teal', 'blue', 'purple', 'pink'];

// Form state - using Partial for update mode compatibility
const state = reactive<Partial<ProjectCreatePayload>>({
  name: props.project?.name ?? '',
  expectedDailyStints: props.project?.expected_daily_stints ?? 2,
  customStintDuration: props.project?.custom_stint_duration ?? null,
  colorTag: (props.project?.color_tag as ProjectColor | null) ?? null,
});

// Handle submit
async function onSubmit(event: FormSubmitEvent<z.infer<typeof schema.value>>) {
  const data = event.data;
  emit('submit', {
    name: (data.name ?? '').trim(),
    expectedDailyStints: data.expectedDailyStints ?? 2,
    customStintDuration: data.customStintDuration ?? null,
    colorTag: data.colorTag ?? null,
  });
}

// Color selection helper
function selectColor(color: ProjectColor | null) {
  state.colorTag = color;
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
  <UForm
    :schema="schema"
    :state="state"
    class="space-y-4"
    @submit="onSubmit"
  >
    <UFormField
      name="name"
      label="Project Name"
      required
    >
      <UInput
        v-model="state.name"
        class="w-full"
        placeholder="e.g., Client Alpha"
      />
    </UFormField>

    <UFormField
      name="expectedDailyStints"
      label="Expected Daily Stints"
      help="How many stints do you aim to complete per day?"
    >
      <UInput
        v-model.number="state.expectedDailyStints"
        type="number"
        min="1"
        max="100"
      />
    </UFormField>

    <UFormField
      name="customStintDuration"
      label="Custom Stint Duration (minutes)"
      help="How long should each stint last?"
    >
      <UInput
        v-model.number="state.customStintDuration"
        type="number"
        min="1"
        max="1440"
      />
    </UFormField>

    <UFormField
      name="colorTag"
      label="Color Tag (optional)"
      help="Choose a color to visually identify this project"
    >
      <div class="flex items-center gap-2">
        <!-- None option -->
        <button
          type="button"
          :class="[
            'w-10 h-10 rounded-md border-2 motion-safe:transition-all flex items-center justify-center',
            state.colorTag === null
              ? 'border-neutral-900 dark:border-neutral-100 ring-2 ring-neutral-900 dark:ring-neutral-100 bg-neutral-100 dark:bg-neutral-800 scale-110 shadow-lg'
              : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 hover:scale-105',
          ]"
          aria-label="No color tag"
          :aria-pressed="state.colorTag === null"
          @click="selectColor(null)"
        >
          <Icon
            name="i-lucide-x"
            :class="[
              'h-5 w-5 motion-safe:transition-all',
              state.colorTag === null
                ? 'text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-400',
            ]"
          />
        </button>

        <!-- Color options -->
        <button
          v-for="color in PROJECT_COLORS"
          :key="color"
          type="button"
          :class="[
            'w-10 h-10 rounded-md border-2 motion-safe:transition-all flex items-center justify-center relative',
            getColorClasses(color).bg,
            state.colorTag === color
              ? `${getColorClasses(color).border} ring-2 ${getColorClasses(color).ring} scale-110 shadow-lg`
              : 'border-transparent hover:border-neutral-300 dark:hover:border-neutral-600 hover:scale-105',
          ]"
          :aria-label="`Select ${color} color`"
          :aria-pressed="state.colorTag === color"
          @click="selectColor(color)"
        >
          <Icon
            v-if="state.colorTag === color"
            name="i-lucide-check"
            class="h-5 w-5 text-white drop-shadow-sm"
          />
        </button>
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
  </UForm>
</template>
