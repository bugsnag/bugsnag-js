const { DeviceEventEmitter, NativeEventEmitter, NativeModules, Platform } = require('react-native')

module.exports = (NativeClient) => ({
  load: (client) => {
    client.addOnBreadcrumb(breadcrumb => {
      NativeClient.leaveBreadcrumb(breadcrumb)
    })

    const origSetUser = client.setUser
    client.setUser = function () {
      const ret = origSetUser.apply(this, arguments)
      NativeClient.updateUser(this._user.id, this._user.email, this._user.name)
      return ret
    }

    const origSetContext = client.setContext
    client.setContext = function () {
      const ret = origSetContext.apply(this, arguments)
      NativeClient.updateContext(this._context)
      return ret
    }

    const origAddMetadata = client.addMetadata
    client.addMetadata = function (key) {
      const ret = origAddMetadata.apply(this, arguments)
      NativeClient.updateMetadata(key, client._metadata[key])
      return ret
    }

    const origClearMetadata = client.clearMetadata
    client.clearMetadata = function (key) {
      const ret = origClearMetadata.apply(this, arguments)
      NativeClient.updateMetaData(key, client._metadata[key])
      return ret
    }

    const getEmitter = () => {
      switch (Platform.OS) {
        case 'android':
          return DeviceEventEmitter
        case 'ios':
          return new NativeEventEmitter(NativeModules.BugsnagReactNativeEmitter)
        default:
          client._logger.error(new Error(`Platform "${Platform.OS}" is not fully supported by @bugsnag/react-native.`))
          return null
      }
    }

    const nativeSubscribe = (cb) => {
      const nativeEmitter = getEmitter()
      if (nativeEmitter) nativeEmitter.addListener('bugsnag::sync', cb)
    }

    nativeSubscribe(event => {
      switch (event.type) {
        case 'UserUpdate':
          origSetUser.call(client, event.data.id, event.data.email, event.data.name)
          break
        case 'MetadataUpdate':
          Object.keys(event.data).forEach(k => {
            origAddMetadata.call(client, k, event.data[k])
          })
          break
        case 'ContextUpdate':
          origSetContext.call(client, event.data)
          break
        default:
      }
    })
  }
})
