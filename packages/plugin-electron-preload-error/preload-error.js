const handledState = {
  severity: 'error',
  unhandled: true,
  severityReason: { type: 'unhandledException' }
}

module.exports = app => ({
  load (client) {
    if (!client._config.autoDetectErrors) return
    if (!client._config.enabledErrorTypes.unhandledExceptions) return

    app.on('web-contents-created', (_event, webContents) => {
      webContents.on('preload-error', (_event, path, error) => {
        const event = client.Event.create(error, true, handledState, 'preload-error', 1)

        // TODO should the project root should be removed here?
        event.context = path

        client._notify(event)
      })
    })
  }
})
