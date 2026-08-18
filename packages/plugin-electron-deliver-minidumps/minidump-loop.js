const { readFile } = require('fs').promises
const runSyncCallbacks = require('@bugsnag/core/lib/sync-callback-runner')
const { serialiseEvent, deserialiseEvent } = require('./event-serialisation')

// Backoff configuration
const BACKOFF_BASE_MS = 1000 // 1 second initial delay
const BACKOFF_MAX_MS = 60000 // 60 second cap
const BACKOFF_FACTOR = 2 // doubles each failure

/**
 * Exponential backoff with full jitter.
 * Returns a random value in [0, min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * BACKOFF_FACTOR^failureCount)]
 */
const calculateBackoff = (failureCount) => {
  const exponential = BACKOFF_BASE_MS * Math.pow(BACKOFF_FACTOR, failureCount)
  const capped = Math.min(exponential, BACKOFF_MAX_MS)
  return Math.floor(Math.random() * capped)
}

module.exports = class MinidumpDeliveryLoop {
  constructor (sendMinidump, onSendError, minidumpQueue, logger) {
    this._sendMinidump = sendMinidump
    this._minidumpQueue = minidumpQueue
    this._logger = logger
    this._running = false
    this._failureCount = 0
    this._nextDelay = 0

    // onSendError can be a function or an array of functions
    this._onSendError = typeof onSendError === 'function'
      ? [onSendError]
      : onSendError
  }

  _onerror (err, minidump) {
    this._logger.error('minidump failed to send…\n', (err && err.stack) ? err.stack : err)

    if (err.isRetryable === false) {
      // Non-retryable (e.g. 400 Bad Request) — discard and move on immediately
      this._minidumpQueue.remove(minidump)
      this._failureCount = 0
      this._nextDelay = 0
    } else {
      // Retryable (network error, 5xx, etc.) — back off before retrying
      this._failureCount++
      this._nextDelay = calculateBackoff(this._failureCount)
      this._logger.info(`Minidump delivery failed (attempt ${this._failureCount}), retrying in ${this._nextDelay}ms`)
    }
  }

  async _readEvent (eventPath) {
    // try to read the event associated with a minidump, or create an empty event if one doesn't exist
    if (eventPath) {
      try {
        return JSON.parse(await readFile(eventPath, 'utf8'))
      } catch (e) {
        // swallow error - the minidump will be delivered without error info
      }
    }

    return null
  }

  async _deliverMinidump (minidump) {
    let shouldSendMinidump = true
    let eventJson = await this._readEvent(minidump.eventPath)

    if (eventJson && this._onSendError.length > 0) {
      const event = deserialiseEvent(eventJson, minidump.minidumpPath)
      const ignore = runSyncCallbacks(this._onSendError, event, 'onSendError', this._logger)

      // i.e. we SHOULD send the minidump if we SHOULD NOT ignore the event
      shouldSendMinidump = !ignore

      // reserialise the event for sending in the form payload
      eventJson = serialiseEvent(event)
    }

    if (shouldSendMinidump) {
      try {
        await this._sendMinidump(minidump.minidumpPath, eventJson)

        // Successful delivery — remove from queue and reset failure state
        this._minidumpQueue.remove(minidump)
        this._failureCount = 0
        this._nextDelay = 0
      } catch (e) {
        // _onerror sets this._nextDelay appropriately
        // 0 for non-retryable, backoff for retryable
        this._onerror(e, minidump)
      }
    } else {
      this._minidumpQueue.remove(minidump)
      this._failureCount = 0
      this._nextDelay = 0
    }

    // Schedule next attempt using the delay set above.
    // On success or non-retryable: _nextDelay=0 (immediate).
    // On retryable failure: _nextDelay=backoff (throttled).
    this._scheduleSelf(this._nextDelay)
  }

  async _deliverNextMinidump () {
    if (!this._running) {
      return
    }

    const nextMinidump = await this._minidumpQueue.peek()
    if (nextMinidump) {
      await this._deliverMinidump(nextMinidump)
    } else {
      this.stop()
    }
  }

  _scheduleSelf (delay = 0) {
    if (!this._running) {
      return
    }

    this._timerId = setTimeout(() => this._deliverNextMinidump(), delay)
  }

  start () {
    if (this._running) {
      return
    }

    this._running = true
    this._failureCount = 0
    this._nextDelay = 0
    this._scheduleSelf()
  }

  stop () {
    this._running = false
    clearTimeout(this._timerId)
  }

  watchNetworkStatus (statusUpdater) {
    statusUpdater.watch(connected => {
      if (connected) this.start()
      else this.stop()
    })
  }
}

// Export for unit testing
module.exports.calculateBackoff = calculateBackoff
module.exports.BACKOFF_BASE_MS = BACKOFF_BASE_MS
module.exports.BACKOFF_MAX_MS = BACKOFF_MAX_MS
module.exports.BACKOFF_FACTOR = BACKOFF_FACTOR