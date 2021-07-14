const { readFile } = require('fs').promises

module.exports = class MinidumpDeliveryLoop {
  constructor (sendMinidump, onSend = () => true, minidumpQueue, logger) {
    this._sendMinidump = sendMinidump
    this._onSend = onSend
    this._minidumpQueue = minidumpQueue
    this._logger = logger
    this._running = false
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
    const event = await this._readEvent(minidump.eventPath)
    const shouldSendMinidump = event && await this._onSend(event)

    if (shouldSendMinidump === false) {
      this._minidumpQueue.remove(minidump)
      this._scheduleSelf()
    } else {
      try {
        await this._sendMinidump(minidump.minidumpPath, event)

        // if we had a successful delivery - remove the minidump from the queue, and schedule the next
        this._minidumpQueue.remove(minidump)
      } catch (e) {
        this._onerror(e, minidump)
      } finally {
        this._scheduleSelf()
      }
    }
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
