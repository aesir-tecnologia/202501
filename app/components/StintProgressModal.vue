<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import type { StintRow } from '~/lib/supabase/stints';
import { useCompletedStintsByDateQuery } from '~/composables/useStints';
import { formatDuration, formatTimestamp } from '~/utils/time-format';
import { createLogger } from '~/utils/logger';

const UTooltip = resolveComponent('UTooltip');
const log = createLogger('stint-progress-modal');

const props = defineProps<{
  projectId: string
  projectName: string
}>();

const isOpen = defineModel<boolean>('open');
const toast = useToast();

const { data: stints, isLoading, error } = useCompletedStintsByDateQuery(
  () => props.projectId,
  { enabled: computed(() => isOpen.value === true) },
);

watch(error, (err) => {
  if (err) {
    log.error('Failed to fetch completed stints', { projectId: props.projectId, error: err.message });
    toast.add({
      title: 'Failed to load stints',
      description: err.message,
      color: 'error',
    });
  }
});

function capitalize(val: string | null): string {
  if (!val) return '\u2014';
  return val.charAt(0).toUpperCase() + val.slice(1);
}

function truncateWithTooltip(val: string | null): ReturnType<typeof h> | string {
  if (!val) return '\u2014';
  if (val.length <= 50) return val;
  const truncated = `${val.slice(0, 50)}\u2026`;
  return h(UTooltip, { text: val }, () => h('span', { class: 'cursor-help' }, truncated));
}

const columns: TableColumn<StintRow>[] = [
  {
    accessorKey: 'started_at',
    header: 'Started',
    cell: ({ row }) => formatTimestamp(row.getValue('started_at')),
  },
  {
    accessorKey: 'ended_at',
    header: 'Ended',
    cell: ({ row }) => formatTimestamp(row.getValue('ended_at')),
  },
  {
    accessorKey: 'actual_duration',
    header: 'Actual',
    cell: ({ row }) => formatDuration(row.getValue('actual_duration') ?? 0),
  },
  {
    accessorKey: 'planned_duration',
    header: 'Planned',
    cell: ({ row }) => formatDuration(((row.getValue('planned_duration') as number | null) ?? 0) * 60),
  },
  {
    accessorKey: 'paused_duration',
    header: 'Paused',
    cell: ({ row }) => formatDuration(row.getValue('paused_duration') ?? 0),
  },
  {
    accessorKey: 'completion_type',
    header: 'Type',
    cell: ({ row }) => capitalize(row.getValue('completion_type')),
  },
  {
    accessorKey: 'notes',
    header: 'Notes',
    cell: ({ row }) => truncateWithTooltip(row.getValue('notes')),
  },
  {
    accessorKey: 'attributed_date',
    header: 'Date',
    cell: ({ row }) => {
      const val: string | null = row.getValue('attributed_date');
      if (!val) return '\u2014';
      const date = new Date(`${val}T12:00:00`);
      if (isNaN(date.getTime())) return '\u2014';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => capitalize(row.getValue('status')),
  },
];

function closeModal() {
  isOpen.value = false;
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="`${projectName} — Today's Stints`"
    :ui="{ content: 'sm:max-w-4xl', footer: 'justify-end' }"
  >
    <template #body>
      <div
        v-if="isLoading"
        class="flex items-center justify-center py-12"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="w-6 h-6 animate-spin text-stone-400"
        />
      </div>

      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center py-12 text-red-500 dark:text-red-400"
      >
        <UIcon
          name="i-lucide-alert-triangle"
          class="w-8 h-8 mb-2 opacity-50"
        />
        <p class="text-sm">
          Failed to load stints
        </p>
      </div>

      <div
        v-else-if="!stints?.length"
        class="flex flex-col items-center justify-center py-12 text-stone-500 dark:text-stone-400"
      >
        <UIcon
          name="i-lucide-inbox"
          class="w-8 h-8 mb-2 opacity-50"
        />
        <p class="text-sm">
          No stints completed today
        </p>
      </div>

      <div
        v-else
        class="-mx-6 px-6 max-h-[60vh] overflow-auto"
      >
        <UTable
          :data="stints"
          :columns="columns"
        />
      </div>
    </template>

    <template #footer>
      <UButton
        color="neutral"
        variant="ghost"
        @click="closeModal"
      >
        Close
      </UButton>
    </template>
  </UModal>
</template>
