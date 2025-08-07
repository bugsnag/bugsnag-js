import { Plugin, Client, Config, intRange, runSyncCallbacks } from '@bugsnag/core'
import SessionTracker from './tracker'
import Backoff from 'backo'

interface PluginConfig extends Config {
  sessionSummaryInterval?: number
}

const plugin: Plugin<PluginConfig> = {
  load: (client) => {
    const sessionTracker = new SessionTracker(client._config.sessionSummaryInterval ?? undefined)
    sessionTracker.on('summary', sendSessionSummary(client))
    sessionTracker.start()
    client._sessionDelegate = {
      startSession: (client, session) => {
        client._session = session
        client._pausedSession = null
        sessionTracker.track(client._session)
        return client
      },
      pauseSession: (client) => {
        client._pausedSession = client._session
        client._session = null
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

        // Otherwise start a new session and ensure a Client is always returned
        const newClient = client.startSession()
        return newClient || client
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

interface SessionCount {
  startedAt: string
  sessionsStarted: number
}

interface SessionPayload {
  notifier: any
  device: Record<string, unknown>
  app: {
    releaseStage: string
    version: string
    type: string
  }
  sessionCounts: SessionCount[]
}

const sendSessionSummary = (client: Client) => (sessionCounts: SessionCount[]): void => {
  // exit early if the current releaseStage is not enabled
  if (client._config.enabledReleaseStages !== null && !client._config.enabledReleaseStages.includes(client._config.releaseStage)) {
    client._logger.warn('Session not sent due to releaseStage/enabledReleaseStages configuration')
    return
  }

  if (!sessionCounts.length) return

  const backoff = new Backoff({ min: 1000, max: 10000 })
  const maxAttempts = 10
  req(handleRes)

  function handleRes (err?: Error | null): void {
    if (!err) {
      const sessionCount = sessionCounts.reduce((accum, s) => accum + s.sessionsStarted, 0)
      return client._logger.debug(`${sessionCount} session(s) reported`)
    }
    if (backoff.attempts === 10) {
      client._logger.error('Session delivery failed, max retries exceeded', err)
      return
    }
    client._logger.debug('Session delivery failed, retry #' + (backoff.attempts + 1) + '/' + maxAttempts + (err ? ': ' + err.toString() : ''))
    setTimeout(() => req(handleRes), backoff.duration())
  }

  function req (cb: (err?: Error | null) => void) {
    const payload = {
      notifier: client._notifier,
      device: {},
      app: {
        releaseStage: client._config.releaseStage,
        version: client._config.appVersion,
        type: client._config.appType
      },
      sessionCounts
    }

    const ignore = runSyncCallbacks(client._cbs.sp, payload as any, 'onSessionPayload', client._logger)
    if (ignore) {
      client._logger.debug('Session not sent due to onSessionPayload callback')
      return cb(null)
    }

    client._delivery.sendSession(payload, cb)
  }
}

export default plugin