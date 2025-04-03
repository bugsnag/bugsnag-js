const { createHash } = require('crypto')
const jsonPayload = require('@bugsnag/core')
const PayloadQueue = require('./queue')
const PayloadDeliveryLoop = require('./payload-loop')
const NetworkStatus = require('@bugsnag/electron-network-status')

const delivery = (client, filestore, net, app) => {
  const noop = () => {}

  const send = (opts, body, cb) => {
    let errorCallback = (error, response) => {
      // an error can still happen on both the request and response even after a response is received,
      // so we noop on subsequent calls to ensure this is only handled once
      errorCallback = noop

      if (response) {
        error.isRetryable = isRetryable(response.statusCode)
        // do not retry oversized payloads regardless of status code
        if (body.length > 10e5) {
          client._logger.warn(`Discarding over-sized event (${(body.length / 10e5).toFixed(2)} MB) after failed delivery`)
          error.isRetryable = false
        }
      } else {
        error.isRetryable = true
      }

      cb(error)
    }

    const req = net.request(opts, response => {
      // handle errors on the response stream
      response.on('error', err => {
        errorCallback(err, response)
      })

      if (isOk(response)) {
        cb(null)
      } else {
        const err = new Error(`Bad status code from API: ${response.statusCode}`)
        errorCallback(err, response)
      }
    })

    req.on('error', err => errorCallback(err))

    try {
      req.write(body)
    } catch (err) {
      // if we can't write this body to the request, it's likely impossible to
      // ever send it successfully
      err.isRetryable = false

      cb(err)
      return
    }

    req.end()
  }

  const logError = e => client._logger.error('Error delivering payload', e)

  const enqueue = async (payloadKind, failedPayload) => {
    client._logger.info(`Writing ${payloadKind} payload to cache`)
    await queues[payloadKind].enqueue(failedPayload, logError)
  }

  const onerror = async (err, failedPayload, payloadKind, cb) => {
    client._logger.error(`${payloadKind} failed to send…\n`, (err && err.stack) ? err.stack : err)
    if (failedPayload && err.isRetryable !== false) enqueue(payloadKind, failedPayload)
    cb(err)
  }

  const stateManagerPlugin = client.getPlugin('clientStateManager')
  const statusUpdater = new NetworkStatus(stateManagerPlugin, net, app)
  const { queues } = initRedelivery(filestore.getPaths(), statusUpdater, client._logger, send)

  const hash = jsonPayload => {
    const h = createHash('sha1')
    h.update(jsonPayload)
    return h.digest('hex')
  }

  return {
    sendEvent: async (event, cb = () => {}) => {
      const url = client._config.endpoints.notify

      if (url === null) {
        const err = new Error('Event not sent due to incomplete endpoint configuration')
        return cb(err)
      }

      let body, opts
      try {
        body = jsonPayload.event(event, client._config.redactedKeys)
        opts = {
          url,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Bugsnag-Api-Key': event.apiKey || client._config.apiKey,
            'Bugsnag-Integrity': `sha1 ${hash(body)}`,
            'Bugsnag-Payload-Version': '4',
            'Bugsnag-Sent-At': (new Date()).toISOString()
          }
        }

        if (event.attemptImmediateDelivery === false || statusUpdater.isConnected === false) {
          enqueue('event', { opts, body })
          return cb(null)
        }

        const { errorClass, errorMessage } = event.events[0].errors[0]
        client._logger.info(`Sending event ${errorClass}: ${errorMessage}`)

        send(opts, body, err => {
          if (err) return onerror(err, { opts, body }, 'event', cb)
          cb(null)
        })
      } catch (e) {
        onerror(e, { opts, body }, 'event', cb)
      }
    },

    sendSession: async (session, cb = () => {}) => {
      const url = client._config.endpoints.sessions

      if (url === null) {
        const err = new Error('Session not sent due to incomplete endpoint configuration')
        return cb(err)
      }

      let body, opts
      try {
        body = jsonPayload.session(session, client._config.redactedKeys)
        opts = {
          url,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Bugsnag-Api-Key': client._config.apiKey,
            'Bugsnag-Integrity': `sha1 ${hash(body)}`,
            'Bugsnag-Payload-Version': '1',
            'Bugsnag-Sent-At': (new Date()).toISOString()
          }
        }

        if (statusUpdater.isConnected === false) {
          enqueue('session', { opts, body })
          return cb(null)
        }

        client._logger.info('Sending session')

        send(opts, body, err => {
          if (err) return onerror(err, { opts, body }, 'session', cb)
          cb(null)
        })
      } catch (e) {
        onerror(e, { opts, body }, 'session', cb)
      }
    }
  }
}

const initRedelivery = (paths, updater, logger, send) => {
  const onQueueError = e => logger.error('PayloadQueue error', e)
  const queues = {
    event: new PayloadQueue(paths.events, 'event', onQueueError),
    session: new PayloadQueue(paths.sessions, 'session', onQueueError)
  }

  const onLoopError = e => logger.error('PayloadDeliveryLoop error', e)
  const queueConsumers = {
    event: new PayloadDeliveryLoop(send, queues.event, onLoopError),
    session: new PayloadDeliveryLoop(send, queues.session, onLoopError)
  }

  for (const queue in queues) {
    queues[queue].init()
      .then(() => {
        updater.watch((isConnected) => {
          if (isConnected) {
            queueConsumers[queue].start()
          } else {
            queueConsumers[queue].stop()
          }
        })
      })
      .catch(onQueueError)
  }

  return { queues, queueConsumers }
}

// basically, if it starts with a 4, don't retry (unless it's in the list of
// exceptions)
const isRetryable = status => {
  return (
    status < 400 ||
    status > 499 ||
    [
      408, // timeout
      429 // too many requests
    ].includes(status))
}

const isOk = response => [200, 202].includes(response.statusCode)

module.exports = (filestore, net, app) => client => delivery(client, filestore, net, app)
