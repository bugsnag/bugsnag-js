import Bugsnag from '..'

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
        apiKey: 'abababababababababababababababab',
        // mock logger to nullify console debug in test output
        logger: { debug: () => null, info: () => null, warn: () => null, error: () => null }
      })
      expect(Bugsnag.isStarted).toBe(true)
    })
  })
})
