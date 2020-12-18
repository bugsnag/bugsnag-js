const payload = require('@bugsnag/core/lib/json-payload')
const UndeliveredPayloadQueue = require('./queue')
const NetworkStatus = require('./network-status')
const RedeliveryLoop = require('./redelivery')
const Crypto = require('expo-crypto')

module.exports = (client, fetch = global.fetch) => {
  const networkStatus = new NetworkStatus()

  const send = (url, opts, cb) => {
    fetch(url, opts)
      .then(response => {
        if (response.ok) return response.text()
        const err = new Error(`Bad status code from API: ${response.status}`)
        err.isRetryable = isRetryable(response.status)
        return Promise.reject(err)
      })
      .then(() => cb(null))
      .catch(err => cb(err))
  }

  const logError = e => client._logger.error('Error redelivering payload', e)

  const enqueue = async (payloadKind, failedPayload) => {
    client._logger.info(`Writing ${payloadKind} payload to cache`)
    await queues[payloadKind].enqueue(failedPayload, logError)
    if (networkStatus.isConnected) queueConsumers[payloadKind].start()
  }

  const onerror = async (err, failedPayload, payloadKind, cb) => {
    client._logger.error(`${payloadKind} failed to send…\n${(err && err.stack) ? err.stack : err}`, err)
    if (failedPayload && err.isRetryable !== false) enqueue(payloadKind, failedPayload)
    cb(err)
  }

  const { queues, queueConsumers } = initRedelivery(networkStatus, client._logger, send)

  const hash = payload => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, payload)

  return {
    sendEvent: async (event, cb = () => {}) => {
      const url = client._config.endpoints.notify

      let body, opts
      try {
        body = payload.event(event, client._config.redactedKeys)
        opts = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Bugsnag-Api-Key': event.apiKey || client._config.apiKey,
            'Bugsnag-Integrity': `sha1 ${await hash(body)}`,
            'Bugsnag-Payload-Version': '4',
            'Bugsnag-Sent-At': (new Date()).toISOString()
          },
          body
        }
        if (!networkStatus.isConnected || event.attemptImmediateDelivery === false) {
          enqueue('event', { url, opts })
          return cb(null)
        }
        client._logger.info(`Sending event ${event.events[0].errors[0].errorClass}: ${event.events[0].errors[0].errorMessage}`)
        send(url, opts, err => {
          if (err) return onerror(err, { url, opts }, 'event', cb)
          cb(null)
        })
      } catch (e) {
        onerror(e, { url, opts }, 'event', cb)
      }
    },

    sendSession: async (session, cb = () => {}) => {
      const url = client._config.endpoints.sessions

      let body, opts
      try {
        body = payload.session(session, client._config.redactedKeys)
        opts = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Bugsnag-Api-Key': client._config.apiKey,
            'Bugsnag-Integrity': `sha1 ${await hash(body)}`,
            'Bugsnag-Payload-Version': '1',
            'Bugsnag-Sent-At': (new Date()).toISOString()
          },
          body
        }
        if (!networkStatus.isConnected) {
          enqueue('session', { url, opts })
          return cb(null)
        }
        client._logger.info('Sending session')
        send(url, opts, err => {
          if (err) return onerror(err, { url, opts }, 'session', cb)
          cb(null)
        })
      } catch (e) {
        onerror(e, { url, opts }, 'session', cb)
      }
    }
  }
}

const initRedelivery = (networkStatus, logger, send) => {
  const onQueueError = e => logger.error('UndeliveredPayloadQueue error', e)
  const queues = {
    event: new UndeliveredPayloadQueue('event', onQueueError),
    session: new UndeliveredPayloadQueue('session', onQueueError)
  }

  const onLoopError = e => logger.error('RedeliveryLoop error', e)
  const queueConsumers = {
    event: new RedeliveryLoop(send, queues.event, onLoopError),
    session: new RedeliveryLoop(send, queues.session, onLoopError)
  }

  Promise.all([queues.event.init(), queues.session.init()])
    .then(() => {
      networkStatus.watch(isConnected => {
        if (isConnected) {
          queueConsumers.event.start()
          queueConsumers.session.start()
        } else {
          queueConsumers.event.stop()
          queueConsumers.session.stop()
        }
      })
    })
    .catch(onQueueError)

  return { queues, queueConsumers }
}

// basically, if it starts with a 4, don't retry (unless it's in the list of exceptions)
const isRetryable = status => {
  return (
    status < 400 ||
    status > 499 ||
    [
      408, // timeout
      429 // too many requests
    ].includes(status))
}
