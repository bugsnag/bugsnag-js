const serializeForNativeLayer = require('./native-serializer')
const { DeviceEventEmitter, NativeEventEmitter, NativeModules, Platform } = require('react-native')

module.exports = {
  init: (client, NativeClient) => {
    // patch breadcrumb method to sync it on the native client
    client.leaveBreadcrumb = (name, metaData, type, timestamp) => {
      const metadata = serializeForNativeLayer(metaData, client._logger)
      NativeClient.leaveBreadcrumb({ name, metadata, type, timestamp })
    }

    client._internalState.subscribe((prop, val) => {
      console.log('CHANGE', prop, val)
      switch (prop) {
        case 'context':
          return NativeClient.updateContext(val)
        case 'user':
          return NativeClient.updateUser(val)
        default:
          return NativeClient.updateMetaData({ [prop]: val })
      }
    })

    const getEmitter = () => {
      switch (Platform.OS) {
        case 'Android':
          return DeviceEventEmitter
        case 'iOS':
          return NativeEventEmitter(NativeModules.BugsnagReactNativeEmitter)
        default:
          throw new Error('what platform are you even on though')
      }
    }

    const nativeSubscribe = (cb) => getEmitter().addListener('sync', cb)
    nativeSubscribe(event => {
      switch (event.type) {
        case 'USER_UPDATE':
          client._internalState._set({ key: 'user', nestedKeys: [], value: event.value, silent: true })
          break
        case 'META_DATA_UPDATE':
          // set metaData
          break
        // etc.
        default:
      }
    })
  }
}
