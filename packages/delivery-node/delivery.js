const payload = require('@bugsnag/core/lib/json-payload')
const request = require('./request')

const reasons = {
  ERR_DELIVERY_CAPACITY: 'capacity',
  ERR_DELIVERY_TIMEOUT: 'timeout',
  ERR_DELIVERY_REQUEST_SIZE: 'request_size',
  ERR_JSON_SIZE: 'request_size',
  ERR_DELIVERY_RESPONSE_SIZE: 'response_size',
  ERR_DELIVERY_CLOSED: 'closed',
  ERR_DELIVERY_HTTP: 'http',
  ERR_DELIVERY_SERIALIZER: 'configuration'
}

module.exports = client => {
  const options = client._config.deliveryOptions || {}
  let inFlight = 0
  let observing = false

  const observe = result => {
    if (observing || typeof client._config.onDelivery !== 'function') return
    observing = true
    try {
      client._config.onDelivery(result)
    } catch (_) {
      // Delivery diagnostics must not interfere with completion or report themselves.
    } finally {
      observing = false
    }
  }

  const send = (kind, data, cb = () => {}) => {
    let reserved = false
    let completed = false
    let requestStarted = false
    let bodyLength = 0
    const label = kind === 'event' ? 'Event' : 'Session'

    const release = () => {
      if (!reserved) return
      reserved = false
      inFlight--
    }

    const finish = (err, reason) => {
      if (completed) return
      completed = true
      if (!requestStarted) release()
      const outcome = reason || (err && reasons[err.code]) || (err ? 'transport' : 'success')
      const rejected = outcome === 'capacity' || outcome === 'request_size' || outcome === 'configuration' || outcome === 'serialization' || outcome === 'observer'
      let status = 'success'
      if (err) status = rejected ? 'rejected' : 'failed'
      observe({ kind, status, reason: outcome })

      if (!client._config.onDelivery) {
        try {
          if (err && outcome !== 'capacity' && outcome !== 'request_size') client._logger.error(`${label} failed to send…\n${err.stack || err}`, err)
          if (kind === 'event' && bodyLength > 10e5) client._logger.warn(`Event oversized (${(bodyLength / 10e5).toFixed(2)} MB)`)
        } catch (_) {
          // A custom logger must not prevent fatal handlers from completing.
        }
      }
      cb(err)
    }

    if (observing) {
      return finish(Object.assign(new Error('Delivery cannot be started inside onDelivery'), { code: 'ERR_DELIVERY_OBSERVER' }), 'observer')
    }

    if (options.maxInFlight !== undefined && inFlight >= options.maxInFlight) {
      return finish(Object.assign(new Error('Delivery rejected at maxInFlight'), { code: 'ERR_DELIVERY_CAPACITY' }))
    }

    inFlight++
    reserved = true
    const startedAt = process.hrtime()
    const endpoint = kind === 'event' ? client._config.endpoints.notify : client._config.endpoints.sessions
    if (endpoint === null) return finish(new Error(`${label} not sent due to incomplete endpoint configuration`), 'configuration')

    let body
    let apiKey
    try {
      body = payload[kind](data, client._config.redactedKeys, options.maxRequestBytes)
      bodyLength = body.length
      apiKey = kind === 'event' ? data.apiKey || client._config.apiKey : client._config.apiKey
    } catch (err) {
      return finish(err || new Error('Payload serialization failed'), reasons[err && err.code] || 'serialization')
    }
    let timeoutMs = options.timeoutMs
    if (timeoutMs !== undefined) {
      const elapsed = process.hrtime(startedAt)
      timeoutMs -= elapsed[0] * 1000 + elapsed[1] / 1e6
      if (timeoutMs <= 0) return finish(Object.assign(new Error('Delivery exceeded timeoutMs'), { code: 'ERR_DELIVERY_TIMEOUT' }))
    }
    requestStarted = true
    request({
      url: endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Bugsnag-Api-Key': apiKey,
        'Bugsnag-Payload-Version': kind === 'event' ? '4' : '1',
        'Bugsnag-Sent-At': (new Date()).toISOString()
      },
      body,
      agent: client._config.agent,
      timeoutMs,
      maxRequestBytes: options.maxRequestBytes,
      maxResponseBytes: options.maxResponseBytes
    }, err => finish(err), release)
  }

  return {
    sendEvent: (event, cb) => send('event', event, cb),
    sendSession: (session, cb) => send('session', session, cb)
  }
}
