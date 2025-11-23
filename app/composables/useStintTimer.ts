/**
 * Singleton Web Worker timer for stint tracking
 * Automatically starts/pauses/stops based on active stint state
 * Syncs with server every 60s to correct drift
 * Handles browser notifications on completion
 */

import type { Database } from '~/types/database.types';
import { useQueryClient } from '@tanstack/vue-query';
import { useActiveStintQuery } from './useStints';
import { parseSafeDate } from '~/utils/date-helpers';

type StintRow = Database['public']['Tables']['stints']['Row'];

// Worker message types
type WorkerIncomingMessage
  = | { type: 'tick', secondsRemaining: number }
    | { type: 'complete' }
    | { type: 'error', message: string };

type WorkerOutgoingMessage
  = | { type: 'start', endTime: number, stintId: string }
    | { type: 'pause' }
    | { type: 'resume', endTime: number }
    | { type: 'stop' }
    | { type: 'sync', serverSecondsRemaining: number };

// Timer configuration constants
const TIMER_DRIFT_THRESHOLD_SECONDS = 5;
const TIMER_SYNC_INTERVAL_MS = 60000;
const DEFAULT_PLANNED_DURATION_MINUTES = 50;
const WORKER_RETRY_BASE_DELAY_MS = 1000;
const NOTIFICATION_TIMEOUT_MS = 10000;

// Global singleton state
const globalTimerState = {
  worker: null as Worker | null,
  secondsRemaining: ref(0),
  isPaused: ref(false),
  timerCompleted: ref(false),
  currentStintId: null as string | null,
  syncIntervalId: null as ReturnType<typeof setInterval> | null,
  notificationPermission: ref<NotificationPermission>('default'),
  isInitialized: false,
  queryClient: null as ReturnType<typeof useQueryClient> | null,
  activeStintRef: null as Ref<StintRow | null | undefined> | null,
  stopWatch: null as (() => void) | null,
  toast: null as ReturnType<typeof useToast> | null,
};

// Worker creation retry state
let workerCreationAttempts = 0;
const maxWorkerCreationAttempts = 3;

/**
 * Main composable - returns singleton timer state
 * Automatically manages timer based on active stint
 */
export function useStintTimer() {
  // Call vue-query hooks at composable level (required for proper injection context)
  const { data: activeStint } = useActiveStintQuery();
  const queryClient = useQueryClient();
  const toast = useToast();

  // Store references in global state for use in non-composable functions
  globalTimerState.queryClient = queryClient;
  globalTimerState.activeStintRef = activeStint;
  globalTimerState.toast = toast;

  // Only initialize once and only on client
  if (!globalTimerState.isInitialized && import.meta.client) {
    initializeTimer();

    // Set up watcher only once
    globalTimerState.stopWatch = watch(
      activeStint,
      (newStint, oldStint) => {
        handleStintChange(newStint, oldStint);
      },
      { immediate: true },
    );

    globalTimerState.isInitialized = true;
  }

  // Don't cleanup on component unmount - singleton persists across navigation
  // Cleanup only happens on beforeunload (when user leaves the app entirely)
  onUnmounted(() => {
    // Intentionally empty - singleton resources persist
  });

  return {
    secondsRemaining: readonly(globalTimerState.secondsRemaining),
    isPaused: readonly(globalTimerState.isPaused),
    timerCompleted: readonly(globalTimerState.timerCompleted),
  };
}

/**
 * Initialize the timer system
 * Sets up worker and configures sync
 */
function initializeTimer(): void {
  // Create worker
  createWorker();

  // Request notification permission on first load
  requestNotificationPermission();

  // Cleanup singleton resources when user navigates away from app
  if (import.meta.client) {
    window.addEventListener('beforeunload', _cleanup);
  }
}

/**
 * Create and configure the Web Worker
 */
function createWorker(): void {
  if (globalTimerState.worker) return;

  try {
    globalTimerState.worker = new Worker(
      new URL('../workers/timer.worker.ts', import.meta.url),
      { type: 'module' },
    );

    globalTimerState.worker.onmessage = handleWorkerMessage;
    globalTimerState.worker.onerror = handleWorkerError;

    // Reset attempts on success
    workerCreationAttempts = 0;
  }
  catch (error) {
    console.error('Failed to create timer worker:', error);

    workerCreationAttempts++;

    if (workerCreationAttempts < maxWorkerCreationAttempts) {
      // Retry after delay with exponential backoff
      const delayMs = WORKER_RETRY_BASE_DELAY_MS * workerCreationAttempts;
      console.log(`Retrying worker creation in ${delayMs}ms (attempt ${workerCreationAttempts + 1}/${maxWorkerCreationAttempts})`);

      setTimeout(() => {
        createWorker();
      }, delayMs);
    }
    else {
      // Max attempts reached - show error to user
      console.error('Max worker creation attempts reached');
      globalTimerState.toast?.add({
        title: 'Timer Error',
        description: 'Failed to initialize timer. Please refresh the page.',
        color: 'error',
        icon: 'i-lucide-alert-circle',
      });
    }
  }
}

/**
 * Handle messages from the worker
 */
function handleWorkerMessage(event: MessageEvent<WorkerIncomingMessage>): void {
  const message = event.data;

  switch (message.type) {
    case 'tick':
      globalTimerState.secondsRemaining.value = message.secondsRemaining;
      globalTimerState.timerCompleted.value = false;
      break;

    case 'complete':
      globalTimerState.secondsRemaining.value = 0;
      globalTimerState.timerCompleted.value = true;
      handleTimerComplete();
      break;

    case 'error':
      console.error('Timer worker error:', message.message);
      break;
  }
}

/**
 * Handle worker errors
 */
function handleWorkerError(error: ErrorEvent): void {
  console.error('Timer worker error:', error.message);
  globalTimerState.toast?.add({
    title: 'Timer Error',
    description: 'Timer encountered an error. Please refresh if the timer stops working.',
    color: 'error',
  });
}

/**
 * Handle stint state changes (auto-start/pause/resume/stop)
 */
function handleStintChange(newStint: StintRow | null | undefined, _oldStint: StintRow | null | undefined): void {
  // Stint disappeared or completed
  if (!newStint || newStint.status === 'completed' || newStint.status === 'interrupted') {
    stopTimer();
    return;
  }

  const stintId = newStint.id;
  const status = newStint.status;
  const wasRunning = globalTimerState.currentStintId === stintId;

  if (status === 'active') {
    if (!wasRunning) {
      // Start timer (new stint or page refresh)
      startTimer(newStint);
    }
    else if (globalTimerState.isPaused.value) {
      // Resume from pause
      resumeTimer(newStint);
    }
  }
  else if (status === 'paused') {
    if (wasRunning && !globalTimerState.isPaused.value) {
      // Pause running timer
      pauseTimer();
    }
    else if (!wasRunning) {
      // Page refresh with paused stint - initialize display state
      initializePausedState(newStint);
    }
  }
}

/**
 * Start the timer for a new stint
 */
function startTimer(stint: StintRow): void {
  if (!globalTimerState.worker) {
    console.error('Cannot start timer: worker not initialized');
    globalTimerState.toast?.add({
      title: 'Timer Error',
      description: 'Timer not initialized. Please refresh the page.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
    return;
  }

  // Calculate end time
  const startedAtDate = parseSafeDate(stint.started_at);
  if (!startedAtDate) {
    console.error('Cannot start timer: invalid started_at date', stint.started_at);
    globalTimerState.toast?.add({
      title: 'Timer Error',
      description: 'Invalid stint start time. Please try again.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
    return;
  }
  const startedAt = startedAtDate.getTime();
  const plannedDurationMs = (stint.planned_duration || DEFAULT_PLANNED_DURATION_MINUTES) * 60 * 1000;
  const endTime = startedAt + plannedDurationMs;

  // Send start message to worker
  const message: WorkerOutgoingMessage = {
    type: 'start',
    endTime,
    stintId: stint.id,
  };
  globalTimerState.worker.postMessage(message);

  // Update state
  globalTimerState.currentStintId = stint.id;
  globalTimerState.isPaused.value = false;
  globalTimerState.timerCompleted.value = false;

  // Start server sync
  startServerSync(stint.id);
}

/**
 * Pause the timer
 */
function pauseTimer(): void {
  if (!globalTimerState.worker) return;

  const message: WorkerOutgoingMessage = { type: 'pause' };
  globalTimerState.worker.postMessage(message);

  globalTimerState.isPaused.value = true;

  // Stop server sync while paused
  stopServerSync();
}

/**
 * Resume the timer from pause
 */
function resumeTimer(stint: StintRow): void {
  if (!globalTimerState.worker) {
    console.error('Cannot resume timer: worker not initialized');
    globalTimerState.toast?.add({
      title: 'Timer Error',
      description: 'Timer not initialized. Please refresh the page.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
    return;
  }

  // Calculate new end time accounting for paused duration
  const startedAtDate = parseSafeDate(stint.started_at);
  if (!startedAtDate) {
    console.error('Cannot resume timer: invalid started_at date', stint.started_at);
    globalTimerState.toast?.add({
      title: 'Timer Error',
      description: 'Invalid stint start time. Please try again.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
    return;
  }
  const startedAt = startedAtDate.getTime();
  const plannedDurationMs = (stint.planned_duration || DEFAULT_PLANNED_DURATION_MINUTES) * 60 * 1000;
  const pausedDurationMs = (stint.paused_duration || 0) * 1000;
  const endTime = startedAt + plannedDurationMs + pausedDurationMs;

  // Send resume message to worker
  const message: WorkerOutgoingMessage = {
    type: 'resume',
    endTime,
  };
  globalTimerState.worker.postMessage(message);

  globalTimerState.isPaused.value = false;

  // Restart server sync
  startServerSync(stint.id);
}

/**
 * Stop the timer
 */
function stopTimer(): void {
  if (!globalTimerState.worker) return;

  const message: WorkerOutgoingMessage = { type: 'stop' };
  globalTimerState.worker.postMessage(message);

  // Reset state
  globalTimerState.currentStintId = null;
  globalTimerState.secondsRemaining.value = 0;
  globalTimerState.isPaused.value = false;
  globalTimerState.timerCompleted.value = false;

  // Stop server sync
  stopServerSync();
}

/**
 * Initialize state for paused stint (page refresh scenario)
 */
function initializePausedState(stint: StintRow): void {
  globalTimerState.currentStintId = stint.id;
  globalTimerState.isPaused.value = true;
  globalTimerState.timerCompleted.value = false;

  // Calculate remaining time for display
  const startedAtDate = parseSafeDate(stint.started_at);
  if (!startedAtDate) {
    console.error('Cannot initialize paused state: invalid started_at date', stint.started_at);
    return;
  }
  const startedAt = startedAtDate.getTime();
  const pausedAtDate = stint.paused_at ? parseSafeDate(stint.paused_at) : null;
  const pausedAt = pausedAtDate ? pausedAtDate.getTime() : Date.now();
  const plannedDurationMs = (stint.planned_duration || DEFAULT_PLANNED_DURATION_MINUTES) * 60 * 1000;
  const pausedDurationMs = (stint.paused_duration || 0) * 1000;

  // Calculate active duration (elapsed time minus paused time)
  const elapsedMs = pausedAt - startedAt;
  const activeDurationMs = elapsedMs - pausedDurationMs;
  const remainingMs = Math.max(0, plannedDurationMs - activeDurationMs);

  globalTimerState.secondsRemaining.value = Math.floor(remainingMs / 1000);
}

/**
 * Start server sync interval (every 60 seconds)
 */
function startServerSync(stintId: string): void {
  // Clear existing interval
  stopServerSync();

  // Sync every 60 seconds
  globalTimerState.syncIntervalId = setInterval(() => {
    syncWithServer(stintId);
  }, TIMER_SYNC_INTERVAL_MS);
}

/**
 * Stop server sync interval
 */
function stopServerSync(): void {
  if (globalTimerState.syncIntervalId) {
    clearInterval(globalTimerState.syncIntervalId);
    globalTimerState.syncIntervalId = null;
  }
}

/**
 * Sync with server to correct timer drift
 */
async function syncWithServer(stintId: string): Promise<void> {
  if (!globalTimerState.worker) return;

  try {
    const supabase = useSupabaseClient();
    const clientRemaining = globalTimerState.secondsRemaining.value;

    // Get auth token for Edge Function
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('No active session for sync check');
      return;
    }

    // Construct URL with query parameters
    const config = useRuntimeConfig();
    const url = new URL(`${config.public.supabase.url}/functions/v1/stint-sync-check`);
    url.searchParams.set('stintId', stintId);
    url.searchParams.set('remaining', clientRemaining.toString());

    // Make GET request to Edge Function
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': config.public.supabase.key,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Sync check failed:', response.status, response.statusText);
      return;
    }

    const data = await response.json();

    // Check for drift
    const serverRemaining = data.secondsRemaining;
    const drift = Math.abs(serverRemaining - clientRemaining);

    // Correct if drift > threshold
    if (drift > TIMER_DRIFT_THRESHOLD_SECONDS) {
      console.log(`Timer drift detected: ${drift}s, correcting...`);

      const message: WorkerOutgoingMessage = {
        type: 'sync',
        serverSecondsRemaining: serverRemaining,
      };
      globalTimerState.worker.postMessage(message);
    }
  }
  catch (error) {
    console.error('Sync with server failed:', error);
    // Don't break the timer - just log and continue
  }
}

/**
 * Handle timer completion
 */
async function handleTimerComplete(): Promise<void> {
  // Get active stint from stored ref (set up at composable level)
  const activeStint = globalTimerState.activeStintRef?.value;

  if (!activeStint) return;

  // Fetch project details for notification
  const client = useSupabaseClient();
  const { data: project } = await client
    .from('projects')
    .select('name')
    .eq('id', activeStint.project_id)
    .single();

  const projectName = project?.name || 'Project';

  // Show browser notification
  showNotification(projectName);

  // Show toast notification as fallback
  globalTimerState.toast?.add({
    title: 'Stint Completed!',
    description: `Your stint for ${projectName} has ended.`,
    color: 'success',
  });
}

/**
 * Request notification permission
 */
function requestNotificationPermission(): void {
  if (!('Notification' in window)) {
    globalTimerState.notificationPermission.value = 'denied';
    return;
  }

  globalTimerState.notificationPermission.value = Notification.permission;

  // Request permission if not already granted or denied
  if (Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      globalTimerState.notificationPermission.value = permission;
    });
  }
}

/**
 * Show browser notification
 */
function showNotification(projectName: string): void {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notification = new Notification('Stint Completed! 🎉', {
      body: `Your stint for ${projectName} has ended. Time to take a break!`,
      icon: '/favicon.ico',
      tag: 'stint-complete',
      requireInteraction: false,
    });

    // Focus window when notification clicked
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after timeout
    setTimeout(() => {
      notification.close();
    }, NOTIFICATION_TIMEOUT_MS);
  }
  catch (error) {
    console.error('Failed to show notification:', error);
  }
}

/**
 * Cleanup timer resources
 * Called on component unmount to properly cleanup singleton
 */
function _cleanup(): void {
  // Stop sync interval first (before terminating worker)
  stopServerSync();

  // Clean up watcher
  if (globalTimerState.stopWatch) {
    globalTimerState.stopWatch();
    globalTimerState.stopWatch = null;
  }

  // Stop worker
  if (globalTimerState.worker) {
    globalTimerState.worker.terminate();
    globalTimerState.worker = null;
  }

  // Reset state
  globalTimerState.currentStintId = null;
  globalTimerState.secondsRemaining.value = 0;
  globalTimerState.isPaused.value = false;
  globalTimerState.timerCompleted.value = false;
  globalTimerState.toast = null;
  globalTimerState.isInitialized = false;
}
