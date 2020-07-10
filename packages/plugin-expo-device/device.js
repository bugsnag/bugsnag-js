const Device = require('expo-device')
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
      manufacturer: Device.manufacturer,
      // On a real device these two seem equivalent, however on a simulator
      // 'Constants' is a bit more useful as it returns 'Simulator' whereas
      // 'Device' just returns 'iPhone'
      model: Constants.platform.ios
        ? Constants.platform.ios.model
        : Device.modelName,
      modelNumber: Constants.platform.ios ? Constants.platform.ios.platform : undefined,
      osName: Platform.OS,
      osVersion: Constants.platform.ios ? Constants.platform.ios.systemVersion : Constants.systemVersion,
      runtimeVersions: {
        reactNative: rnVersion,
        expoApp: Constants.expoVersion,
        expoSdk: Constants.manifest.sdkVersion,
        androidApiLevel: Constants.platform.android ? String(Platform.Version) : undefined
      },
      totalMemory: Device.totalMemory
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
