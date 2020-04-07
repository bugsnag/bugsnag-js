jest.mock('react-native')

// @ts-ignore
import rnPromise from '@bugsnag/plugin-react-native-unhandled-rejection/node_modules/promise/setimmediate' // eslint-disable-line
// eslint-disable-next-line
import Bugsnag from '../../..'
// @ts-ignore
import { NativeModules } from 'react-native' // eslint-disable-line

declare global {
  namespace NodeJS { // eslint-disable-line
    interface Global {
      ErrorUtils: {
        setGlobalHandler: (fn: Function) => void
        getGlobalHandler: () => Function
      }
    }
  }
}

// we can only start bugsnag once per file, because it installs global handlers
// and doesn't have a way to uninstall itself
beforeAll(() => {
  // leaving the default handler intact causes simulated unhandled errors to fail tests
  global.ErrorUtils.setGlobalHandler(() => {})
  Bugsnag.start()
})

// clear the https mock's record of requests between tests
beforeEach(() => NativeModules.BugsnagReactNative._clear())

describe('@bugsnag/react-native: handled and unhandled errors', () => {
  it('should send a handled error', (done) => {
    Bugsnag.notify(new Error('oh no'), () => {}, (event) => {
      expect(NativeModules.BugsnagReactNative._events.length).toBe(1)
      expect(NativeModules.BugsnagReactNative._events[0].errors[0].errorMessage).toBe('oh no')
      expect(NativeModules.BugsnagReactNative._events[0].unhandled).toBe(false)
      expect(NativeModules.BugsnagReactNative._events[0].severityReason).toEqual({ type: 'handledException' })
      expect(event).toBeTruthy()
      done()
    })
  })

  it('should send an unhandled error', (done) => {
    // we can't actually throw an error as that will fail the test, but we can
    // send an error to the handler that Bugsnag has hooked into
    global.ErrorUtils.getGlobalHandler()(new Error('hi'))
    setTimeout(() => {
      expect(NativeModules.BugsnagReactNative._events.length).toBe(1)
      expect(NativeModules.BugsnagReactNative._events[0].errors[0].errorMessage).toBe('hi')
      expect(NativeModules.BugsnagReactNative._events[0].unhandled).toBe(true)
      expect(NativeModules.BugsnagReactNative._events[0].severityReason).toEqual({ type: 'unhandledException' })
      done()
    }, 10)
  })

  it('should send an unhandled rejection', (done) => {
    // we can't actually reject an error because that will fail the test, but we
    // can send an mocked promise rejection event
    try {
      // @ts-ignore
      'sdf'.sdflkj()
    } catch (e) {
      console.log(e)
      rnPromise.reject(e)
    }
    setTimeout(() => {
      expect(NativeModules.BugsnagReactNative._events.length).toBe(1)
      expect(NativeModules.BugsnagReactNative._events[0].errors[0].errorMessage).toBe('"sdf".sdflkj is not a function')
      expect(NativeModules.BugsnagReactNative._events[0].unhandled).toBe(true)
      expect(NativeModules.BugsnagReactNative._events[0].severityReason).toEqual({ type: 'unhandledPromiseRejection' })
      done()
    }, 150)
  })
})
