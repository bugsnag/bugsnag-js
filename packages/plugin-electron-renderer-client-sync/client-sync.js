module.exports = (BugsnagIpcRenderer = window.__bugsnag_ipc__) => ({
  load: (client) => {
    client.addOnBreadcrumb(breadcrumb => {
      try {
        BugsnagIpcRenderer.leaveBreadcrumb(breadcrumb)
      } catch (e) {
        client._logger.error(e)
      }
    }, true)

    const origSetUser = client.setUser
    client.setUser = function () {
      const ret = origSetUser.apply(this, arguments)
      try {
        BugsnagIpcRenderer.updateUser(this._user.id, this._user.email, this._user.name)
      } catch (e) {
        client._logger.error(e)
      }
      return ret
    }

    const origSetContext = client.setContext
    client.setContext = function (context) {
      const ret = origSetContext.apply(this, arguments)
      try {
        BugsnagIpcRenderer.updateContext(context)
      } catch (e) {
        client._logger.error(e)
      }
      return ret
    }

    const origAddMetadata = client.addMetadata
    client.addMetadata = function (section, keyOrValues, value) {
      const ret = origAddMetadata.apply(this, arguments)
      try {
        BugsnagIpcRenderer.addMetadata(section, section, keyOrValues, value)
      } catch (e) {
        client._logger.error(e)
      }
      return ret
    }

    const origClearMetadata = client.clearMetadata
    client.clearMetadata = function (section, key) {
      const ret = origClearMetadata.apply(this, arguments)
      try {
        BugsnagIpcRenderer.clearMetadata(section, key)
      } catch (e) {
        client._logger.error(e)
      }
      return ret
    }

    BugsnagIpcRenderer.listen((event, change) => {
      switch (change.type) {
        case 'ContextUpdate': return origSetContext.call(client, change.payload.context)
        case 'UserUpdate': return origSetUser.call(client, change.payload.user.id, change.payload.user.email, change.payload.user.name)
        case 'AddMetadata': return origAddMetadata.call(client, change.payload.section, change.payload.keyOrValues, change.payload.value)
        case 'ClearMetadata': return origClearMetadata.call(client, change.payload.section, change.payload.key)
      }
    })
  }
})
