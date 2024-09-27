// @ts-ignore
import { NativeClient } from '../../native'

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
        dispatchAsync: async (event: any) => {
          events.push(event)
        },
        getPayloadInfoAsync: async () => ({
          threads: [],
          breadcrumbs: [],
          app: {},
          device: {}
        }),
        _events: events,
        _clear: () => { while (events.length) events.pop() },
        resumeSession: () => {},
        resumeSessionOnStartup: () => {},
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
import rnPromise from 'promise/setimmediate' // eslint-disable-line
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
  // @ts-expect-error Property 'ErrorUtils' does not exist on type 'typeof global
  global.ErrorUtils.setGlobalHandler(() => {})
  Bugsnag.start()
})

// clear the https mock's record of requests between tests
beforeEach(() => NativeClient._clear())

describe('@bugsnag/react-native: handled and unhandled errors', () => {
  it('should send a handled error', (done) => {
    Bugsnag.notify(new Error('oh no'), () => {}, (event) => {
      expect(NativeClient._events.length).toBe(1)
      expect(NativeClient._events[0].errors[0].errorMessage).toBe('oh no')
      expect(NativeClient._events[0].unhandled).toBe(false)
      expect(NativeClient._events[0].severityReason).toEqual({ type: 'handledException' })
      expect(event).toBeTruthy()
      done()
    })
  })

  it('should send an unhandled error', (done) => {
    // we can't actually throw an error as that will fail the test, but we can
    // send an error to the handler that Bugsnag has hooked into
    // @ts-expect-error Property 'ErrorUtils' does not exist on type 'typeof global
    global.ErrorUtils.getGlobalHandler()(new Error('hi'))
    setTimeout(() => {
      expect(NativeClient._events.length).toBe(1)
      expect(NativeClient._events[0].errors[0].errorMessage).toBe('hi')
      expect(NativeClient._events[0].unhandled).toBe(true)
      expect(NativeClient._events[0].severityReason).toEqual({ type: 'unhandledException' })
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
      expect(NativeClient._events.length).toBe(1)
      expect(NativeClient._events[0].errors[0].errorMessage).toBe('"sdf".sdflkj is not a function')
      expect(NativeClient._events[0].unhandled).toBe(true)
      expect(NativeClient._events[0].severityReason).toEqual({ type: 'unhandledPromiseRejection' })
      done()
    }, 150)
  })
})
