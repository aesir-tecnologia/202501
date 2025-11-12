<script setup lang="ts">
import type { StintRow } from '~/lib/supabase/stints';
import type { ProjectRow } from '~/lib/supabase/projects';
import { useStintsQuery } from '~/composables/useStints';
import { useProjectsQuery } from '~/composables/useProjects';

definePageMeta({
  title: 'Reports',
  middleware: 'auth',
});

useSeoMeta({
  title: 'Reports - LifeStint',
  description: 'Generate detailed reports and export your work data.',
});

const { data: stintsData, isLoading: stintsLoading } = useStintsQuery();
const { data: projectsData, isLoading: projectsLoading } = useProjectsQuery({ includeInactive: true });

const stints = computed(() => stintsData.value ?? []);
const projects = computed(() => projectsData.value ?? []);

// Date range filter
const dateRange = ref({
  start: '',
  end: '',
});

// Project filter
const selectedProjectId = ref<string | null>(null);

// Preset date ranges
const presetRanges = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'This month', getStart: () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  } },
  { label: 'Last month', getStart: () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }, getEnd: () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 0);
  } },
];

// Initialize date range to last 30 days
onMounted(() => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);

  dateRange.value.end = end.toISOString().split('T')[0];
  dateRange.value.start = start.toISOString().split('T')[0];
});

function applyPresetRange(preset: typeof presetRanges[0]) {
  const end = new Date();
  let start: Date;

  if (preset.days) {
    start = new Date();
    start.setDate(start.getDate() - preset.days);
  }
  else if (preset.getStart) {
    start = preset.getStart();
    if (preset.getEnd) {
      const presetEnd = preset.getEnd();
      dateRange.value.end = presetEnd.toISOString().split('T')[0];
    }
    else {
      dateRange.value.end = end.toISOString().split('T')[0];
    }
  }
  else {
    start = new Date();
    start.setDate(start.getDate() - 7);
  }

  dateRange.value.start = start.toISOString().split('T')[0];
  if (!preset.getEnd) {
    dateRange.value.end = end.toISOString().split('T')[0];
  }
}

// Filter stints by date range and project
const filteredStints = computed(() => {
  const filtered = stints.value.filter((s) => {
    // Only completed stints
    if (s.status !== 'completed' || !s.ended_at) return false;

    // Date range filter
    if (dateRange.value.start || dateRange.value.end) {
      const stintDate = new Date(s.ended_at);
      stintDate.setHours(0, 0, 0, 0);

      if (dateRange.value.start) {
        const startDate = new Date(dateRange.value.start);
        startDate.setHours(0, 0, 0, 0);
        if (stintDate < startDate) return false;
      }

      if (dateRange.value.end) {
        const endDate = new Date(dateRange.value.end);
        endDate.setHours(23, 59, 59, 999);
        if (stintDate > endDate) return false;
      }
    }

    // Project filter
    if (selectedProjectId.value && s.project_id !== selectedProjectId.value) {
      return false;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    const dateA = a.ended_at ? new Date(a.ended_at).getTime() : 0;
    const dateB = b.ended_at ? new Date(b.ended_at).getTime() : 0;
    return dateB - dateA; // Most recent first
  });
});

// Summary statistics
const summary = computed(() => {
  const totalStints = filteredStints.value.length;
  const totalTimeSeconds = filteredStints.value.reduce((sum, s) => sum + (s.actual_duration || 0), 0);
  const totalTimeMinutes = Math.round(totalTimeSeconds / 60);
  const averageDuration = totalStints > 0 ? Math.round(totalTimeMinutes / totalStints) : 0;

  // Projects worked
  const projectIds = new Set(filteredStints.value.map(s => s.project_id));
  const projectsWorked = projects.value.filter(p => projectIds.has(p.id) && !p.archived_at).length;

  // Days with stints
  const daysWithStints = new Set(
    filteredStints.value.map((s) => {
      if (!s.ended_at) return '';
      const date = new Date(s.ended_at);
      return date.toISOString().split('T')[0];
    }).filter(Boolean),
  ).size;

  return {
    totalStints,
    totalTimeMinutes,
    totalTimeHours: Math.floor(totalTimeMinutes / 60),
    totalTimeRemainingMinutes: totalTimeMinutes % 60,
    averageDuration,
    projectsWorked,
    daysWithStints,
  };
});

// Project breakdown
const projectBreakdown = computed(() => {
  const breakdown = new Map<string, { project: ProjectRow, stintCount: number, totalTimeMinutes: number, stints: StintRow[] }>();

  filteredStints.value.forEach((stint) => {
    const existing = breakdown.get(stint.project_id);
    const timeMinutes = Math.round((stint.actual_duration || 0) / 60);

    if (existing) {
      existing.stintCount++;
      existing.totalTimeMinutes += timeMinutes;
      existing.stints.push(stint);
    }
    else {
      const project = projects.value.find(p => p.id === stint.project_id);
      if (project) {
        breakdown.set(stint.project_id, {
          project,
          stintCount: 1,
          totalTimeMinutes: timeMinutes,
          stints: [stint],
        });
      }
    }
  });

  return Array.from(breakdown.values())
    .sort((a, b) => b.totalTimeMinutes - a.totalTimeMinutes);
});

// Daily breakdown
const dailyBreakdown = computed(() => {
  const daily = new Map<string, { date: string, stintCount: number, totalTimeMinutes: number, stints: StintRow[] }>();

  filteredStints.value.forEach((stint) => {
    if (!stint.ended_at) return;

    const date = new Date(stint.ended_at);
    const dateKey = date.toISOString().split('T')[0];
    const timeMinutes = Math.round((stint.actual_duration || 0) / 60);

    const existing = daily.get(dateKey);
    if (existing) {
      existing.stintCount++;
      existing.totalTimeMinutes += timeMinutes;
      existing.stints.push(stint);
    }
    else {
      daily.set(dateKey, {
        date: dateKey,
        stintCount: 1,
        totalTimeMinutes: timeMinutes,
        stints: [stint],
      });
    }
  });

  return Array.from(daily.values())
    .sort((a, b) => b.date.localeCompare(a.date));
});

// Format helpers
function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Export functions
const toast = useToast();

function exportCSV() {
  if (filteredStints.value.length === 0) {
    toast.add({
      title: 'No data to export',
      description: 'Please select a date range with completed stints',
      color: 'warning',
      icon: 'i-lucide-alert-circle',
    });
    return;
  }

  // CSV header
  const headers = [
    'Date',
    'Project',
    'Started At',
    'Ended At',
    'Duration (minutes)',
    'Duration (hours)',
    'Status',
    'Notes',
  ];

  // CSV rows
  const rows = filteredStints.value.map((stint) => {
    const project = projects.value.find(p => p.id === stint.project_id);
    const durationMinutes = stint.actual_duration ? Math.round(stint.actual_duration / 60) : 0;
    const durationHours = (durationMinutes / 60).toFixed(2);

    return [
      stint.ended_at ? formatDate(stint.ended_at) : '',
      project?.name || 'Unknown',
      stint.started_at ? formatDateTime(stint.started_at) : '',
      stint.ended_at ? formatDateTime(stint.ended_at) : '',
      durationMinutes.toString(),
      durationHours,
      stint.status || '',
      (stint.notes || '').replace(/"/g, '""'), // Escape quotes
    ];
  });

  // Combine header and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `lifestint-report-${dateRange.value.start}-to-${dateRange.value.end}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast.add({
    title: 'CSV exported',
    description: `Exported ${filteredStints.value.length} stints`,
    color: 'success',
    icon: 'i-lucide-download',
  });
}

function exportJSON() {
  if (filteredStints.value.length === 0) {
    toast.add({
      title: 'No data to export',
      description: 'Please select a date range with completed stints',
      color: 'warning',
      icon: 'i-lucide-alert-circle',
    });
    return;
  }

  const exportData = {
    reportDate: new Date().toISOString(),
    dateRange: {
      start: dateRange.value.start,
      end: dateRange.value.end,
    },
    summary: {
      totalStints: summary.value.totalStints,
      totalTimeMinutes: summary.value.totalTimeMinutes,
      averageDurationMinutes: summary.value.averageDuration,
      projectsWorked: summary.value.projectsWorked,
      daysWithStints: summary.value.daysWithStints,
    },
    stints: filteredStints.value.map((stint) => {
      const project = projects.value.find(p => p.id === stint.project_id);
      return {
        id: stint.id,
        project: {
          id: project?.id,
          name: project?.name,
        },
        startedAt: stint.started_at,
        endedAt: stint.ended_at,
        durationSeconds: stint.actual_duration,
        durationMinutes: stint.actual_duration ? Math.round(stint.actual_duration / 60) : 0,
        status: stint.status,
        notes: stint.notes,
        completionType: stint.completion_type,
      };
    }),
    projectBreakdown: projectBreakdown.value.map(item => ({
      project: {
        id: item.project.id,
        name: item.project.name,
      },
      stintCount: item.stintCount,
      totalTimeMinutes: item.totalTimeMinutes,
    })),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `lifestint-report-${dateRange.value.start}-to-${dateRange.value.end}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast.add({
    title: 'JSON exported',
    description: `Exported ${filteredStints.value.length} stints`,
    color: 'success',
    icon: 'i-lucide-download',
  });
}

function exportPDF() {
  toast.add({
    title: 'PDF export',
    description: 'PDF export is coming soon. Please use CSV or JSON export for now.',
    color: 'info',
    icon: 'i-lucide-info',
  });
}

const isLoading = computed(() => stintsLoading.value || projectsLoading.value);
</script>

<template>
  <UContainer>
    <div class="space-y-6">
      <!-- Page Header -->
      <div>
        <h1 class="text-3xl font-bold">
          Reports
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Generate detailed reports and export your work data
        </p>
      </div>

      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="text-center py-12"
      >
        <Icon
          name="i-lucide-loader-2"
          class="h-8 w-8 mx-auto animate-spin text-gray-400"
        />
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Loading reports...
        </p>
      </div>

      <!-- Filters and Export -->
      <div
        v-else
        class="space-y-6"
      >
        <!-- Filters Section -->
        <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
          <template #header>
            <div class="flex items-center gap-2">
              <Icon
                name="i-lucide-filter"
                class="h-5 w-5"
              />
              <h2 class="text-lg font-semibold">
                Filters
              </h2>
            </div>
          </template>

          <div class="space-y-4">
            <!-- Preset Ranges -->
            <div>
              <label class="text-sm font-medium mb-2 block">
                Quick Select
              </label>
              <div class="flex flex-wrap gap-2">
                <UButton
                  v-for="preset in presetRanges"
                  :key="preset.label"
                  size="sm"
                  variant="outline"
                  @click="applyPresetRange(preset)"
                >
                  {{ preset.label }}
                </UButton>
              </div>
            </div>

            <!-- Date Range -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField
                label="Start Date"
                name="startDate"
              >
                <UInput
                  v-model="dateRange.start"
                  type="date"
                />
              </UFormField>

              <UFormField
                label="End Date"
                name="endDate"
              >
                <UInput
                  v-model="dateRange.end"
                  type="date"
                />
              </UFormField>
            </div>

            <!-- Project Filter -->
            <UFormField
              label="Project"
              name="project"
            >
              <select
                v-model="selectedProjectId"
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400"
              >
                <option :value="null">
                  All Projects
                </option>
                <option
                  v-for="project in projects.filter(p => !p.archived_at)"
                  :key="project.id"
                  :value="project.id"
                >
                  {{ project.name }}
                </option>
              </select>
            </UFormField>
          </div>
        </UCard>

        <!-- Summary Section -->
        <div>
          <h2 class="text-xl font-semibold mb-4">
            Summary
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-brand-100 dark:bg-brand-900/30">
                  <Icon
                    name="i-lucide-target"
                    class="h-5 w-5 text-brand-600 dark:text-brand-400"
                  />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Total Stints
                  </p>
                  <p class="text-2xl font-bold">
                    {{ summary.totalStints }}
                  </p>
                </div>
              </div>
            </UCard>

            <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-mint-100 dark:bg-mint-900/30">
                  <Icon
                    name="i-lucide-clock"
                    class="h-5 w-5 text-mint-600 dark:text-mint-400"
                  />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Total Time
                  </p>
                  <p class="text-2xl font-bold">
                    {{ formatTime(summary.totalTimeMinutes) }}
                  </p>
                </div>
              </div>
            </UCard>

            <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-amberx-100 dark:bg-amberx-900/30">
                  <Icon
                    name="i-lucide-trending-up"
                    class="h-5 w-5 text-amberx-600 dark:text-amberx-400"
                  />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Average Duration
                  </p>
                  <p class="text-2xl font-bold">
                    {{ summary.averageDuration }}m
                  </p>
                </div>
              </div>
            </UCard>

            <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Icon
                    name="i-lucide-folder"
                    class="h-5 w-5 text-purple-600 dark:text-purple-400"
                  />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Projects Worked
                  </p>
                  <p class="text-2xl font-bold">
                    {{ summary.projectsWorked }}
                  </p>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Export Section -->
        <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
          <template #header>
            <div class="flex items-center gap-2">
              <Icon
                name="i-lucide-download"
                class="h-5 w-5"
              />
              <h2 class="text-lg font-semibold">
                Export Reports
              </h2>
            </div>
          </template>

          <div class="flex flex-wrap gap-3">
            <UButton
              icon="i-lucide-file-spreadsheet"
              :disabled="filteredStints.length === 0"
              @click="exportCSV"
            >
              Export CSV
            </UButton>
            <UButton
              icon="i-lucide-file-code"
              :disabled="filteredStints.length === 0"
              variant="outline"
              @click="exportJSON"
            >
              Export JSON
            </UButton>
            <UButton
              icon="i-lucide-file-text"
              :disabled="filteredStints.length === 0"
              variant="outline"
              @click="exportPDF"
            >
              Export PDF
            </UButton>
          </div>

          <p class="text-sm text-gray-500 dark:text-gray-400 mt-3">
            {{ filteredStints.length }} {{ filteredStints.length === 1 ? 'stint' : 'stints' }} in selected range
          </p>
        </UCard>

        <!-- Project Breakdown -->
        <UCard
          v-if="projectBreakdown.length > 0"
          class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70"
        >
          <template #header>
            <div class="flex items-center gap-2">
              <Icon
                name="i-lucide-bar-chart-3"
                class="h-5 w-5"
              />
              <h2 class="text-lg font-semibold">
                Project Breakdown
              </h2>
            </div>
          </template>

          <div class="space-y-3">
            <div
              v-for="item in projectBreakdown"
              :key="item.project.id"
              class="space-y-2"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div
                    v-if="item.project.color_tag"
                    class="w-3 h-3 rounded-full"
                    :class="`bg-${item.project.color_tag}-500`"
                  />
                  <span class="font-medium">
                    {{ item.project.name }}
                  </span>
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  {{ item.stintCount }} {{ item.stintCount === 1 ? 'stint' : 'stints' }} · {{ formatTime(item.totalTimeMinutes) }}
                </div>
              </div>
              <div class="relative h-2 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                <div
                  class="h-full transition-all duration-500"
                  :class="`bg-${item.project.color_tag || 'brand'}-500`"
                  :style="{ width: summary.totalTimeMinutes > 0 ? `${(item.totalTimeMinutes / summary.totalTimeMinutes) * 100}%` : '0%' }"
                />
              </div>
            </div>
          </div>
        </UCard>

        <!-- Daily Breakdown -->
        <UCard
          v-if="dailyBreakdown.length > 0"
          class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70"
        >
          <template #header>
            <div class="flex items-center gap-2">
              <Icon
                name="i-lucide-calendar"
                class="h-5 w-5"
              />
              <h2 class="text-lg font-semibold">
                Daily Breakdown
              </h2>
            </div>
          </template>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Date
                  </th>
                  <th class="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Stints
                  </th>
                  <th class="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Time
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="day in dailyBreakdown"
                  :key="day.date"
                  class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td class="py-2 px-3 text-sm">
                    {{ formatDate(day.date) }}
                  </td>
                  <td class="py-2 px-3 text-sm">
                    {{ day.stintCount }}
                  </td>
                  <td class="py-2 px-3 text-sm">
                    {{ formatTime(day.totalTimeMinutes) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>

        <!-- Detailed Stint List -->
        <UCard
          v-if="filteredStints.length > 0"
          class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70"
        >
          <template #header>
            <div class="flex items-center gap-2">
              <Icon
                name="i-lucide-list"
                class="h-5 w-5"
              />
              <h2 class="text-lg font-semibold">
                Detailed Stint List
              </h2>
            </div>
          </template>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Date
                  </th>
                  <th class="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Project
                  </th>
                  <th class="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Duration
                  </th>
                  <th class="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="stint in filteredStints"
                  :key="stint.id"
                  class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td class="py-2 px-3 text-sm">
                    {{ stint.ended_at ? formatDate(stint.ended_at) : '-' }}
                  </td>
                  <td class="py-2 px-3 text-sm">
                    <div class="flex items-center gap-2">
                      <div
                        v-if="projects.find(p => p.id === stint.project_id)?.color_tag"
                        class="w-2 h-2 rounded-full"
                        :class="`bg-${projects.find(p => p.id === stint.project_id)?.color_tag}-500`"
                      />
                      {{ projects.find(p => p.id === stint.project_id)?.name || 'Unknown' }}
                    </div>
                  </td>
                  <td class="py-2 px-3 text-sm">
                    {{ stint.actual_duration ? formatTime(Math.round(stint.actual_duration / 60)) : '-' }}
                  </td>
                  <td class="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">
                    {{ stint.notes || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>

        <!-- Empty State -->
        <UCard
          v-if="filteredStints.length === 0"
          class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70"
        >
          <div class="text-center py-12">
            <Icon
              name="i-lucide-file-x"
              class="h-12 w-12 mx-auto text-gray-400 mb-4"
            />
            <p class="text-lg font-medium text-gray-900 dark:text-gray-100">
              No stints found
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Try adjusting your date range or project filter
            </p>
          </div>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>
