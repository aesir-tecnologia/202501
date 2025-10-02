<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  type ChartOptions,
} from 'chart.js'
import { Line, Bar } from 'vue-chartjs'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
)

definePageMeta({
  title: 'Analytics',
  middleware: 'auth',
})

useSeoMeta({
  title: 'Analytics - LifeStint',
  description: 'Track your productivity and analyze your focus sessions.',
})

// View state
const selectedView = ref<'daily' | 'weekly' | 'monthly'>('weekly')
const selectedDateRange = ref<'last7days' | 'last30days' | 'last90days' | 'thisYear'>('last30days')

// Analytics composable
const { analyticsData, isLoading, error, fetchAnalytics } = useAnalytics()

// Fetch analytics on mount and when date range changes
onMounted(() => {
  fetchAnalytics({ dateRange: selectedDateRange.value })
})

watch(selectedDateRange, (newRange) => {
  fetchAnalytics({ dateRange: newRange })
})

// Chart data from analytics
const lineChartData = computed(() => {
  const data = selectedView.value === 'daily'
    ? analyticsData.value.dailyData
    : selectedView.value === 'weekly'
      ? analyticsData.value.weeklyData
      : analyticsData.value.monthlyData

  return {
    labels: data.map(d => 'date' in d ? d.date : 'week' in d ? d.week : d.month),
    datasets: [
      {
        label: 'Focus Hours',
        data: data.map(d => d.hours),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  }
})

const barChartData = computed(() => ({
  labels: analyticsData.value.projectData.map(p => p.projectName),
  datasets: [
    {
      label: 'Stints Completed',
      data: analyticsData.value.projectData.map(p => p.stints),
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
    },
  ],
}))

// Chart options matching @nuxt/ui v4 theme
const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
    },
  },
}))

// Heatmap date range
const heatmapStartDate = computed(() => {
  const date = new Date()
  switch (selectedDateRange.value) {
    case 'last7days':
      date.setDate(date.getDate() - 7)
      break
    case 'last30days':
      date.setDate(date.getDate() - 30)
      break
    case 'last90days':
      date.setDate(date.getDate() - 90)
      break
    case 'thisYear':
      date.setMonth(0, 1)
      break
  }
  return date
})

const heatmapEndDate = computed(() => new Date())

// Handle heatmap day click
function handleDayClick(date: string) {
  console.log('Day clicked:', date)
  // Future: Navigate to detailed day view
}

// Export composables
const { exportToPDF, isExporting: isPDFExporting } = usePDFExport()
const { exportToCSV, isExporting: isCSVExporting } = useCSVExport()

// Export handlers
async function handleExportPDF() {
  try {
    await exportToPDF(analyticsData.value, {
      dateRange: selectedDateRange.value,
      title: 'LifeStint Analytics Report',
    })
  }
  catch (err) {
    console.error('Failed to export PDF:', err)
  }
}

async function handleExportCSV() {
  try {
    await exportToCSV(analyticsData.value, {
      includeDaily: true,
      includeWeekly: true,
      includeMonthly: true,
      includeProjects: true,
    })
  }
  catch (err) {
    console.error('Failed to export CSV:', err)
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <UPageHeader
      headline="Analytics"
      title="Progress & Insights"
      description="Track your productivity and analyze your focus sessions."
    >
      <template #actions>
        <UButton
          icon="i-lucide-file-down"
          variant="outline"
          :loading="isPDFExporting"
          @click="handleExportPDF"
        >
          Export PDF
        </UButton>
        <UButton
          icon="i-lucide-file-spreadsheet"
          variant="outline"
          :loading="isCSVExporting"
          @click="handleExportCSV"
        >
          Export CSV
        </UButton>
      </template>
    </UPageHeader>

    <!-- View Controls -->
    <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <UButtonGroup>
        <UButton
          :variant="selectedView === 'daily' ? 'solid' : 'ghost'"
          @click="selectedView = 'daily'"
        >
          Daily
        </UButton>
        <UButton
          :variant="selectedView === 'weekly' ? 'solid' : 'ghost'"
          @click="selectedView = 'weekly'"
        >
          Weekly
        </UButton>
        <UButton
          :variant="selectedView === 'monthly' ? 'solid' : 'ghost'"
          @click="selectedView = 'monthly'"
        >
          Monthly
        </UButton>
      </UButtonGroup>

      <USelect
        v-model="selectedDateRange"
        :options="[
          { label: 'Last 7 Days', value: 'last7days' },
          { label: 'Last 30 Days', value: 'last30days' },
          { label: 'Last 90 Days', value: 'last90days' },
          { label: 'This Year', value: 'thisYear' },
        ]"
      />
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      <UCard
        v-for="i in 2"
        :key="i"
        class="animate-pulse"
      >
        <div class="h-64 bg-gray-200 dark:bg-gray-800 rounded" />
      </UCard>
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="error"
      color="red"
      variant="subtle"
      title="Error loading analytics"
      :description="error.message"
    />

    <!-- Charts Grid -->
    <div
      v-else
      class="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      <!-- Focus Hours Over Time -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">
            Focus Hours Over Time
          </h3>
        </template>
        <div class="h-64">
          <Line
            :data="lineChartData"
            :options="chartOptions"
          />
        </div>
      </UCard>

      <!-- Projects Completion -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">
            Projects Completion
          </h3>
        </template>
        <div class="h-64">
          <Bar
            :data="barChartData"
            :options="chartOptions"
          />
        </div>
      </UCard>

      <!-- Activity Heatmap -->
      <UCard class="lg:col-span-2">
        <template #header>
          <h3 class="text-lg font-semibold">
            Activity Heatmap
          </h3>
        </template>
        <ActivityHeatmap
          :daily-data="analyticsData.dailyData"
          :start-date="heatmapStartDate"
          :end-date="heatmapEndDate"
          @day-click="handleDayClick"
        />
      </UCard>
    </div>

    <!-- Stats Summary -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {{ analyticsData.totalStints }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Total Stints
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-green-600 dark:text-green-400">
            {{ analyticsData.totalFocusHours }}h
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Focus Time
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {{ analyticsData.completionRate }}%
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Completion Rate
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {{ analyticsData.avgStintsPerDay }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Avg. Stints/Day
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
