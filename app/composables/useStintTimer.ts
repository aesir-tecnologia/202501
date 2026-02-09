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
import { calculateRemainingSeconds } from '~/utils/stint-time';
import { syncStintCheck as syncStintCheckDb, completeStint } from '~/lib/supabase/stints';
import { stintKeys } from '~/composables/useStints';
import { streakKeys } from '~/composables/useStreaks';
import { STINT } from '~/constants';
import { isAuthError, withAuthRetry } from '~/utils/auth-recovery';
import { useCelebration } from '~/composables/useCelebration';
import { createLogger } from '~/utils/logger';

const log = createLogger('timer');

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
const DEFAULT_PLANNED_DURATION_MINUTES = STINT.DURATION_MINUTES.DEFAULT;
const WORKER_RETRY_BASE_DELAY_MS = 1000;
const NOTIFICATION_TIMEOUT_MS = 10000;
const AUTO_COMPLETE_MAX_RETRIES = 3;
const AUTO_COMPLETE_RETRY_DELAY_MS = 1000;
const MAX_SYNC_FAILURES_BEFORE_WARNING = 3;

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
  consecutiveSyncFailures: 0,
  syncWarningShown: false,
  checkAndCelebrate: null as (() => void) | null,
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
  const { checkAndCelebrate } = useCelebration();

  // Store references in global state for use in non-composable functions
  globalTimerState.queryClient = queryClient;
  globalTimerState.activeStintRef = activeStint;
  globalTimerState.toast = toast;
  globalTimerState.checkAndCelebrate = checkAndCelebrate;

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
    log.error('Failed to create timer worker:', error);

    workerCreationAttempts++;

    if (workerCreationAttempts < maxWorkerCreationAttempts) {
      // Retry after delay with exponential backoff
      const delayMs = WORKER_RETRY_BASE_DELAY_MS * workerCreationAttempts;
      log.info(`Retrying worker creation in ${delayMs}ms (attempt ${workerCreationAttempts + 1}/${maxWorkerCreationAttempts})`);

      setTimeout(() => {
        createWorker();
      }, delayMs);
    }
    else {
      // Max attempts reached - show error to user
      log.error('Max worker creation attempts reached');
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
      log.error('Timer worker error:', message.message);
      break;
  }
}

/**
 * Handle worker errors
 */
function handleWorkerError(error: ErrorEvent): void {
  log.error('Timer worker error:', error.message);
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
    log.error('Cannot start timer: worker not initialized');
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
    log.error('Cannot start timer: invalid started_at date', stint.started_at);
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
    log.error('Cannot resume timer: worker not initialized');
    globalTimerState.toast?.add({
      title: 'Timer Error',
      description: 'Timer not initialized. Please refresh the page.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
    return;
  }

  // Calculate new end time accounting for paused duration
  // Formula: endTime = startedAt + plannedDuration + pausedDuration
  // This extends the deadline by the total time spent paused, ensuring users get
  // the full planned duration of active work time even after pause/resume cycles.
  const startedAtDate = parseSafeDate(stint.started_at);
  if (!startedAtDate) {
    log.error('Cannot resume timer: invalid started_at date', stint.started_at);
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

  globalTimerState.secondsRemaining.value = calculateRemainingSeconds(stint);
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
 * Tracks consecutive failures and warns user after threshold
 * Attempts auth recovery on authentication errors
 */
async function syncWithServer(stintId: string): Promise<void> {
  if (!globalTimerState.worker) return;
  if (globalTimerState.isPaused.value) return;

  try {
    const supabase = useSupabaseClient();
    const clientRemaining = globalTimerState.secondsRemaining.value;

    // Call database sync check function with auth retry
    const { data, error } = await withAuthRetry(supabase, () =>
      syncStintCheckDb(supabase, stintId),
    );

    if (error || !data) {
      handleSyncFailure(error, isAuthError(error));
      return;
    }

    // Reset failure count on success
    globalTimerState.consecutiveSyncFailures = 0;
    globalTimerState.syncWarningShown = false;

    // RACE CONDITION FIX (GitHub #24): Handle stint already completed externally
    // (by Supabase cron, manual action in another tab, etc.). Invalidate cache to
    // trigger the watcher which will call stopTimer() and clean up gracefully.
    if (data.status === 'completed' || data.status === 'interrupted') {
      log.info('Sync detected stint completed externally, refreshing cache...');
      stopServerSync();
      try {
        if (globalTimerState.queryClient) {
          await globalTimerState.queryClient.invalidateQueries({
            queryKey: stintKeys.all,
          });
        }
      }
      catch (cacheError) {
        log.error('Failed to invalidate cache after detecting completed stint:', cacheError);
        globalTimerState.toast?.add({
          title: 'Sync Issue',
          description: 'Your stint was completed but the display may be outdated. Please refresh the page.',
          color: 'warning',
          icon: 'i-lucide-refresh-cw',
        });
      }
      return;
    }

    if (data.status === 'paused') {
      log.info('Sync detected stint paused, stopping sync...');
      stopServerSync();
      return;
    }

    // Check for drift
    const serverRemaining = data.remainingSeconds;
    const drift = Math.abs(serverRemaining - clientRemaining);

    // Correct if drift > threshold
    if (drift > TIMER_DRIFT_THRESHOLD_SECONDS) {
      log.info(`Timer drift detected: ${drift}s, correcting...`);

      const message: WorkerOutgoingMessage = {
        type: 'sync',
        serverSecondsRemaining: serverRemaining,
      };
      globalTimerState.worker.postMessage(message);
    }
  }
  catch (error) {
    handleSyncFailure(error, isAuthError(error));
  }
}

/**
 * Handle sync failure - tracks consecutive failures and warns user
 * Auth errors trigger redirect to login after recovery fails
 */
function handleSyncFailure(error: unknown, isAuth: boolean = false): void {
  globalTimerState.consecutiveSyncFailures++;

  log.error('Sync with server failed:', error, {
    failureCount: globalTimerState.consecutiveSyncFailures,
    isAuthError: isAuth,
  });

  // Auth errors that persist after retry: redirect to login
  if (isAuth) {
    globalTimerState.toast?.add({
      title: 'Session Expired',
      description: 'Your session has expired. Please log in again.',
      color: 'error',
      icon: 'i-lucide-log-out',
    });
    navigateTo('/auth/login');
    return;
  }

  // Show warning after threshold consecutive failures (only once per failure streak)
  if (
    globalTimerState.consecutiveSyncFailures >= MAX_SYNC_FAILURES_BEFORE_WARNING
    && !globalTimerState.syncWarningShown
  ) {
    globalTimerState.syncWarningShown = true;
    globalTimerState.toast?.add({
      title: 'Timer Sync Issue',
      description: 'Unable to sync with server. Timer may be slightly inaccurate.',
      color: 'warning',
      icon: 'i-lucide-wifi-off',
    });
  }
}

/**
 * Handle timer completion - auto-completes stint in database with retry logic
 * Uses auth recovery on authentication errors
 * If all retries fail, resets timer state and prompts user to complete manually
 */
async function handleTimerComplete(): Promise<void> {
  const activeStint = globalTimerState.activeStintRef?.value;
  if (!activeStint) return;

  // RACE CONDITION FIX (GitHub #24): Pre-check stint status before completion
  // If another actor (Supabase cron, manual action, etc.) already completed this
  // stint, just refresh the cache and let the watcher handle cleanup.
  if (activeStint.status !== 'active' && activeStint.status !== 'paused') {
    log.info('Stint already completed/interrupted, skipping auto-complete');
    try {
      if (globalTimerState.queryClient) {
        await globalTimerState.queryClient.invalidateQueries({
          queryKey: stintKeys.all,
        });
      }
    }
    catch (cacheError) {
      log.error('Failed to invalidate cache after skipping auto-complete:', cacheError);
      globalTimerState.toast?.add({
        title: 'Sync Issue',
        description: 'Your stint was completed but the display may be outdated. Please refresh the page.',
        color: 'warning',
        icon: 'i-lucide-refresh-cw',
      });
    }
    return;
  }

  const client = useSupabaseClient();
  let lastError: Error | null = null;
  let authErrorEncountered = false;

  // Retry loop for auto-completion
  for (let attempt = 1; attempt <= AUTO_COMPLETE_MAX_RETRIES; attempt++) {
    // Use auth retry wrapper - attempts session refresh on auth errors
    const { data, error } = await withAuthRetry(client, () =>
      completeStint(client, activeStint.id, 'auto', null),
    );

    if (!error && data) {
      // Success - refetch caches (await to ensure fresh data for celebration check)
      if (globalTimerState.queryClient) {
        await globalTimerState.queryClient.refetchQueries({
          queryKey: stintKeys.all,
        });

        // Invalidate streak cache to trigger refetch and update dashboard banner
        await globalTimerState.queryClient.invalidateQueries({
          queryKey: streakKeys.all,
        });
      }

      // Fetch project name for notification
      const { data: project } = await client
        .from('projects')
        .select('name')
        .eq('id', activeStint.project_id)
        .single();

      const projectName = project?.name || 'Project';
      showNotification(projectName);

      // Check if daily goal was achieved and celebrate
      if (globalTimerState.checkAndCelebrate) {
        globalTimerState.checkAndCelebrate();
      }
      return;
    }

    // Track error for final failure message
    lastError = error || new Error('Failed to complete stint');

    // Check if this is an auth error (session refresh already attempted by withAuthRetry)
    if (isAuthError(error)) {
      authErrorEncountered = true;
      // Don't retry on auth errors - session refresh already failed
      break;
    }

    // Log retry attempt
    log.error(`Auto-complete attempt ${attempt}/${AUTO_COMPLETE_MAX_RETRIES} failed:`, error);

    // Wait before retrying (except on last attempt)
    if (attempt < AUTO_COMPLETE_MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, AUTO_COMPLETE_RETRY_DELAY_MS * attempt));
    }
  }

  // All retries failed - reset timer state to reflect actual database state
  globalTimerState.timerCompleted.value = false;

  log.error('Auto-complete failed after all retries:', lastError);

  // Auth errors: redirect to login with clear message
  if (authErrorEncountered) {
    globalTimerState.toast?.add({
      title: 'Session Expired',
      description: 'Your session expired and your stint could not be saved. Please log in and complete it manually.',
      color: 'error',
      icon: 'i-lucide-log-out',
    });
    navigateTo('/auth/login');
    return;
  }

  // Non-auth errors: prompt manual completion
  globalTimerState.toast?.add({
    title: 'Auto-Complete Failed',
    description: 'Could not save completion automatically. Please complete your stint manually.',
    color: 'error',
    icon: 'i-lucide-alert-circle',
  });

  // Invalidate queries to refresh UI with actual database state
  if (globalTimerState.queryClient) {
    await globalTimerState.queryClient.invalidateQueries({
      queryKey: stintKeys.all,
    });
  }
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
    Notification.requestPermission()
      .then((permission) => {
        globalTimerState.notificationPermission.value = permission;
      })
      .catch((error) => {
        log.warn('Failed to request notification permission:', error);
        globalTimerState.notificationPermission.value = 'denied';
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
    log.error('Failed to show notification:', error);
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
  globalTimerState.consecutiveSyncFailures = 0;
  globalTimerState.syncWarningShown = false;
  globalTimerState.toast = null;
  globalTimerState.isInitialized = false;
}
