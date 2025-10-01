/**
 * Composable for managing timer state and lifecycle
 *
 * Provides accurate timer tracking using Web Workers
 *
 * Usage:
 * ```ts
 * const { start, pause, stop, resume, elapsedSeconds } = useTimer()
 * start()
 * ```
 */
export interface TimerState {
  isRunning: boolean
  isPaused: boolean
  elapsedSeconds: number
  startedAt: Date | null
  pausedAt: Date | null
}

export interface TimerOptions {
  onTick?: (elapsedSeconds: number) => void
  onComplete?: (elapsedSeconds: number) => void
  targetDuration?: number // in seconds
}

export function useTimer(options: TimerOptions = {}) {
  const state = ref<TimerState>({
    isRunning: false,
    isPaused: false,
    elapsedSeconds: 0,
    startedAt: null,
    pausedAt: null,
  })

  let worker: Worker | null = null
  let pausedElapsed = 0

  /**
   * Initialize Web Worker for accurate timing
   */
  function initWorker() {
    if (import.meta.client && !worker) {
      const workerCode = `
        let interval;
        let startTime;
        let pausedTime = 0;

        self.addEventListener('message', (e) => {
          const { type, pausedElapsed } = e.data;

          if (type === 'start') {
            startTime = Date.now();
            pausedTime = pausedElapsed || 0;

            interval = setInterval(() => {
              const elapsed = Math.floor((Date.now() - startTime) / 1000) + pausedTime;
              self.postMessage({ type: 'tick', elapsed });
            }, 1000);
          } else if (type === 'stop') {
            if (interval) {
              clearInterval(interval);
              interval = null;
            }
          }
        });
      `

      const blob = new Blob([workerCode], { type: 'application/javascript' })
      worker = new Worker(URL.createObjectURL(blob))

      worker.addEventListener('message', (e) => {
        if (e.data.type === 'tick') {
          state.value.elapsedSeconds = e.data.elapsed
          options.onTick?.(e.data.elapsed)

          // Check if target duration reached
          if (options.targetDuration && e.data.elapsed >= options.targetDuration) {
            stop()
            options.onComplete?.(e.data.elapsed)
          }
        }
      })
    }
  }

  /**
   * Start the timer
   */
  function start() {
    if (state.value.isRunning)
      return

    initWorker()
    state.value.isRunning = true
    state.value.isPaused = false
    state.value.startedAt = new Date()
    state.value.elapsedSeconds = 0
    pausedElapsed = 0

    worker?.postMessage({ type: 'start', pausedElapsed: 0 })
  }

  /**
   * Pause the timer
   */
  function pause() {
    if (!state.value.isRunning || state.value.isPaused)
      return

    state.value.isPaused = true
    state.value.pausedAt = new Date()
    pausedElapsed = state.value.elapsedSeconds

    worker?.postMessage({ type: 'stop' })
  }

  /**
   * Resume the timer from paused state
   */
  function resume() {
    if (!state.value.isPaused)
      return

    initWorker()
    state.value.isPaused = false
    state.value.pausedAt = null

    worker?.postMessage({ type: 'start', pausedElapsed })
  }

  /**
   * Stop the timer completely
   */
  function stop() {
    if (!state.value.isRunning)
      return

    state.value.isRunning = false
    state.value.isPaused = false
    state.value.pausedAt = null
    pausedElapsed = 0

    worker?.postMessage({ type: 'stop' })

    // Keep final elapsed time but mark as stopped
    const finalElapsed = state.value.elapsedSeconds
    return finalElapsed
  }

  /**
   * Reset timer to initial state
   */
  function reset() {
    stop()
    state.value.elapsedSeconds = 0
    state.value.startedAt = null
    pausedElapsed = 0
  }

  /**
   * Format elapsed time as HH:MM:SS
   */
  const formattedTime = computed(() => {
    const hours = Math.floor(state.value.elapsedSeconds / 3600)
    const minutes = Math.floor((state.value.elapsedSeconds % 3600) / 60)
    const seconds = state.value.elapsedSeconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  /**
   * Cleanup worker on unmount
   */
  onUnmounted(() => {
    if (worker) {
      worker.postMessage({ type: 'stop' })
      worker.terminate()
      worker = null
    }
  })

  return {
    state: readonly(state),
    start,
    pause,
    resume,
    stop,
    reset,
    formattedTime,
    elapsedSeconds: computed(() => state.value.elapsedSeconds),
    isRunning: computed(() => state.value.isRunning),
    isPaused: computed(() => state.value.isPaused),
  }
}
