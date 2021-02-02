module.exports = (NativeClient) => ({
  load: (client) => {
    client.addOnBreadcrumb(breadcrumb => {
      NativeClient.leaveBreadcrumb(breadcrumb)
    }, true)

    const origSetUser = client.setUser
    client.setUser = function () {
      const ret = origSetUser.apply(this, arguments)
      NativeClient.updateUser(this._user.id, this._user.email, this._user.name)
      return ret
    }

    const origSetContext = client.setContext
    client.setContext = function (context) {
      const ret = origSetContext.apply(this, arguments)
      NativeClient.updateContext(context)
      return ret
    }

    const origAddMetadata = client.addMetadata
    client.addMetadata = function (section, key, value) {
      const ret = origAddMetadata.apply(this, arguments)
      if (typeof key === 'object') {
        NativeClient.addMetadata(section, key)
      } else {
        NativeClient.addMetadata(section, { [key]: value })
      }
      return ret
    }

    const origClearMetadata = client.clearMetadata
    client.clearMetadata = function (section, key) {
      const ret = origClearMetadata.apply(this, arguments)
      NativeClient.clearMetadata(section, key)
      return ret
    }
  }
})
