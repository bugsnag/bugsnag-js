// @ts-ignore
import { NativeModules } from 'react-native'

jest.mock('react-native', () => {
  const events: any[] = []
  return {
    NativeModules: {
      BugsnagReactNative: {
        configure: () => ({
          apiKey: 'abab1212abab1212abab1212abab1212',
          enabledBreadcrumbTypes: []
        }),
        leaveBreadcrumb: () => {},
        dispatch: async (event: any) => {
          events.push(event)
        },
        getPayloadInfo: async () => ({
          threads: [],
          breadcrumbs: [],
          app: {},
          device: {}
        }),
        _events: events,
        _clear: () => { while (events.length) events.pop() },
        resumeSession: () => {},
        pauseSession: () => {},
        startSession: () => {}
      }
    },
    Platform: {
      OS: 'android'
    },
    NativeEventEmitter: function () {},
    DeviceEventEmitter: { addListener: () => {} }
  }
})

// @ts-ignore
import rnPromise from '@bugsnag/plugin-react-native-unhandled-rejection/node_modules/promise/setimmediate' // eslint-disable-line
// eslint-disable-next-line
import Bugsnag from '../../..'

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
  jest.spyOn(console, 'debug').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})

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
