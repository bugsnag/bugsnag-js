const { DeviceEventEmitter, NativeEventEmitter, NativeModules, Platform } = require('react-native')

module.exports = {
  init: (client, NativeClient) => {
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
    client.addMetadata = function () {
      const ret = origAddMetadata.apply(this, arguments)
      NativeClient.updateMetaData(client._metadata)
      return ret
    }

    const origClearMetadata = client.clearMetadata
    client.clearMetadata = function () {
      const ret = origClearMetadata.apply(this, arguments)
      NativeClient.updateMetaData(client._metadata)
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
        case 'USER_UPDATE':
          origSetUser.call(client, event.value.id, event.value.email, event.value.name)
          break
        case 'METADATA_UPDATE':
          origAddMetadata.call(client, event.value)
          break
        case 'CONTEXT_UPDATE':
          origSetContext.call(client, event.value)
          break
        // etc.
        default:
      }
    })
  }
}
