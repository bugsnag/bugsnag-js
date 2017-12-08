const { map } = require('../../base/lib/es-utils')
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
