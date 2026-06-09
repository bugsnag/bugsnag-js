import { App, Client, Config, Device, Notifier, Plugin, Session, intRange, runSyncCallbacks } from '@bugsnag/core'
import SessionTracker from './tracker'
import Backoff from 'backo'
import { MAX_ATTEMPTS } from './constants'

interface PluginConfig extends Config {
  sessionSummaryInterval?: number
}

interface SessionCount {
  startedAt: string
  sessionsStarted: number
}

interface SessionSummaryPayload {
  notifier?: Notifier
  device: Device
  app: App
  sessionCounts: SessionCount[]
}

const plugin: Plugin<PluginConfig> = {
  load: (client: Client<PluginConfig>): void => {
    const sessionTracker = new SessionTracker(client._config.sessionSummaryInterval)
    sessionTracker.on('summary', sendSessionSummary(client))
    sessionTracker.start()

    client._sessionDelegate = {
      startSession: (sessionClient, session) => {
        sessionClient._session = session
        sessionClient._pausedSession = null
        sessionTracker.track(sessionClient._session)
        return sessionClient
      },

      pauseSession: (sessionClient) => {
        sessionClient._pausedSession = sessionClient._session
        sessionClient._session = null
      },

      resumeSession: (sessionClient) => {
        if (sessionClient._session) return sessionClient

        if (sessionClient._pausedSession) {
          sessionClient._session = sessionClient._pausedSession
          sessionClient._pausedSession = null
          return sessionClient
        }

        const newClient = sessionClient.startSession()
        return newClient || sessionClient
      }
    }
  },

  configSchema: {
    sessionSummaryInterval: {
      defaultValue: () => undefined,
      validate: value => value === undefined || intRange()(value),
      message: 'should be a positive integer'
    }
  }
}

const sendSessionSummary = (client: Client) => (sessionCounts: SessionCount[]): void => {
  if (
    client._config.enabledReleaseStages !== null &&
    !client._config.enabledReleaseStages.includes(client._config.releaseStage)
  ) {
    client._logger.warn('Session not sent due to releaseStage/enabledReleaseStages configuration')
    return
  }

  if (!sessionCounts.length) return

  const backoff = new Backoff({ min: 1000, max: 10000 })
  req(handleRes)

  function handleRes (err?: Error | null): void {
    if (!err) {
      const sessionCount = sessionCounts.reduce((accum, s) => accum + s.sessionsStarted, 0)
      client._logger.debug(String(sessionCount) + ' session(s) reported')
      return
    }

    if (backoff.attempts === MAX_ATTEMPTS) {
      client._logger.error('Session delivery failed, max retries exceeded', err)
      return
    }

    client._logger.error(
      'Session delivery failed, retry #' + String(backoff.attempts + 1) + '/' + String(MAX_ATTEMPTS),
      err
    )

    setTimeout(() => req(handleRes), backoff.duration())
  }

  function req (cb: (err?: Error | null) => void): void {
    const payload: SessionSummaryPayload = {
      notifier: client._notifier,
      device: {},
      app: {
        releaseStage: client._config.releaseStage,
        version: client._config.appVersion,
        type: client._config.appType
      },
      sessionCounts
    }

    const ignore = runSyncCallbacks(
      client._cbs.sp,
      payload as unknown as Session,
      'onSessionPayload',
      client._logger
    )

    if (ignore) {
      client._logger.debug('Session not sent due to onSessionPayload callback')
      cb(null)
      return
    }

    client._delivery.sendSession(payload, cb)
  }
}

export default plugin