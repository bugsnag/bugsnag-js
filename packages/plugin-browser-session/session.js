const { includes } = require('@bugsnag/core/lib/es-utils')
const inferReleaseStage = require('@bugsnag/core/lib/infer-release-stage')
const runSyncCallbacks = require('@bugsnag/core/lib/sync-callback-runner')

module.exports = {
  init: client => { client._sessionDelegate = sessionDelegate }
}

const sessionDelegate = {
  startSession: (client, session) => {
    const sessionClient = client
    sessionClient._session = session
    sessionClient._pausedSession = null

    const releaseStage = inferReleaseStage(sessionClient)

    // exit early if the current releaseStage is not enabled
    if (sessionClient._config.enabledReleaseStages.length > 0 && !includes(sessionClient._config.enabledReleaseStages, releaseStage)) {
      sessionClient._logger.warn('Session not sent due to releaseStage/enabledReleaseStages configuration')
      return sessionClient
    }

    const payload = {
      notifier: sessionClient._notifier,
      device: {},
      app: { ...{ releaseStage }, ...sessionClient.app },
      sessions: [
        {
          id: sessionClient._session.id,
          startedAt: sessionClient._session.startedAt,
          user: sessionClient._user
        }
      ]
    }

    const ignore = runSyncCallbacks(sessionClient._cbs.sp.slice(0), payload, 'onSessionPayload', sessionClient._logger)
    if (ignore) {
      sessionClient._logger.debug('Session not sent due to onSessionPayload callback')
      return sessionClient
    }

    sessionClient._delivery.sendSession(payload)
    return sessionClient
  },
  resumeSession: (client) => {
    if (client._pausedSession) {
      client._session = client._pausedSession
      client._pausedSession = null
      return client
    } else {
      return client.startSession()
    }
  },
  pauseSession: (client) => {
    client._pausedSession = client._session
    client._session = null
  }
}
