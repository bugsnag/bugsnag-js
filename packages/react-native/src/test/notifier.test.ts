// @ts-ignore
import { NativeModules } from 'react-native'

import Bugsnag from '../..'

jest.mock('react-native', () => {
  return {
    NativeModules: {
      BugsnagReactNative: {
        configure: () => ({
          apiKey: 'abab1212abab1212abab1212abab1212'
        }),
        resumeSession: () => {},
        addFeatureFlags: jest.fn(),
        leaveBreadcrumb: jest.fn()
      }
    },
    Platform: {
      OS: 'android'
    }
  }
})

beforeAll(() => {
  jest.spyOn(console, 'debug').mockImplementation(() => {})
})

beforeEach(() => {
  window.fetch = jest.fn()
  window.XMLHttpRequest = jest.fn() as any

  // TODO: Consider best way to clean down Bugsnag.start() between tests
  // @ts-ignore:
  Bugsnag._client = null
})

describe('react-native notifier: start()', () => {
  it('supports featureFlags', () => {
    Bugsnag.start({
      featureFlags: [
        { name: 'demo_mode' },
        { name: 'sample_group', variant: 'abc123' }
      ]
    })

    expect(NativeModules.BugsnagReactNative.addFeatureFlags).toHaveBeenCalled()
  })
})

describe('react-native notifier: isStarted()', () => {
  it('returns false when the notifier has not been initialized', () => {
    expect(Bugsnag.isStarted()).toBe(false)
  })
  it('returns true when the notifier has been initialized', () => {
    Bugsnag.start()
    expect(Bugsnag.isStarted()).toBe(true)
  })
})
