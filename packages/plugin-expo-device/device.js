const Constants = require('expo-constants').default
const { Dimensions, Platform } = require('react-native')
const { isoDate } = require('@bugsnag/core/lib/es-utils')
const rnVersion = require('react-native/package.json').version

module.exports = {
  init: client => {
    let orientation
    const updateOrientation = () => {
      const { height, width } = Dimensions.get('screen')
      if (height > width) {
        orientation = 'portrait'
      } else if (height < width) {
        orientation = 'landscape'
      } else {
        orientation = undefined
      }
    }
    Dimensions.addEventListener('change', updateOrientation)

    // get the initial orientation
    updateOrientation()

    client.addOnError(event => {
      event.device = {
        ...event.device,
        ...client.device,
        id: Constants.installationId,
        manufacturer: Constants.platform.ios ? 'Apple' : undefined,
        modelName: Constants.platform.ios ? Constants.platform.ios.model : undefined,
        modelNumber: Constants.platform.ios ? Constants.platform.ios.platform : undefined,
        osName: Platform.OS,
        osVersion: Constants.platform.ios ? Constants.platform.ios.systemVersion : Constants.systemVersion,
        runtimeVersions: {
          reactNative: rnVersion,
          expoApp: Constants.expoVersion,
          expoSdk: Constants.manifest.sdkVersion,
          androidApiLevel: Constants.platform.android ? String(Platform.Version) : undefined
        },
        time: isoDate(),
        orientation
      }
      event.addMetadata('device', {
        isDevice: Constants.isDevice,
        appOwnership: Constants.appOwnership
      })
    }, true)
  }
}
