import BugsnagExpoStatic, { Client, NotifiableError, OnErrorCallback, Event } from '..'
import { Breadcrumb, Session } from '../types/bugsnag'

jest.mock('expo-constants', () => ({
  default: {
    platform: {},
    manifest: {}
  }
}))

jest.mock('../../plugin-expo-device/node_modules/expo-constants', () => ({
  default: {
    platform: {},
    manifest: {}
  }
}))

jest.mock('../../plugin-expo-app/node_modules/expo-constants', () => ({
  default: {
    platform: {},
    manifest: {}
  }
}))

jest.mock('@bugsnag/delivery-expo', () => () => ({
  sendSession: jest.fn((event, cb) => cb?.()),
  sendEvent: jest.fn((event, cb) => cb?.())
}))

jest.mock('react-native', () => ({
  NativeModules: {
    BugsnagReactNative: {
      configure: jest.fn(() => ({
        apiKey: '030bab153e7c2349be364d23b5ae93b5'
      })),
      updateCodeBundleId: jest.fn(),
      resumeSession: jest.fn(),
      leaveBreadcrumb: jest.fn(),
      getPayloadInfo: jest.fn().mockReturnValue({}),
      dispatch: jest.fn().mockResolvedValue(true)
    }
  },
  Dimensions: {
    addEventListener: function () {},
    get: function () {
      return { width: 1024, height: 768 }
    }
  },
  AppState: {
    addEventListener: jest.fn(),
    currentState: 'active'
  },
  Platform: {
    OS: 'android'
  }
}))

jest.mock('../../delivery-expo/node_modules/expo-file-system', () => ({
  cacheDirectory: 'file://var/data/foo.bar.app/',
  downloadAsync: jest.fn(() => Promise.resolve({ md5: 'md5', uri: 'uri' })),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, md5: 'md5', uri: 'uri' })),
  readAsStringAsync: jest.fn(() => Promise.resolve()),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  moveAsync: jest.fn(() => Promise.resolve()),
  copyAsync: jest.fn(() => Promise.resolve()),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  readDirectoryAsync: jest.fn(() => Promise.resolve()),
  createDownloadResumable: jest.fn(() => Promise.resolve())
}))

jest.mock('../../delivery-expo/node_modules/@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: () => Promise.resolve({ isConnected: true })
}))

jest.mock('../../plugin-react-native-connectivity-breadcrumbs/node_modules/@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: () => Promise.resolve({ isConnected: true })
}))

jest.doMock('../../plugin-expo-device/node_modules/expo-device', () => ({
  manufacturer: 'Google',
  modelName: 'Pixel 4'
}))

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

global.ErrorUtils = {
  setGlobalHandler: jest.fn(),
  getGlobalHandler: jest.fn()
}

const API_KEY = '030bab153e7c2349be364d23b5ae93b5'

describe('expo notifier', () => {
  let Bugsnag: typeof BugsnagExpoStatic

  beforeEach(() => {
    jest.isolateModules(() => {
      Bugsnag = require('..')
    })
  })

  it('accepts plugins', () => {
    Bugsnag.start({
      apiKey: API_KEY,
      plugins: [{
        name: 'foobar',
        load: client => 10
      }]
    })
    expect(Bugsnag.getPlugin('foobar')).toBe(10)
  })

  it('notifies handled errors', () => {
    // Explicitly reference the public types to ensure they are exported correctly
    const error: NotifiableError = new Error('123')
    const onError: OnErrorCallback = (event: Event) => {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const client: Client = Bugsnag.start({
      apiKey: API_KEY,
      appVersion: '1.2.3',
      appType: 'worker',
      autoDetectErrors: true,
      enabledErrorTypes: {
        unhandledExceptions: true,
        unhandledRejections: true
      },
      onError: [
        event => true
      ],
      onBreadcrumb: (b: Breadcrumb) => {
        return false
      },
      onSession: (s: Session) => {
        return true
      },
      endpoints: { notify: 'https://notify.bugsnag.com', sessions: 'https://sessions.bugsnag.com' },
      autoTrackSessions: true,
      enabledReleaseStages: ['production'],
      releaseStage: 'production',
      maxBreadcrumbs: 20,
      enabledBreadcrumbTypes: ['manual', 'log', 'request'],
      user: null,
      metadata: {},
      logger: undefined,
      redactedKeys: ['foo', /bar/]
    })

    Bugsnag.notify(error, onError)
    expect(true).toBe(true)
  })
})
