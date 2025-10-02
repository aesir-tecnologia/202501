<script setup lang="ts">
interface HeatmapDay {
  date: string
  stints: number
  hours: number
  intensity: number
}

interface Props {
  dailyData: Array<{ date: string, stints: number, hours: number }>
  startDate?: Date
  endDate?: Date
}

const props = withDefaults(defineProps<Props>(), {
  startDate: () => {
    const date = new Date()
    date.setDate(date.getDate() - 90) // Last 90 days by default
    return date
  },
  endDate: () => new Date(),
})

// Tooltip state
const tooltipVisible = ref(false)
const tooltipContent = ref<{ date: string, stints: number, hours: number } | null>(null)
const tooltipPosition = ref({ x: 0, y: 0 })

// Generate heatmap data
const heatmapData = computed<HeatmapDay[]>(() => {
  const dataMap = new Map(props.dailyData.map(d => [d.date, d]))

  // Find max values for intensity calculation
  const maxStints = Math.max(...props.dailyData.map(d => d.stints), 1)

  // Generate all days in range
  const days: HeatmapDay[] = []
  const current = new Date(props.startDate)
  const end = new Date(props.endDate)

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    const data = dataMap.get(dateStr) || { date: dateStr, stints: 0, hours: 0 }
    const intensity = data.stints > 0 ? Math.ceil((data.stints / maxStints) * 4) : 0

    days.push({
      ...data,
      intensity,
    })

    current.setDate(current.getDate() + 1)
  }

  return days
})

// Group days by week
const weekRows = computed(() => {
  const weeks: HeatmapDay[][] = []
  let currentWeek: HeatmapDay[] = []

  // Pad start to begin on Sunday
  const firstDay = heatmapData.value[0]
  if (firstDay) {
    const firstDate = new Date(firstDay.date)
    const dayOfWeek = firstDate.getDay()
    for (let i = 0; i < dayOfWeek; i++) {
      currentWeek.push({
        date: '',
        stints: 0,
        hours: 0,
        intensity: 0,
      })
    }
  }

  heatmapData.value.forEach((day) => {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })

  // Pad last week if needed
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({
        date: '',
        stints: 0,
        hours: 0,
        intensity: 0,
      })
    }
    weeks.push(currentWeek)
  }

  return weeks
})

// Get intensity color class
function getIntensityClass(intensity: number): string {
  const baseClass = 'transition-colors duration-200'
  switch (intensity) {
    case 0:
      return `${baseClass} bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700`
    case 1:
      return `${baseClass} bg-green-200 dark:bg-green-900 hover:bg-green-300 dark:hover:bg-green-800`
    case 2:
      return `${baseClass} bg-green-400 dark:bg-green-700 hover:bg-green-500 dark:hover:bg-green-600`
    case 3:
      return `${baseClass} bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-400`
    case 4:
      return `${baseClass} bg-green-700 dark:bg-green-400 hover:bg-green-800 dark:hover:bg-green-300`
    default:
      return `${baseClass} bg-gray-100 dark:bg-gray-800`
  }
}

// Handle hover
function handleDayHover(day: HeatmapDay, event: MouseEvent) {
  if (!day.date) return

  tooltipContent.value = {
    date: new Date(day.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    stints: day.stints,
    hours: day.hours,
  }

  tooltipPosition.value = {
    x: event.clientX,
    y: event.clientY,
  }

  tooltipVisible.value = true
}

function handleDayLeave() {
  tooltipVisible.value = false
}

// Emit click event for detailed view
const emit = defineEmits<{
  dayClick: [date: string]
}>()

function handleDayClick(day: HeatmapDay) {
  if (day.date) {
    emit('dayClick', day.date)
  }
}
</script>

<template>
  <div class="relative">
    <!-- Heatmap Grid -->
    <div class="overflow-x-auto">
      <div class="inline-flex flex-col gap-1 min-w-max">
        <!-- Day labels -->
        <div class="flex gap-1 mb-1">
          <div class="w-3 h-3" />
          <div
            v-for="(week, idx) in weekRows"
            :key="idx"
            class="flex gap-1"
          >
            <div
              v-for="(day, dayIdx) in week"
              :key="dayIdx"
              class="w-3 h-3 text-[8px] text-gray-500 text-center"
            >
              {{ dayIdx === 0 && idx % 4 === 0 ? 'S' : '' }}
            </div>
          </div>
        </div>

        <!-- Week rows -->
        <div
          v-for="(week, weekIdx) in weekRows"
          :key="weekIdx"
          class="flex gap-1"
        >
          <!-- Week number on first column -->
          <div class="w-3 h-3 text-[8px] text-gray-500 flex items-center justify-end pr-1">
            {{ weekIdx % 4 === 0 ? 'W' + Math.ceil(weekIdx / 4) : '' }}
          </div>

          <!-- Day cells -->
          <div
            v-for="(day, dayIdx) in week"
            :key="dayIdx"
            :class="[
              'w-3 h-3 rounded-sm cursor-pointer border border-gray-200 dark:border-gray-700',
              getIntensityClass(day.intensity),
              !day.date && 'opacity-0 pointer-events-none',
            ]"
            @mouseenter="handleDayHover(day, $event)"
            @mouseleave="handleDayLeave"
            @click="handleDayClick(day)"
          />
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center gap-2 mt-4 text-xs text-gray-600 dark:text-gray-400">
      <span>Less</span>
      <div
        v-for="i in 5"
        :key="i"
        :class="[
          'w-3 h-3 rounded-sm',
          getIntensityClass(i - 1),
        ]"
      />
      <span>More</span>
    </div>

    <!-- Tooltip -->
    <Teleport to="body">
      <div
        v-if="tooltipVisible && tooltipContent"
        :style="{
          position: 'fixed',
          left: `${tooltipPosition.x + 10}px`,
          top: `${tooltipPosition.y + 10}px`,
          zIndex: 9999,
        }"
        class="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none"
      >
        <div class="font-semibold">
          {{ tooltipContent.date }}
        </div>
        <div class="mt-1 space-y-0.5">
          <div>{{ tooltipContent.stints }} stints</div>
          <div>{{ tooltipContent.hours }}h focus time</div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
