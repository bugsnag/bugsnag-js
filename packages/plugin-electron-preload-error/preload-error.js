const normalizePath = require('@bugsnag/core/lib/path-normalizer')

const handledState = {
  severity: 'error',
  unhandled: true,
  severityReason: { type: 'unhandledException' }
}

module.exports = app => ({
  load (client) {
    if (!client._config.autoDetectErrors) return
    if (!client._config.enabledErrorTypes.unhandledExceptions) return

    const projectRoot = client._config.projectRoot
      ? normalizePath(client._config.projectRoot)
      : null

    app.on('web-contents-created', (_event, webContents) => {
      webContents.on('preload-error', (_event, path, error) => {
        const event = client.Event.create(error, true, handledState, 'preload-error', 1)

        let context = path

        if (projectRoot && context.startsWith(projectRoot)) {
          context = context.substr(projectRoot.length)
        }

        event.context = context

        client._notify(event)
      })
    })
  }
})
