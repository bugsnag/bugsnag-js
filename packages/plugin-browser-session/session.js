const includes = require('@bugsnag/core/lib/es-utils/includes')

module.exports = {
  load: client => { client._sessionDelegate = sessionDelegate }
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
          id: session.id,
          startedAt: session.startedAt,
          user: session._user
        }
      ]
    })
    return sessionClient
  },
  resumeSession: (client) => {
    // Do nothing if there's already an active session
    if (client._session) {
      return client
    }

    // If we have a paused session then make it the active session
    if (client._pausedSession) {
      client._session = client._pausedSession
      client._pausedSession = null

      return client
    }

    // Otherwise start a new session
    return client.startSession()
  },
  pauseSession: (client) => {
    client._pausedSession = client._session
    client._session = null
  }
}
