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
        addFeatureFlags: jest.fn()
      }
    },
    Platform: {
      OS: 'android'
    }
  }
})

beforeEach(() => {
  window.fetch = jest.fn()
  window.XMLHttpRequest = jest.fn() as any

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

describe('react-native notifier: isStarted', () => {
  it('returns false when the notifier has not been started', () => {
    expect(Bugsnag.isStarted).toBe(false)
  })
  it('returns true when the notifier has been started', () => {
    Bugsnag.start()
    expect(Bugsnag.isStarted).toBe(true)
  })
})
