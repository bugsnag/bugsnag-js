const { reduce, isArray, includes } = require('@bugsnag/core/lib/es-utils')
const { intRange } = require('@bugsnag/core/lib/validators')
const clone = require('@bugsnag/core/lib/clone-client')
const SessionTracker = require('./tracker')
const Backoff = require('backo')

module.exports = {
  init: client => {
    const sessionTracker = new SessionTracker(client._config.sessionSummaryInterval)
    sessionTracker.on('summary', sendSessionSummary(client))
    sessionTracker.start()
    client._sessionDelegate({
      startSession: (client, session) => {
        const sessionClient = clone(client)
        sessionClient._session = session
        sessionClient._pausedSession = null
        sessionTracker.track(sessionClient._session)
        return sessionClient
      },
      pauseSession: (client) => {
        client._pausedSession = client._session
        client._session = null
      },
      resumeSession: (client) => {
        if (client._pausedSession) {
          client._session = client._pausedSession
          client._pausedSession = null
          return client
        } else {
          return client.startSession()
        }
      }
    })
  },
  configSchema: {
    sessionSummaryInterval: {
      defaultValue: () => undefined,
      validate: value => value === undefined || intRange()(value),
      message: 'should be a positive integer'
    }
  }
}

const sendSessionSummary = client => sessionCounts => {
  // exit early if the reports should not be sent on the current releaseStage
  if (isArray(client._config.enabledReleaseStages) && !includes(client._config.enabledReleaseStages, client._config.releaseStage)) {
    client.__logger.warn('Session not sent due to releaseStage/enabledReleaseStages configuration')
    return
  }

  if (!client._config.endpoints.sessions) {
    client.__logger.warn('Session not sent due to missing endpoints.sessions configuration')
    return
  }

  if (!sessionCounts.length) return

  const backoff = new Backoff({ min: 1000, max: 10000 })
  const maxAttempts = 10
  req(handleRes)

  function handleRes (err) {
    if (!err) {
      const sessionCount = sessionCounts.reduce((accum, s) => accum + s.sessionsStarted, 0)
      return client.__logger.debug(`${sessionCount} session(s) reported`)
    }
    if (backoff.attempts === 10) {
      client.__logger.error('Session delivery failed, max retries exceeded', err)
      return
    }
    client.__logger.debug('Session delivery failed, retry #' + (backoff.attempts + 1) + '/' + maxAttempts, err)
    setTimeout(() => req(handleRes), backoff.duration())
  }

  function req (cb) {
    const payload = { notifier: client._notifier, sessionCounts, app: {}, device: {} }
    client._addAppData(payload)
    const cbs = client._cbs.sp.slice(0)
    client.__delivery.sendSession(
      reduce(cbs, (accum, cb) => {
        cb(accum)
        return accum
      }, payload),
      cb
    )
  }
}
