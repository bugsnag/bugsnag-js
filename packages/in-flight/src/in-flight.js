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

    const patchDelivery = (delivery) => {
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
    }

    let delivery = client._delivery
    patchDelivery(delivery)

    // ensure we also monkey-patch any new delivery that might be set
    Object.defineProperty(client, '_delivery', {
      get () {
        return delivery
      },
      set (newDeliviery) {
        patchDelivery(newDeliviery)
        delivery = newDeliviery
      }
    })
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
