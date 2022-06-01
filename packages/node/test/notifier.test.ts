import Bugsnag from '..'

describe('node notifier', () => {
  beforeAll(() => {
    jest.spyOn(console, 'debug').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  beforeEach(() => {
    // @ts-ignore:
    Bugsnag._client = null
  })

  describe('isStarted()', () => {
    it('returns false when the notifier has not been initialised', () => {
      expect(Bugsnag.isStarted()).toBe(false)
    })

    it('returns true when the notifier has been initialised', () => {
      Bugsnag.start('abcd12abcd12abcd12abcd12abcd12abcd')
      expect(Bugsnag.isStarted()).toBe(true)
    })
  })
})
