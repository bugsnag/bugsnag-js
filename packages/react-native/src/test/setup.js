require('react-native/jest/setup')

if (typeof window === 'undefined') {
  global.window = global
}

const { NativeModules } = require('react-native')

NativeModules.BugsnagReactNativeEmitter = NativeModules.BugsnagReactNativeEmitter || {
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  removeListeners: jest.fn(),
  addListenerSync: jest.fn(),
  removeListenersSync: jest.fn()
}

NativeModules.BugsnagReactNative = NativeModules.BugsnagReactNative || {
  configure: jest.fn().mockReturnValue({}),
  leaveBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  clearUser: jest.fn(),
  setMetadata: jest.fn(),
  clearMetadata: jest.fn(),
  setContext: jest.fn(),
  addFeatureFlags: jest.fn(),
  clearFeatureFlag: jest.fn(),
  clearFeatureFlags: jest.fn(),
  getPlugin: jest.fn()
}

// Safely mock NativeEventEmitter class so new NativeEventEmitter() never fails with Native module cannot be null
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  return class NativeEventEmitter {
    constructor (nativeModule) {}
    addListener () { return { remove: jest.fn() } }
    removeListeners () {}
    removeAllListeners () {}
    emit () {}
  }
})