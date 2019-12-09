const { includes } = require('@bugsnag/core/lib/es-utils')
const inferReleaseStage = require('@bugsnag/core/lib/infer-release-stage')

module.exports = {
  init: client => { client._sessionDelegate = sessionDelegate }
}

const sessionDelegate = {
  startSession: (client, session) => {
    const sessionClient = client
    sessionClient._session = session

    const releaseStage = inferReleaseStage(sessionClient)

    // exit early if the current releaseStage is not enabled
    if (sessionClient._config.enabledReleaseStages.length > 0 && !includes(sessionClient._config.enabledReleaseStages, releaseStage)) {
      sessionClient._logger.warn('Session not sent due to releaseStage/enabledReleaseStages configuration')
      return sessionClient
    }

    sessionClient._delivery.sendSession({
      notifier: sessionClient._notifier,
      device: sessionClient.device,
      app: { ...{ releaseStage }, ...sessionClient.app },
      sessions: [
        {
          id: sessionClient._session.id,
          startedAt: sessionClient._session.startedAt,
          user: sessionClient._user
        }
      ]
    })

    return sessionClient
  }
}
