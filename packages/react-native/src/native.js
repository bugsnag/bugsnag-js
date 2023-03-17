const reactNative = require('react-native')

const isTurboModuleEnabled = () => global.__turboModuleProxy != null

export const NativeClient = isTurboModuleEnabled()
  ? reactNative.TurboModuleRegistry.get('BugsnagReactNative')
  : reactNative.NativeModules.BugsnagReactNative
