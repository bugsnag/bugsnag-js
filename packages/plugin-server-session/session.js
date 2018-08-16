const { isArray, includes } = require('@bugsnag/core/lib/es-utils')
const inferReleaseStage = require('@bugsnag/core/lib/infer-release-stage')
const { intRange } = require('@bugsnag/core/lib/validators')
const SessionTracker = require('./tracker')
const Backoff = require('backo')

module.exports = {
  init: client => {
    const sessionTracker = new SessionTracker(client.config.sessionSummaryInterval)
    sessionTracker.on('summary', sendSessionSummary(client))
    sessionTracker.start()

    client.sessionDelegate({
      startSession: client => {
        const sessionClient = new client.BugsnagClient(client.notifier)
        sessionClient.configure({})
        sessionClient.config = client.config
        sessionClient.breadcrumbs = client.breadcrumbs
        sessionClient.app = client.app
        sessionClient.context = client.context
        sessionClient.device = client.device
        sessionClient.metaData = client.metaData
        sessionClient.request = client.request
        sessionClient.user = client.user
        sessionClient.logger(client._logger)
        sessionClient.delivery(client._delivery)
        sessionClient._session = new client.BugsnagSession()
        sessionTracker.track(sessionClient._session)
        return sessionClient
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
  const releaseStage = inferReleaseStage(client)

  // exit early if the reports should not be sent on the current releaseStage
  if (isArray(client.config.notifyReleaseStages) && !includes(client.config.notifyReleaseStages, releaseStage)) {
    client._logger.warn(`Session not sent due to releaseStage/notifyReleaseStages configuration`)
    return
  }

  if (!client.config.endpoints.sessions) {
    client._logger.warn(`Session not sent due to missing endpoints.sessions configuration`)
    return
  }

  if (!sessionCounts.length) return

  const backoff = new Backoff({ min: 1000, max: 10000 })
  const maxAttempts = 10
  req(handleRes)

  function handleRes (err) {
    if (!err) return client._logger.info('Session delivered')
    if (backoff.attempts === 10) {
      client._logger.error('Session delivery failed, max retries exceeded', err)
      return
    }
    client._logger.info('Session delivery failed, retry #' + (backoff.attempts + 1) + '/' + maxAttempts, err)
    setTimeout(() => req(handleRes), backoff.duration())
  }

  function req (cb) {
    client._delivery.sendSession(
      client._logger,
      client.config,
      {
        notifier: client.notifier,
        device: client.device,
        app: { ...{ releaseStage }, ...client.app },
        sessionCounts
      },
      cb
    )
  }
}
