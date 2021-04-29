module.exports = (BugsnagIpcRenderer = window.__bugsnag_ipc__) => ({
  load: client => {
    client.addOnError(async (event) => {
      const {
        app,
        breadcrumbs,
        context,
        device,
        metadata,
        user,
        shouldSend
      } = await BugsnagIpcRenderer.getPayloadInfo()

      if (shouldSend === false) return false

      event.context = event.context || context
      event.breadcrumbs = breadcrumbs
      event.app = { ...event.app, ...app }
      event.device = { ...event.device, ...device }

      if (!event._user || Object.keys(event._user).length === 0) {
        event._user = user
      }

      for (const section in metadata) {
        if (event._metadata[section]) {
          event._metadata[section] = { ...metadata[section], ...event._metadata[section] }
        } else {
          event._metadata[section] = metadata[section]
        }
      }

      if (client._config.appType) {
        event.app.type = client._config.appType
      }
    }, true)
  }
})
