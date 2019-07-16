module.exports = {
  init: (client, NativeClient) => {
    client.config.beforeSend.unshift(async report => {
      const info = NativeClient.nativePayloadInfo()
      report.set(info)
    })
  }
}

// report.threads = info.threads
// report.breadcrumbs = info.breadcrumbs
// report.app = info.app
// report.device = info.device
// report.metaData = info.metaData
// report.user = info.user
// report.context = info.context
// if (info.session) {
//   report.session = new client.BugsnagSession()
//   report.session.id = info.session.id
//   report.session.startedAt = info.session.startedAt
//   report.session._handled = info.session.handled
//   report.session._unhandled = info.session.unhandled
// }
