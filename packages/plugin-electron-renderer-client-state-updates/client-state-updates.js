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
        BugsnagIpcRenderer.leaveBreadcrumb(Object.assign({}, breadcrumb))
      } catch (e) {
        client._logger.error(e)
      }
    }, true)

    client.setUser = safeExec(client, BugsnagIpcRenderer, 'setUser')
    client.setContext = safeExec(client, BugsnagIpcRenderer, 'setContext')
    client.addMetadata = safeExec(client, BugsnagIpcRenderer, 'addMetadata')
    client.clearMetadata = safeExec(client, BugsnagIpcRenderer, 'clearMetadata')
    client.addFeatureFlag = safeExec(client, BugsnagIpcRenderer, 'addFeatureFlag')
    client.addFeatureFlags = safeExec(client, BugsnagIpcRenderer, 'addFeatureFlags')
    client.clearFeatureFlag = safeExec(client, BugsnagIpcRenderer, 'clearFeatureFlag')
    client.clearFeatureFlags = safeExec(client, BugsnagIpcRenderer, 'clearFeatureFlags')
    client.setGroupingDiscriminator = safeExec(client, BugsnagIpcRenderer, 'setGroupingDiscriminator')

    client.startSession = () => {
      safeExec(client, BugsnagIpcRenderer, 'startSession')()
      return client
    }
    client.pauseSession = safeExec(client, BugsnagIpcRenderer, 'pauseSession')
    client.resumeSession = () => {
      safeExec(client, BugsnagIpcRenderer, 'resumeSession')()
      return client
    }

    // sync any client state that was set in the renderer config

    try {
      const updates = { metadata: client._metadata, features: client._features }
      const user = client.getUser()
      const context = client.getContext()
      const groupingDiscriminator = client.getGroupingDiscriminator()
      if (context && context.length > 0) {
        updates.context = context
      }
      if (groupingDiscriminator) {
        updates.groupingDiscriminator = groupingDiscriminator
      }
      if (Object.keys(user).length > 0) {
        updates.user = user
      }
      BugsnagIpcRenderer.update(updates)
    } catch (e) {
      client._logger.error(e)
    }

    // Clear synched state from the renderer config
    client._metadata = {}
    client._featuresIndex = {}
    client._features = []
    client._context = undefined
    client._groupingDiscriminator = undefined
    client._user = {}

    // use main process state once configured properties are synched

    client.getContext = safeExec(client, BugsnagIpcRenderer, 'getContext')
    client.getUser = safeExec(client, BugsnagIpcRenderer, 'getUser')
    client.getMetadata = safeExec(client, BugsnagIpcRenderer, 'getMetadata')
    client.getGroupingDiscriminator = safeExec(client, BugsnagIpcRenderer, 'getGroupingDiscriminator')
  }
})
