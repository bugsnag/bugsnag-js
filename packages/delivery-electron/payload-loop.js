const RETRY_INTERVAL_MS = 30 * 1000

/*
 * This class consumes from a queue of undelivered payloads and attempts to
 * re-send them. If delivery succeeds, the item is removed from the queue.
 */
module.exports = class RedeliveryLoop {
  constructor (
    send,
    queue,
    onerror = () => {},
    retryInterval = RETRY_INTERVAL_MS
  ) {
    this._send = send
    this._queue = queue
    this._onerror = onerror
    this._retryInterval = retryInterval

    this._timer = null
    this._stopped = true
    this._redeliver = this._redeliver.bind(this)
  }

  stop () {
    this._stopped = true
    clearTimeout(this._timer)
  }

  start () {
    // no-op if we're already running
    if (!this._stopped) return
    this._stopped = false
    this._schedule(0)
  }

  _schedule (t) {
    if (this._stopped) return
    this._timer = setTimeout(this._redeliver, t)
  }

  async _redeliver () {
    try {
      // pop a failed request off of the queue
      const res = await this._queue.peek()

      // if there isn't anything on the queue, stop the loop
      if (!res) {
        this.stop()
        return
      }

      const { path, payload } = res

      // if there is, attempt to deliver it
      this._send(payload.opts, payload.body, async (err) => {
        try {
          if (err) {
            this._onerror(err)

            if (err.isRetryable === false) {
              await this._queue.remove(path)
              return this._schedule(0)
            }

            // this request failed so wait a while before retrying
            return this._schedule(this._retryInterval)
          }

          // this request succeeded, grab another immediately after we delete this one
          await this._queue.remove(path)
          this._schedule(0)
        } catch (e) {
          this._onerror(e)
          this._schedule(0)
        }
      })
    } catch (e) {
      this._onerror(e)
    }
  }
}
