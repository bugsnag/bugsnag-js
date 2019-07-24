const { DeviceEventEmitter, NativeEventEmitter, NativeModules, Platform } = require('react-native')

module.exports = {
  init: (client, NativeClient) => {
    // patch breadcrumb method to sync it on the native client
    client.leaveBreadcrumb = (name, metaData, type, timestamp) => {
      NativeClient.leaveBreadcrumb({ name, metaData, type, timestamp })
    }

    client._internalState.subscribe((prop, val) => {
      switch (prop) {
        case 'context':
          return NativeClient.updateContext(val)
        case 'user':
          const { id, name, email } = val
          return NativeClient.updateUser(id, name, email)
        default:
          return NativeClient.updateMetaData({ [prop]: val })
      }
    })

    const getEmitter = () => {
      switch (Platform.OS) {
        case 'android':
          return DeviceEventEmitter
        case 'ios':
          return NativeEventEmitter(NativeModules.BugsnagReactNativeEmitter)
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
          client._internalState._set({ key: 'user', nestedKeys: [], value: event.value, silent: true })
          break
        case 'META_DATA_UPDATE':
          Object.keys(event.value).forEach(k => {
            client._internalState._set({ key: k, nestedKeys: [], value: event.value[k], silent: true })
          })
          break
        case 'CONTEXT_UPDATE':
          client._internalState._set({ key: 'context', nestedKeys: [], value: event.value, silent: true })
          break
        // etc.
        default:
      }
    })
  }
}
