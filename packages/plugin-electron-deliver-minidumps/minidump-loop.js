const { readFile } = require('fs').promises
const runSyncCallbacks = require('@bugsnag/core/lib/sync-callback-runner')
const { serialiseEvent, deserialiseEvent } = require('./event-serialisation')

module.exports = class MinidumpDeliveryLoop {
  constructor (sendMinidump, onSendError, minidumpQueue, logger) {
    this._sendMinidump = sendMinidump
    this._minidumpQueue = minidumpQueue
    this._logger = logger
    this._running = false

    // onSendError can be a function or an array of functions
    this._onSendError = typeof onSendError === 'function'
      ? [onSendError]
      : onSendError
  }

  _onerror (err, minidump) {
    this._logger.error('minidump failed to send…\n', (err && err.stack) ? err.stack : err)

    if (err.isRetryable === false) {
      this._minidumpQueue.remove(minidump)
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

        // if we had a successful delivery - remove the minidump from the queue
        this._minidumpQueue.remove(minidump)
      } catch (e) {
        this._onerror(e, minidump)
      }
    } else {
      this._minidumpQueue.remove(minidump)
    }

    this._scheduleSelf()
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
