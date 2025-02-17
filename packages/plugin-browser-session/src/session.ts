import { Client, Plugin, Session, SessionDelegate } from '@bugsnag/core'
import includes from '@bugsnag/core/lib/es-utils/includes'

const plugin: Plugin = {
  load: client => {
    client._sessionDelegate = sessionDelegate
  }
}

const sessionDelegate: SessionDelegate = {
  startSession: (client: Client, session: Session) => {
    const sessionClient = client
    sessionClient._session = session
    sessionClient._pausedSession = null

    // exit early if the current releaseStage is not enabled
    if (sessionClient._config.enabledReleaseStages && !includes(sessionClient._config.enabledReleaseStages, sessionClient._config.releaseStage)) {
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
          user: session.getUser()
        }
      ]
    }, () => {})
    return sessionClient
  },
  resumeSession: (client: Client) => {
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return client.startSession()!
  },
  pauseSession: (client: Client) => {
    client._pausedSession = client._session
    client._session = null
  }
}

export default plugin
