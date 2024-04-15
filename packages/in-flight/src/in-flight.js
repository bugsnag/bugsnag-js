const cuid = require('@bugsnag/cuid')
const clone = require('@bugsnag/core/lib/clone-client')

const FLUSH_POLL_INTERVAL_MS = 50
const inFlightRequests = new Map()

const noop = () => {}

// when a client is cloned, make sure to patch the clone's notify method too
// we don't need to patch delivery when a client is cloned because the
// original client's delivery method will be copied over to the clone
clone.registerCallback(patchNotify)

module.exports = {
  trackInFlight (client) {
    patchNotify(client)

    let delivery = client._delivery
    patchDelivery(delivery, client._logger)

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
        console.log(`There are ${inFlightRequests.size} in flight request(s): ${JSON.stringify(Object.fromEntries(inFlightRequests.entries()))}`)

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

// patch a client's _notify method to track in-flight requests
// we patch _notify directly to track requests as early as possible and use the
// "post report" delivery callback to know when a request finishes
function patchNotify (client) {
  const originalNotify = client._notify

  client._notify = function (event, onError, callback = noop) {
    const id = cuid()
    client._logger.info(`[in-flight] tracking new event request ${id}`)
    inFlightRequests.set(id, true)

    const _callback = function () {
      client._logger.info(`[in-flight] event request finished ${id}`)
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
}

// patch a delivery delegate's sendSession method to track in-flight requests
// we do this on the delivery delegate because the client object doesn't
// actually deliver sessions, a session delegate does
// we can't patch the session delegate either because it will deliver sessions
// in a way that makes sense on the platform, e.g. on node sessions are batched
// into 1 request made every x seconds
// therefore the only thing that knows when a session request is started and
// when it finishes is the delivery delegate itself
function patchDelivery (delivery, logger) {
  const originalSendSession = delivery.sendSession

  delivery.sendSession = function (session, callback = noop) {
    const id = cuid()
    logger.info(`[in-flight] tracking new session request ${id}`)
    inFlightRequests.set(id, true)

    const _callback = function () {
      inFlightRequests.delete(id)
      logger.info(`[in-flight] session request finished ${id}`)
      callback.apply(null, arguments)
    }

    originalSendSession.call(delivery, session, _callback)
  }
}
