const { isArray, includes } = require('@bugsnag/core/lib/es-utils')
const inferReleaseStage = require('@bugsnag/core/lib/infer-release-stage')

module.exports = {
  init: client => client.sessionDelegate(sessionDelegate)
}

const sessionDelegate = {
  startSession: client => {
    const sessionClient = client
    sessionClient._session = new client.BugsnagSession()

    const releaseStage = inferReleaseStage(sessionClient)

    // exit early if the reports should not be sent on the current releaseStage
    if (isArray(sessionClient.config.notifyReleaseStages) && !includes(sessionClient.config.notifyReleaseStages, releaseStage)) {
      sessionClient._logger.warn(`Session not sent due to releaseStage/notifyReleaseStages configuration`)
      return sessionClient
    }

    if (!sessionClient.config.endpoints.sessions) {
      sessionClient._logger.warn(`Session not sent due to missing endpoints.sessions configuration`)
      return sessionClient
    }

    sessionClient._delivery.sendSession({
      notifier: sessionClient.notifier,
      device: sessionClient.device,
      app: { ...{ releaseStage }, ...sessionClient.app },
      sessions: [
        {
          id: sessionClient._session.id,
          startedAt: sessionClient._session.startedAt,
          user: sessionClient.user
        }
      ]
    })

    return sessionClient
  }
}
