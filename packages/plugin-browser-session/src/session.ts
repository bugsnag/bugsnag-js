import { Client, Logger, Plugin, Session } from '@bugsnag/core'
import includes from '@bugsnag/core/lib/es-utils/includes'

interface SessionDelegate {
  startSession: (client: InternalClient, session: Session) => InternalClient
  resumeSession: (client: { _session: any, _pausedSession: null, startSession: () => any}) => any
  pauseSession: (client: { _pausedSession: any, _session: null }) => void
}

interface InternalClient extends Client {
  _config: {
    enabledReleaseStages: string[] | null
    releaseStage: string
    releaseStages: string[]
  }
  _delivery: any
  _logger: Logger
  _notifier: any
  _session: Session
  _sessionDelegate: SessionDelegate
  _pausedSession: any
}

const plugin: Plugin = {
  load: client => {
    const internalClient = client as InternalClient
    internalClient._sessionDelegate = sessionDelegate
  }
}

const sessionDelegate = {
  startSession: (client: InternalClient, session: Session) => {
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
  resumeSession: (client: { _session: any, _pausedSession: null, startSession: () => any }) => {
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
  pauseSession: (client: { _pausedSession: any, _session: null }) => {
    client._pausedSession = client._session
    client._session = null
  }
}

export default plugin
