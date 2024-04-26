const reactNative = require('react-native')

const isTurboModuleEnabled = () => global.__turboModuleProxy != null

export const NativeInterface = isTurboModuleEnabled()
  ? reactNative.TurboModuleRegistry.get('BugsnagTestInterface')
  : reactNative.NativeModules.BugsnagTestInterface
