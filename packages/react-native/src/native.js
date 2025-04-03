const reactNative = require('react-native')

const isTurboModuleEnabled = () => global.RN$Bridgeless || global.__turboModuleProxy != null

export const NativeClient = isTurboModuleEnabled()
  ? reactNative.TurboModuleRegistry.get('BugsnagReactNative')
  : reactNative.NativeModules.BugsnagReactNative
