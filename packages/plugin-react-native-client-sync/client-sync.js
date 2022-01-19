const { DeviceEventEmitter, NativeEventEmitter, NativeModules, Platform } = require('react-native')
const makeSafe = require('@bugsnag/delivery-react-native/make-safe')

module.exports = (NativeClient) => ({
  load: (client) => {
    client.addOnBreadcrumb(breadcrumb => {
      // we copy the breadcrumb's properties over to a new object to ensure its
      // to JSON() method doesn't get called before passing the object over the
      // bridge. This happens in the remote debugger and means the "message"
      // property is incorrectly named "name"
      NativeClient.leaveBreadcrumb(makeSafe(breadcrumb))
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
        NativeClient.addMetadata(section, { [key]: makeSafe(value) })
      }
      return ret
    }

    const origClearMetadata = client.clearMetadata
    client.clearMetadata = function (section, key) {
      const ret = origClearMetadata.apply(this, arguments)
      NativeClient.clearMetadata(section, key)
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
        default:
      }
    })
  }
})
