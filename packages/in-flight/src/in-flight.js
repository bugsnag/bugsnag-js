const cuid = require('@bugsnag/cuid')

const FLUSH_POLL_INTERVAL_MS = 50
const inFlightRequests = new Map()

const noop = () => {}

module.exports = {
  trackInFlight (client) {
    const originalNotify = client._notify

    client._notify = function (event, onError, callback = noop) {
      const id = cuid()
      inFlightRequests.set(id, true)

      const _callback = function () {
        inFlightRequests.delete(id)
        callback.apply(null, arguments)
      }

      client._depth += 1

      try {
        originalNotify.call(client, event, onError, _callback)
      } finally {
        client._depth -= 1
      }
    }

    const delivery = client._delivery
    const originalSendSession = delivery.sendSession

    delivery.sendSession = function (session, callback = noop) {
      const id = cuid()
      inFlightRequests.set(id, true)

      const _callback = function () {
        inFlightRequests.delete(id)
        callback.apply(null, arguments)
      }

      originalSendSession.call(delivery, session, _callback)
    }
  },

  flush (timeoutMs) {
    return new Promise(function (resolve, reject) {
      let resolveTimeout
      const rejectTimeout = setTimeout(
        () => {
          if (resolveTimeout) clearTimeout(resolveTimeout)

          reject(new Error(`flush timed out after ${timeoutMs}ms`))
        },
        timeoutMs
      )

      const resolveIfNoRequests = function () {
        if (inFlightRequests.size === 0) {
          clearTimeout(rejectTimeout)
          resolve()

          return
        }

        resolveTimeout = setTimeout(resolveIfNoRequests, FLUSH_POLL_INTERVAL_MS)
      }

      resolveIfNoRequests()
    })
  }
}
