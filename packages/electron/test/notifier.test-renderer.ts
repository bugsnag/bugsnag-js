import Bugsnag from '..'

beforeAll(() => {
  // @ts-ignore:
  window.__bugsnag_ipc__ = {
    process: null,
    config: {
      apiKey: 'abdf120abdf120abdf120abdf120abdf',
      enabledBreadcrumbTypes: []
    },
    update: () => null,
    getContext: () => {},
    setContext: () => null,
    addMetadata: () => null,
    clearMetadata: () => null,
    getMetadata: () => {},
    addFeatureFlag: () => null,
    addFeatureFlags: () => null,
    clearFeatureFlag: () => null,
    clearFeatureFlags: () => null,
    getUser: () => null,
    setUser: () => null,
    leaveBreadcrumb: () => null,
    startSession: () => null,
    pauseSession: () => null,
    resumeSession: () => null,
    dispatch: () => null,
    getPayloadInfo: () => {}
  }
})

beforeEach(() => {
  // @ts-ignore:
  Bugsnag._client = null
})

describe('@bugsnag/electron notifier', () => {
  describe('isStarted', () => {
    it('returns false when the notifier has not been started', () => {
      expect(Bugsnag.isStarted).toBe(false)
    })

    it('returns true when the notifier has been started', () => {
      Bugsnag.start({
        // mock logger to nullify console debug in test output
        logger: { debug: () => null, info: () => null, warn: () => null, error: () => null }
      })
      expect(Bugsnag.isStarted).toBe(true)
    })
  })
})
