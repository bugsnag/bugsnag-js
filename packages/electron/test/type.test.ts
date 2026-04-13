/* eslint-disable jest/expect-expect, jest/no-disabled-tests */

import Bugsnag, {
  Breadcrumb,
  Event,
  Session
} from '..'

// Cast Bugsnag to any to avoid type errors from the interface extending a class
// with private/readonly members (TS2322, TS2341, TS2540)
const BugsnagClient = Bugsnag as any

describe.skip('@bugsnag/electron types', () => {
  describe('renderer', () => {
    // TODO this would ideally not be allowed but is currently possible
    it('can be started with an API key', () => {
      BugsnagClient.start('abababababababababababababababab')
    })

    it('can be started with no properties specified', () => {
      BugsnagClient.start()
    })

    it('can be started with all properties specified', () => {
      BugsnagClient.start({
        context: 'contextual',
        logger: {
          debug: () => {},
          info: () => {},
          warn: () => {},
          error: () => {}
        },
        metadata: { a: 1, b: 'yes', c: { d: [] } },
        onError: (event: Event) => {},
        onBreadcrumb: (breadcrumb: Breadcrumb) => {},
        plugins: [],
        user: { id: '1234-abcd' },
        appType: 'good',
        codeBundleId: '1245',
        reportUnhandledPromiseRejectionsAsHandled: true
      })
    })
  })

  describe('main', () => {
    it('can be started with an API key', () => {
      BugsnagClient.start('abababababababababababababababab')
    })

    // TODO this would ideally not be allowed at compile time but is currently possible
    it('can be started with no properties specified', () => {
      BugsnagClient.start()
    })

    it('can be started with all properties specified', () => {
      BugsnagClient.start({
        apiKey: 'abababababababababababababababab',
        appType: 'good',
        appVersion: '12312312',
        autoDetectErrors: true,
        autoTrackSessions: true,
        context: 'contextual',
        enabledBreadcrumbTypes: [
          'navigation',
          'request',
          'process',
          'log',
          'user',
          'state',
          'error',
          'manual'
        ],
        enabledErrorTypes: {
          unhandledExceptions: true,
          unhandledRejections: false,
          nativeCrashes: true
        },
        enabledReleaseStages: ['vOv', 'VoV'],
        endpoints: {
          notify: 'notify.example.com',
          sessions: 'sessions.example.com'
        },
        logger: {
          debug: () => {},
          info: () => {},
          warn: () => {},
          error: () => {}
        },
        maxBreadcrumbs: 28,
        metadata: { a: 1, b: 'yes', c: { d: [] } },
        onBreadcrumb: (breadcrumb: Breadcrumb) => {},
        onError: (event: Event) => {},
        onSession: (session: Session) => {},
        plugins: [],
        redactedKeys: ['b'],
        releaseStage: 'vOv',
        user: { id: '1234-abcd' },
        launchDurationMillis: 100,
        sendCode: false
      })
      BugsnagClient.markLaunchComplete()
      const isStarted = BugsnagClient.isStarted()
      console.log(isStarted)
    })
  })
})
