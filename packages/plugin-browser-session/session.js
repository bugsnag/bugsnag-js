const { includes } = require('@bugsnag/core/lib/es-utils')

module.exports = {
  init: client => { client._sessionDelegate = sessionDelegate }
}

const sessionDelegate = {
  startSession: (client, session) => {
    const sessionClient = client
    sessionClient._session = session
    sessionClient._pausedSession = null

    // exit early if the current releaseStage is not enabled
    if (sessionClient._config.enabledReleaseStages !== null && !includes(sessionClient._config.enabledReleaseStages, sessionClient._config.releaseStage)) {
      sessionClient._logger.warn('Session not sent due to releaseStage/enabledReleaseStages configuration')
      return sessionClient
    }

    sessionClient._delivery.sendSession({
      notifier: sessionClient._notifier,
      device: session.device,
      app: session.app,
      sessions: [
        {
          id: sessionClient._session.id,
          startedAt: sessionClient._session.startedAt,
          user: sessionClient._user
        }
      ]
    })
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
