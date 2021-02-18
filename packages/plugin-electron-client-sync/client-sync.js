module.exports = (NativeClient) => ({
  load: (client) => {
    client.addOnBreadcrumb(breadcrumb => {
      try {
        NativeClient.leaveBreadcrumb(breadcrumb)
      } catch (e) {
        client._logger.error(e)
      }
    }, true)

    const origSetUser = client.setUser
    client.setUser = function () {
      const ret = origSetUser.apply(this, arguments)
      try {
        NativeClient.updateUser(this._user.id, this._user.email, this._user.name)
      } catch (e) {
        client._logger.error(e)
      }
      return ret
    }

    const origSetContext = client.setContext
    client.setContext = function (context) {
      const ret = origSetContext.apply(this, arguments)
      try {
        NativeClient.updateContext(context)
      } catch (e) {
        client._logger.error(e)
      }
      return ret
    }

    const origAddMetadata = client.addMetadata
    client.addMetadata = function (section, key, value) {
      const ret = origAddMetadata.apply(this, arguments)
      try {
        if (typeof key === 'object') {
          NativeClient.addMetadata(section, key)
        } else {
          NativeClient.addMetadata(section, { [key]: value })
        }
      } catch (e) {
        client._logger.error(e)
      }
      return ret
    }

    const origClearMetadata = client.clearMetadata
    client.clearMetadata = function (section, key) {
      const ret = origClearMetadata.apply(this, arguments)
      try {
        NativeClient.clearMetadata(section, key)
      } catch (e) {
        client._logger.error(e)
      }
      return ret
    }
  }
})
