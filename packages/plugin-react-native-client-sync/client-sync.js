const { DeviceEventEmitter, NativeEventEmitter, NativeModules, Platform } = require('react-native')

module.exports = (NativeClient) => ({
  load: (client) => {
    client.addOnBreadcrumb(breadcrumb => {
      // we copy the breadcrumb's properties over to a new object to ensure its
      // to JSON() method doesn't get called before passing the object over the
      // bridge. This happens in the remote debugger and means the "message"
      // property is incorrectly named "name"
      NativeClient.leaveBreadcrumb({ ...breadcrumb })
    }, true)

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

    const origAddFeatureFlags = client.addFeatureFlags
    client.addFeatureFlags = function (featureFlags) {
      const ret = origAddFeatureFlags.apply(this, arguments)
      NativeClient.addFeatureFlags(featureFlags)
      return ret
    }

    const origAddFeatureFlag = client.addFeatureFlag
    client.addFeatureFlag = function (name, variant) {
      const ret = origAddFeatureFlag.apply(this, arguments)
      NativeClient.addFeatureFlag(name, variant)
      return ret
    }

    const origClearFeatureFlag = client.clearFeatureFlag
    client.clearFeatureFlag = function (name) {
      const ret = origClearFeatureFlag.apply(this, arguments)
      NativeClient.clearFeatureFlag(name)
      return ret
    }

    const origClearFeatureFlags = client.clearFeatureFlags
    client.clearFeatureFlags = function () {
      const ret = origClearFeatureFlags.apply(this, arguments)
      NativeClient.clearFeatureFlags()
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
          client._metadata = event.data
          break
        case 'ContextUpdate':
          origSetContext.call(client, event.data)
          break
        case 'AddFeatureFlag':
          origAddFeatureFlag.call(client, event.data.name, event.data.variant)
          break
        case 'ClearFeatureFlag':
          if (event.data && event.data.name) {
            origClearFeatureFlag.call(client, event.data.name)
          } else {
            origClearFeatureFlags.call(client)
          }
          break
        default:
      }
    })
  }
})
