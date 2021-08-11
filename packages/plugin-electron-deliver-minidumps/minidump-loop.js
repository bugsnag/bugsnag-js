const { readFile } = require('fs').promises

const trackEvent = (client, event) => {
  if (client._session) {
    client._session._track(event || { _handledState: { unhandled: true } })
  }
}

module.exports = class MinidumpDeliveryLoop {
  constructor (client, sendMinidump, onSend = () => true, minidumpQueue) {
    this._client = client
    this._sendMinidump = sendMinidump
    this._onSend = onSend
    this._minidumpQueue = minidumpQueue
    this._running = false
  }

  _onerror (err, minidump) {
    this._client._logger.error('minidump failed to send…\n', (err && err.stack) ? err.stack : err)

    if (err.isRetryable === false) {
      this._minidumpQueue.remove(minidump)
    }
  }

  _updateEventSession (event) {
    if (event) {
      // take a copy of the session to avoid side-effects on the global session
      const eventSession = event.session || { events: { handled: 0, unhandled: 0 } }

      // if the event isn't marked "handled" - it's unhandled
      const property = (event.unhandled === false) ? 'handled' : 'unhandled'
      eventSession.events[property] = (eventSession.events[property] || 0) + 1

      event.session = eventSession
    }

    return event
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
    const event = this._updateEventSession(await this._readEvent(minidump.eventPath))
    const shouldSendMinidump = event && await this._onSend(event)

    if (shouldSendMinidump === false) {
      // we track the events whether we deliver them or not
      trackEvent(this._client, event)
      this._minidumpQueue.remove(minidump)
      this._scheduleSelf()
    } else {
      try {
        await this._sendMinidump(minidump.minidumpPath, event)

        // if we had a successful delivery - remove the minidump from the queue, and schedule the next
        this._minidumpQueue.remove(minidump)
        trackEvent(this._client, event)
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
