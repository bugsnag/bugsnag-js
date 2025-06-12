const { stripProjectRoot } = require('@bugsnag/plugin-electron-renderer-strip-project-root')
const featureFlagDelegate = require('@bugsnag/core/lib/feature-flag-delegate')

module.exports = (BugsnagIpcRenderer = window.__bugsnag_ipc__) => ({
  load: client => {
    client.addOnError(async (event) => {
      const {
        app,
        breadcrumbs,
        context,
        device,
        metadata,
        features,
        user,
        shouldSend
      } = await BugsnagIpcRenderer.getPayloadInfo()

      if (shouldSend === false) return false

      event.context = event.context || context || getDefaultContext()
      event.breadcrumbs = breadcrumbs
      event.app = { ...event.app, ...app, codeBundleId: client._config.codeBundleId }
      event.device = { ...event.device, ...device }
      featureFlagDelegate.merge(event._features, features, event._featuresIndex)

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

    const getDefaultContext = () => {
      return window.document.title || stripProjectRoot(client._config.projectRoot, window.location.pathname)
    }
  }
})
