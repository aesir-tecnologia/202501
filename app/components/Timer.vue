<script setup lang="ts">
import { useTimer } from '~/composables/useTimer'

export interface TimerProps {
  targetDuration?: number // in seconds
  autoStart?: boolean
  showControls?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<TimerProps>(), {
  autoStart: false,
  showControls: true,
  size: 'md',
})

const emit = defineEmits<{
  start: []
  pause: []
  resume: []
  stop: [elapsedSeconds: number]
  complete: [elapsedSeconds: number]
  tick: [elapsedSeconds: number]
}>()

const { showSuccess } = useErrorToast()

const {
  state,
  start,
  pause,
  resume,
  stop,
  reset,
  formattedTime,
  isRunning,
  isPaused,
} = useTimer({
  targetDuration: props.targetDuration,
  onTick: (elapsed) => {
    emit('tick', elapsed)
  },
  onComplete: (elapsed) => {
    emit('complete', elapsed)
    showSuccess('Timer completed!')
    playCompletionSound()
  },
})

function handleStart() {
  start()
  emit('start')
}

function handlePause() {
  pause()
  emit('pause')
}

function handleResume() {
  resume()
  emit('resume')
}

function handleStop() {
  const elapsed = stop()
  emit('stop', elapsed || 0)
}

function handleReset() {
  reset()
}

function playCompletionSound() {
  if (import.meta.client) {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ4NVa3n7q1aFgxEm9/yuWMdBjiKzvLQezMGH2q/7+SaRg4OUqvl765dGApBmN7xumQeBDWFy/LNfTIGHmm97+GaSBAOT6vk775gGgk+lNvvt2QeBDCDyPHNgjYGHWe77+GaRhIOTKjj7r1kHAk7kdnvsGYfBSx/xfDMhToFHGS55+CbSBEMSqXi7r1nHwk5jdbutWgfBSl+wvHMiD0GG2G25N+bShILSKPg7r1pIAk3i9fus2ogBSh7v/HLij0GGmC14t+cTRILRqHe7rxsIgk1iNTtsWwiBSZ6vPDKizsFGV6y4N+eTxMLRZ/c7rtwIwk0hdHss3AjBSR3ufDJjD0GGF2w39+gUBQKQ53a7r50JAk0gs/rs3IjBSJ2t+/IjT8GF1uu3t6iUhUKQpvY7r15Jgkzf8zrs3QkBSF0tO/HjkAGFlmt3N6jVRYKQZnW7r19JgkxfsjqsnclBSBzse/Gj0IGFVer2t2kVxYKQJfU7b1+KQkwfMbpsnclBR9xru/FkEQGFVWp2d2lWhgKPpXT7L2AKgkve8TorXklBR9wrO7ElkUGFFSn2NylXBkKPpLR6r2CKwkvesLnrHsnBR5vqe7EkkYGE1Om1tqlXhoKPZDQ6byDLAgvecDmq3woAxxtqO3Dk0cFElOk1NmmYBsKPY/O6buFLQgueLzmqn0pAxtrpuzDlUgFElKi0timYhwJPY3M6LyGLwgudr3lqX4qAxpqpOzClkgFEVGg0dmmZR0JPIvK57yIMAgueL7kqH8rAxppouzCmEkFEE+fz9enaB4IPIjI5ruJMggudsLcqYQuAxhppOvBmUsEEE6dzNmmah8IOobG5LuLMwgtdcDaqYYwAwdoo+vAmkwEDk2ay9qmbCAIOYTD47uOMgksc73ZqYgzAwZnouvAm04EDUyYydinbSII...)
    audio.play().catch(() => {
      // Ignore audio play errors
    })
  }
}

const displaySize = computed(() => {
  const sizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  }
  return sizes[props.size]
})

const buttonSize = computed(() => {
  const sizes = {
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'lg' as const,
  }
  return sizes[props.size]
})

// Auto-start if configured
onMounted(() => {
  if (props.autoStart) {
    handleStart()
  }
})

// Progress percentage
const progressPercentage = computed(() => {
  if (!props.targetDuration)
    return 0
  return Math.min((state.value.elapsedSeconds / props.targetDuration) * 100, 100)
})
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <!-- Timer display -->
    <div class="relative">
      <div
        :class="displaySize"
        class="font-mono font-bold tabular-nums"
        :class="{
          'text-green-600 dark:text-green-400': isRunning && !isPaused,
          'text-yellow-600 dark:text-yellow-400': isPaused,
          'text-gray-600 dark:text-gray-400': !isRunning,
        }"
      >
        {{ formattedTime }}
      </div>

      <!-- Status indicator -->
      <div class="absolute -top-2 -right-2">
        <UBadge
          v-if="isRunning && !isPaused"
          color="green"
          variant="solid"
          size="xs"
        >
          Running
        </UBadge>
        <UBadge
          v-else-if="isPaused"
          color="yellow"
          variant="solid"
          size="xs"
        >
          Paused
        </UBadge>
      </div>
    </div>

    <!-- Progress bar for target duration -->
    <UProgress
      v-if="targetDuration"
      :value="progressPercentage"
      :color="progressPercentage >= 100 ? 'green' : 'blue'"
      size="md"
      class="w-full"
    />

    <!-- Controls -->
    <div v-if="showControls" class="flex items-center gap-2">
      <UButton
        v-if="!isRunning"
        icon="i-lucide-play"
        color="green"
        :size="buttonSize"
        @click="handleStart"
      >
        Start
      </UButton>

      <UButton
        v-else-if="!isPaused"
        icon="i-lucide-pause"
        color="yellow"
        :size="buttonSize"
        @click="handlePause"
      >
        Pause
      </UButton>

      <UButton
        v-else
        icon="i-lucide-play"
        color="green"
        :size="buttonSize"
        @click="handleResume"
      >
        Resume
      </UButton>

      <UButton
        v-if="isRunning || isPaused"
        icon="i-lucide-square"
        color="red"
        variant="outline"
        :size="buttonSize"
        @click="handleStop"
      >
        Stop
      </UButton>

      <UButton
        v-if="!isRunning && state.elapsedSeconds > 0"
        icon="i-lucide-rotate-ccw"
        color="gray"
        variant="ghost"
        :size="buttonSize"
        @click="handleReset"
      >
        Reset
      </UButton>
    </div>

    <!-- Target duration indicator -->
    <div v-if="targetDuration" class="text-sm text-gray-600 dark:text-gray-400">
      Target: {{ Math.floor(targetDuration / 60) }}:{{ (targetDuration % 60).toString().padStart(2, '0') }}
    </div>
  </div>
</template>
