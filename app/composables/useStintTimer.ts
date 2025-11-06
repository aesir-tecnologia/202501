/**
 * Singleton Web Worker timer for stint tracking
 * Automatically starts/pauses/stops based on active stint state
 * Syncs with server every 60s to correct drift
 * Handles browser notifications on completion
 */

import type { Database } from '~/types/database.types'

type StintRow = Database['public']['Tables']['stints']['Row']

// Worker message types
type WorkerIncomingMessage
  = | { type: 'tick', secondsRemaining: number }
    | { type: 'complete' }
    | { type: 'error', message: string }

type WorkerOutgoingMessage
  = | { type: 'start', endTime: number, stintId: string }
    | { type: 'pause' }
    | { type: 'resume', endTime: number }
    | { type: 'stop' }
    | { type: 'sync', serverSecondsRemaining: number }

// Global singleton state
const globalTimerState = {
  worker: null as Worker | null,
  secondsRemaining: ref(0),
  isPaused: ref(false),
  isCompleted: ref(false),
  currentStintId: null as string | null,
  syncIntervalId: null as ReturnType<typeof setInterval> | null,
  notificationPermission: ref<NotificationPermission>('default'),
  isInitialized: false,
}

/**
 * Main composable - returns singleton timer state
 * Automatically manages timer based on active stint
 */
export function useStintTimer() {
  // Only initialize once and only on client
  if (!globalTimerState.isInitialized && import.meta.client) {
    initializeTimer()
    globalTimerState.isInitialized = true
  }

  return {
    secondsRemaining: readonly(globalTimerState.secondsRemaining),
    isPaused: readonly(globalTimerState.isPaused),
    isCompleted: readonly(globalTimerState.isCompleted),
  }
}

/**
 * Initialize the timer system
 * Sets up worker, watches active stint, and configures sync
 */
function initializeTimer(): void {
  // Create worker
  createWorker()

  // Watch active stint for auto-start/pause/stop
  const { data: activeStint } = useActiveStintQuery()

  watch(
    activeStint,
    (newStint, oldStint) => {
      handleStintChange(newStint, oldStint)
    },
    { immediate: true },
  )

  // Request notification permission on first load
  requestNotificationPermission()

  // Cleanup on unmount
  if (getCurrentScope()) {
    onUnmounted(() => {
      cleanup()
    })
  }
}

/**
 * Create and configure the Web Worker
 */
function createWorker(): void {
  if (globalTimerState.worker) return

  try {
    globalTimerState.worker = new Worker(
      new URL('../workers/timer.worker.ts', import.meta.url),
      { type: 'module' },
    )

    globalTimerState.worker.onmessage = handleWorkerMessage
    globalTimerState.worker.onerror = handleWorkerError
  }
  catch (error) {
    console.error('Failed to create timer worker:', error)
    useToast().add({
      title: 'Timer Error',
      description: 'Failed to initialize timer. Please refresh the page.',
      color: 'red',
    })
  }
}

/**
 * Handle messages from the worker
 */
function handleWorkerMessage(event: MessageEvent<WorkerIncomingMessage>): void {
  const message = event.data

  switch (message.type) {
    case 'tick':
      globalTimerState.secondsRemaining.value = message.secondsRemaining
      globalTimerState.isCompleted.value = false
      break

    case 'complete':
      globalTimerState.secondsRemaining.value = 0
      globalTimerState.isCompleted.value = true
      handleTimerComplete()
      break

    case 'error':
      console.error('Timer worker error:', message.message)
      break
  }
}

/**
 * Handle worker errors
 */
function handleWorkerError(error: ErrorEvent): void {
  console.error('Timer worker error:', error.message)
  useToast().add({
    title: 'Timer Error',
    description: 'Timer encountered an error. Please refresh if the timer stops working.',
    color: 'red',
  })
}

/**
 * Handle stint state changes (auto-start/pause/resume/stop)
 */
function handleStintChange(newStint: StintRow | null | undefined, _oldStint: StintRow | null | undefined): void {
  // Stint disappeared or completed
  if (!newStint || newStint.status === 'completed' || newStint.status === 'interrupted') {
    stopTimer()
    return
  }

  const stintId = newStint.id
  const status = newStint.status
  const wasRunning = globalTimerState.currentStintId === stintId

  if (status === 'active') {
    if (!wasRunning) {
      // Start timer (new stint or page refresh)
      startTimer(newStint)
    }
    else if (globalTimerState.isPaused.value) {
      // Resume from pause
      resumeTimer(newStint)
    }
  }
  else if (status === 'paused') {
    if (wasRunning && !globalTimerState.isPaused.value) {
      // Pause running timer
      pauseTimer()
    }
    else if (!wasRunning) {
      // Page refresh with paused stint - initialize display state
      initializePausedState(newStint)
    }
  }
}

/**
 * Start the timer for a new stint
 */
function startTimer(stint: StintRow): void {
  if (!globalTimerState.worker) return

  // Calculate end time
  const startedAt = new Date(stint.started_at!).getTime()
  const plannedDurationMs = (stint.planned_duration || 50) * 60 * 1000
  const endTime = startedAt + plannedDurationMs

  // Send start message to worker
  const message: WorkerOutgoingMessage = {
    type: 'start',
    endTime,
    stintId: stint.id,
  }
  globalTimerState.worker.postMessage(message)

  // Update state
  globalTimerState.currentStintId = stint.id
  globalTimerState.isPaused.value = false
  globalTimerState.isCompleted.value = false

  // Start server sync
  startServerSync(stint.id)
}

/**
 * Pause the timer
 */
function pauseTimer(): void {
  if (!globalTimerState.worker) return

  const message: WorkerOutgoingMessage = { type: 'pause' }
  globalTimerState.worker.postMessage(message)

  globalTimerState.isPaused.value = true

  // Stop server sync while paused
  stopServerSync()
}

/**
 * Resume the timer from pause
 */
function resumeTimer(stint: StintRow): void {
  if (!globalTimerState.worker) return

  // Calculate new end time accounting for paused duration
  const startedAt = new Date(stint.started_at!).getTime()
  const plannedDurationMs = (stint.planned_duration || 50) * 60 * 1000
  const pausedDurationMs = (stint.paused_duration || 0) * 1000
  const endTime = startedAt + plannedDurationMs + pausedDurationMs

  // Send resume message to worker
  const message: WorkerOutgoingMessage = {
    type: 'resume',
    endTime,
  }
  globalTimerState.worker.postMessage(message)

  globalTimerState.isPaused.value = false

  // Restart server sync
  startServerSync(stint.id)
}

/**
 * Stop the timer
 */
function stopTimer(): void {
  if (!globalTimerState.worker) return

  const message: WorkerOutgoingMessage = { type: 'stop' }
  globalTimerState.worker.postMessage(message)

  // Reset state
  globalTimerState.currentStintId = null
  globalTimerState.secondsRemaining.value = 0
  globalTimerState.isPaused.value = false
  globalTimerState.isCompleted.value = false

  // Stop server sync
  stopServerSync()
}

/**
 * Initialize state for paused stint (page refresh scenario)
 */
function initializePausedState(stint: StintRow): void {
  globalTimerState.currentStintId = stint.id
  globalTimerState.isPaused.value = true
  globalTimerState.isCompleted.value = false

  // Calculate remaining time for display
  const startedAt = new Date(stint.started_at!).getTime()
  const pausedAt = stint.paused_at ? new Date(stint.paused_at).getTime() : Date.now()
  const plannedDurationMs = (stint.planned_duration || 50) * 60 * 1000
  const elapsedMs = pausedAt - startedAt
  const remainingMs = Math.max(0, plannedDurationMs - elapsedMs)

  globalTimerState.secondsRemaining.value = Math.floor(remainingMs / 1000)
}

/**
 * Start server sync interval (every 60 seconds)
 */
function startServerSync(stintId: string): void {
  // Clear existing interval
  stopServerSync()

  // Sync every 60 seconds
  globalTimerState.syncIntervalId = setInterval(() => {
    syncWithServer(stintId)
  }, 60000)
}

/**
 * Stop server sync interval
 */
function stopServerSync(): void {
  if (globalTimerState.syncIntervalId) {
    clearInterval(globalTimerState.syncIntervalId)
    globalTimerState.syncIntervalId = null
  }
}

/**
 * Sync with server to correct timer drift
 */
async function syncWithServer(stintId: string): Promise<void> {
  if (!globalTimerState.worker) return

  try {
    const supabase = useSupabaseClient()
    const clientRemaining = globalTimerState.secondsRemaining.value

    // Call stint-sync-check Edge Function
    const { data, error } = await supabase.functions.invoke('stint-sync-check', {
      body: {
        stintId,
        remaining: clientRemaining,
      },
    })

    if (error) {
      console.error('Sync check failed:', error)
      return
    }

    // Check for drift
    const serverRemaining = data.secondsRemaining
    const drift = Math.abs(serverRemaining - clientRemaining)

    // Correct if drift > 5 seconds
    if (drift > 5) {
      console.log(`Timer drift detected: ${drift}s, correcting...`)

      const message: WorkerOutgoingMessage = {
        type: 'sync',
        serverSecondsRemaining: serverRemaining,
      }
      globalTimerState.worker.postMessage(message)
    }
  }
  catch (error) {
    console.error('Sync with server failed:', error)
    // Don't break the timer - just log and continue
  }
}

/**
 * Handle timer completion
 */
async function handleTimerComplete(): Promise<void> {
  // Get active stint to show project name in notification
  const { data: activeStint } = useActiveStintQuery()
  const stint = activeStint.value

  if (!stint) return

  // Fetch project details for notification
  const client = useSupabaseClient()
  const { data: project } = await client
    .from('projects')
    .select('name')
    .eq('id', stint.project_id)
    .single()

  const projectName = project?.name || 'Project'

  // Show browser notification
  showNotification(projectName)

  // Show toast notification as fallback
  useToast().add({
    title: 'Stint Completed!',
    description: `Your stint for ${projectName} has ended.`,
    color: 'green',
    timeout: 10000,
  })
}

/**
 * Request notification permission
 */
function requestNotificationPermission(): void {
  if (!('Notification' in window)) {
    globalTimerState.notificationPermission.value = 'denied'
    return
  }

  globalTimerState.notificationPermission.value = Notification.permission

  // Request permission if not already granted or denied
  if (Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      globalTimerState.notificationPermission.value = permission
    })
  }
}

/**
 * Show browser notification
 */
function showNotification(projectName: string): void {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  try {
    const notification = new Notification('Stint Completed! 🎉', {
      body: `Your stint for ${projectName} has ended. Time to take a break!`,
      icon: '/favicon.ico',
      tag: 'stint-complete',
      requireInteraction: false,
    })

    // Focus window when notification clicked
    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    // Auto-close after 10 seconds
    setTimeout(() => {
      notification.close()
    }, 10000)
  }
  catch (error) {
    console.error('Failed to show notification:', error)
  }
}

/**
 * Cleanup timer resources
 */
function cleanup(): void {
  // Stop worker
  if (globalTimerState.worker) {
    globalTimerState.worker.terminate()
    globalTimerState.worker = null
  }

  // Clear sync interval
  stopServerSync()

  // Reset state
  globalTimerState.currentStintId = null
  globalTimerState.secondsRemaining.value = 0
  globalTimerState.isPaused.value = false
  globalTimerState.isCompleted.value = false
  globalTimerState.isInitialized = false
}
