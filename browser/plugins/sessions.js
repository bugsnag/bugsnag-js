const { map, isArray, includes } = require('../../base/lib/es-utils')
const inferReleaseStage = require('../../base/lib/infer-release-stage')

module.exports = {
  init: client => client.sessionDelegate(sessionDelegate)
}

const sessionDelegate = {
  startSession: client => {
    const sessionClient = client
    sessionClient.session = new client.BugsnagSession()

    map(sessionClient.beforeSession, (fn) => fn(sessionClient))

    const releaseStage = inferReleaseStage(sessionClient)

    // exit early if the reports should not be sent on the current releaseStage
    if (isArray(sessionClient.config.notifyReleaseStages) && !includes(sessionClient.config.notifyReleaseStages, releaseStage)) {
      sessionClient._logger.warn(`Session not sent due to releaseStage/notifyReleaseStages configuration`)
      return sessionClient
    }

    sessionClient._transport.sendSession(
      sessionClient._logger,
      sessionClient.config,
      {
        notifier: sessionClient.notifier,
        device: sessionClient.device,
        app: { ...{ releaseStage }, ...sessionClient.app },
        sessions: [
          {
            id: sessionClient.session.id,
            startedAt: sessionClient.session.startedAt,
            user: sessionClient.user
          }
        ]
      }
    )

    return sessionClient
  }
}
