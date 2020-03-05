const Constants = require('expo-constants').default
const { Dimensions, Platform } = require('react-native')
const rnVersion = require('react-native/package.json').version

module.exports = {
  load: client => {
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

    const device = {
      id: Constants.installationId,
      manufacturer: Constants.platform.ios ? 'Apple' : undefined,
      model: Constants.platform.ios ? Constants.platform.ios.model : undefined,
      modelNumber: Constants.platform.ios ? Constants.platform.ios.platform : undefined,
      osName: Platform.OS,
      osVersion: Constants.platform.ios ? Constants.platform.ios.systemVersion : Constants.systemVersion,
      runtimeVersions: {
        reactNative: rnVersion,
        expoApp: Constants.expoVersion,
        expoSdk: Constants.manifest.sdkVersion,
        androidApiLevel: Constants.platform.android ? String(Platform.Version) : undefined
      }
    }

    client.addOnSession(session => {
      session.device = { ...session.device, ...device }
    })

    client.addOnError(event => {
      event.device = { ...event.device, time: new Date(), orientation, ...device }
      event.addMetadata('device', {
        isDevice: Constants.isDevice,
        appOwnership: Constants.appOwnership
      })
    }, true)
  }
}
