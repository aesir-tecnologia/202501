/**
 * Web Worker for background stint timer
 * Runs countdown timer independently of main thread
 * Continues running even when tab is in background
 */

// Worker state
let intervalId: ReturnType<typeof setInterval> | null = null;
let endTime: number | null = null;
let _stintId: string | null = null;
let isPaused = false;

// Message types from main thread
type IncomingMessage
  = | { type: 'start', endTime: number, stintId: string }
    | { type: 'pause' }
    | { type: 'resume', endTime: number }
    | { type: 'stop' }
    | { type: 'sync', serverSecondsRemaining: number };

// Message types to main thread
type OutgoingMessage
  = | { type: 'tick', secondsRemaining: number }
    | { type: 'complete' }
    | { type: 'error', message: string };

/**
 * Start the countdown timer
 */
function startTimer(newEndTime: number, newStintId: string): void {
  // Clean up existing timer if any
  if (intervalId) {
    clearInterval(intervalId);
  }

  endTime = newEndTime;
  _stintId = newStintId;
  isPaused = false;

  // Start interval - tick every second
  intervalId = setInterval(tick, 1000);

  // Immediate first tick for instant UI feedback
  tick();
}

/**
 * Pause the timer (stop ticking)
 */
function pauseTimer(): void {
  isPaused = true;
}

/**
 * Resume the timer with new end time
 * The composable calculates the adjusted end time accounting for pause duration
 */
function resumeTimer(newEndTime: number): void {
  endTime = newEndTime;
  isPaused = false;

  // Immediate tick to update UI
  tick();
}

/**
 * Stop and reset the timer
 */
function stopTimer(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  endTime = null;
  _stintId = null;
  isPaused = false;
}

/**
 * Sync timer with server to correct drift
 * Server provides authoritative remaining time
 */
function syncWithServer(serverSecondsRemaining: number): void {
  if (!endTime) return;

  // Calculate new end time based on server's remaining time
  const now = Date.now();
  const newEndTime = now + serverSecondsRemaining * 1000;

  endTime = newEndTime;

  // Immediate tick to update UI with corrected time
  tick();
}

/**
 * Tick function - calculates and posts remaining time
 * Called every second by setInterval
 */
function tick(): void {
  // Don't tick if paused or no end time set
  if (!endTime || isPaused) return;

  const now = Date.now();
  const msRemaining = endTime - now;
  const secondsRemaining = Math.max(0, Math.floor(msRemaining / 1000));

  // Post tick message to main thread
  const message: OutgoingMessage = {
    type: 'tick',
    secondsRemaining,
  };
  self.postMessage(message);

  // Check if timer completed
  if (secondsRemaining === 0) {
    const completeMessage: OutgoingMessage = { type: 'complete' };
    self.postMessage(completeMessage);
    stopTimer();
  }
}

/**
 * Handle messages from main thread
 */
self.onmessage = (event: MessageEvent<IncomingMessage>) => {
  try {
    const message = event.data;

    switch (message.type) {
      case 'start':
        startTimer(message.endTime, message.stintId);
        break;

      case 'pause':
        pauseTimer();
        break;

      case 'resume':
        resumeTimer(message.endTime);
        break;

      case 'stop':
        stopTimer();
        break;

      case 'sync':
        syncWithServer(message.serverSecondsRemaining);
        break;

      default:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error(`Unknown message type: ${(message as any).type}`);
    }
  }
  catch (error) {
    const errorMessage: OutgoingMessage = {
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error in timer worker',
    };
    self.postMessage(errorMessage);
  }
};

/**
 * Handle worker errors
 */
self.onerror = (error) => {
  const message = typeof error === 'string'
    ? error
    : (error instanceof ErrorEvent ? error.message : 'Worker error occurred');

  const errorMessage: OutgoingMessage = {
    type: 'error',
    message,
  };
  self.postMessage(errorMessage);
};
