import BugsnagReactNativeStatic, {
  Breadcrumb,
  Client,
  Event,
  NotifiableError,
  OnErrorCallback
} from '..'

// @ts-ignore
import { NativeModules } from 'react-native'

const NativeClient = NativeModules.BugsnagReactNative

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
  Platform: {
    OS: 'android'
  }
}))

describe('react native notifier', () => {
  let Bugsnag: typeof BugsnagReactNativeStatic

  beforeAll(() => {
    jest.spyOn(console, 'debug').mockImplementation(() => {})
  })

  beforeEach(() => {
    jest.isolateModules(() => {
      Bugsnag = require('..')
    })

    window.fetch = jest.fn()
    window.XMLHttpRequest = jest.fn() as any
  })

  it('accepts plugins', () => {
    Bugsnag.start({
      plugins: [{
        name: 'foobar',
        load: client => 10
      }]
    })
    expect(Bugsnag.getPlugin('foobar')).toBe(10)
  })

  it('notifies handled errors', (done) => {
    // Explicitly reference the public types to ensure they are exported correctly
    const error: NotifiableError = new Error('123')
    const onError: OnErrorCallback = (event: Event) => {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const client: Client = Bugsnag.start({
      codeBundleId: '1.2.3-r908',
      onError: [
        event => true
      ],
      onBreadcrumb: (b: Breadcrumb) => {
        return false
      },
      user: null,
      metadata: {},
      logger: undefined
    })

    Bugsnag.notify(error, onError, (err, event) => {
      if (err) {
        done(err)
      }
      expect(NativeClient.dispatch).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            errorClass: 'Error',
            errorMessage: '123'
          })
        ]),
        severity: 'warning',
        severityReason: { type: 'handledException' },
        unhandled: false
      }))

      done()
    })
  })
})
