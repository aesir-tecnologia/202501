/**
 * Timer Web Worker
 *
 * Handles accurate timing independent of main thread throttling
 * Provides automatic 5-minute warnings and completion notifications
 */

let interval = null
let startTime = null
let pausedTime = 0
let targetDuration = null // in seconds

/**
 * Message handler for worker communication
 */
self.addEventListener('message', (e) => {
  const { type, pausedElapsed, duration } = e.data

  switch (type) {
    case 'start':
      handleStart(pausedElapsed, duration)
      break

    case 'stop':
      handleStop()
      break

    case 'pause':
      handlePause()
      break

    default:
      self.postMessage({
        type: 'error',
        message: `Unknown message type: ${type}`,
      })
  }
})

/**
 * Start timer with optional paused time and target duration
 */
function handleStart(pausedElapsed = 0, duration = null) {
  if (interval) {
    clearInterval(interval)
  }

  startTime = Date.now()
  pausedTime = pausedElapsed || 0
  targetDuration = duration

  // Send initial tick immediately
  const initialElapsed = pausedTime
  self.postMessage({
    type: 'tick',
    elapsed: initialElapsed,
  })

  // Start interval
  interval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000) + pausedTime

    // Send regular tick update
    self.postMessage({
      type: 'tick',
      elapsed,
    })

    // Check for 5-minute warning (if target duration is set)
    if (targetDuration && elapsed === targetDuration - 300) {
      self.postMessage({
        type: 'warning',
        elapsed,
        remaining: 300, // 5 minutes in seconds
      })
    }

    // Check for completion
    if (targetDuration && elapsed >= targetDuration) {
      self.postMessage({
        type: 'complete',
        elapsed,
      })
      handleStop()
    }
  }, 1000)

  self.postMessage({
    type: 'started',
    elapsed: pausedTime,
  })
}

/**
 * Stop timer completely
 */
function handleStop() {
  if (interval) {
    clearInterval(interval)
    interval = null
  }

  startTime = null
  pausedTime = 0
  targetDuration = null

  self.postMessage({
    type: 'stopped',
  })
}

/**
 * Pause timer (keeps elapsed time)
 */
function handlePause() {
  if (interval) {
    clearInterval(interval)
    interval = null
  }

  // Calculate final elapsed time before pausing
  if (startTime) {
    pausedTime = Math.floor((Date.now() - startTime) / 1000) + pausedTime
  }

  self.postMessage({
    type: 'paused',
    elapsed: pausedTime,
  })
}
