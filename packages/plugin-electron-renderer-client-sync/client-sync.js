const safeExec = (client, ipc, action) => (...args) => {
  try {
    return ipc[action](...args)
  } catch (e) {
    client._logger.error(e)
  }
}

module.exports = (BugsnagIpcRenderer = window.__bugsnag_ipc__) => ({
  load: (client) => {
    client.addOnBreadcrumb(breadcrumb => {
      try {
        BugsnagIpcRenderer.leaveBreadcrumb(breadcrumb)
      } catch (e) {
        client._logger.error(e)
      }
    }, true)

    client.addOnError(async (event) => {
      const {
        app,
        breadcrumbs,
        context,
        device,
        metadata,
        user
      } = await BugsnagIpcRenderer.getPayloadInfo()

      event.context = event.context || context
      event.breadcrumbs = breadcrumbs
      event.app = { ...app, ...(event.app || {}) }
      event.device = { ...device, ...(event.device || {}) }
      if (!event.user || Object.keys(event.user).length === 0) {
        event.user = user
      }
      for (const section in metadata) {
        if (event._metadata[section]) {
          event._metadata[section] = { ...metadata[section], ...event._metadata[section] }
        } else {
          event._metadata[section] = metadata[section]
        }
      }
      for (const err in event.errors) {
        err.type = 'electronrendererjs'
      }
    }, true)

    client.setUser = safeExec(client, BugsnagIpcRenderer, 'setUser')
    client.setContext = safeExec(client, BugsnagIpcRenderer, 'setContext')
    client.addMetadata = safeExec(client, BugsnagIpcRenderer, 'addMetadata')
    client.clearMetadata = safeExec(client, BugsnagIpcRenderer, 'clearMetadata')
    client.startSession = () => {
      safeExec(client, BugsnagIpcRenderer, 'startSession')()
      return client
    }
    client.stopSession = safeExec(client, BugsnagIpcRenderer, 'stopSession')
    client.pauseSession = safeExec(client, BugsnagIpcRenderer, 'pauseSession')
    client.resumeSession = () => {
      safeExec(client, BugsnagIpcRenderer, 'resumeSession')()
      return client
    }

    // sync any client state that was set in the renderer config

    try {
      const updates = { metadata: client._metadata }
      const user = client.getUser()
      const context = client.getContext()
      if (context && context.length > 0) {
        updates.context = context
      }
      if (Object.keys(user).length > 0) {
        updates.user = user
      }
      BugsnagIpcRenderer.update(updates)
    } catch (e) {
      client._logger.error(e)
    }

    // use main process state once configured properties are synched

    client.getContext = safeExec(client, BugsnagIpcRenderer, 'getContext')
    client.getUser = safeExec(client, BugsnagIpcRenderer, 'getUser')
    client.getMetadata = safeExec(client, BugsnagIpcRenderer, 'getMetadata')
  }
})
