import WorkerBugsnagStatic from '../src/bugsnag'

const API_KEY = '030bab153e7c2349be364d23b5ae93b5'

const typedGlobal: any = global

function getBugsnag (): typeof WorkerBugsnagStatic {
  const bugsnag = require('../src/notifier').default as typeof WorkerBugsnagStatic
  return bugsnag
}

function mockFetch () {
  typedGlobal.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve() }))
}

const testConfig = {
  apiKey: API_KEY,
  endpoints: { notify: '/echo/', sessions: '/echo/' },
  redactedKeys: []
}

beforeAll(() => {
  mockFetch()
  typedGlobal.__VERSION__ = ''
  jest.spyOn(console, 'debug').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
})

beforeEach(() => {
  jest.resetModules()
})

describe('worker notifier', () => {
  it('accepts plugins', () => {
    const Bugsnag = getBugsnag()
    Bugsnag.start({
      apiKey: API_KEY,
      plugins: [{
        name: 'foobar',
        load: () => 10
      }]
    })
    expect(Bugsnag.getPlugin('foobar')).toBe(10)
  })

  it('notifies handled errors', (done) => {
    const Bugsnag = getBugsnag()
    Bugsnag.start(testConfig)
    Bugsnag.notify(new Error('123'), undefined, (err, event) => {
      if (err) done(err)
      expect(event.originalError.message).toBe('123')
      expect(typedGlobal.fetch).toHaveBeenCalledWith('/echo/', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Bugsnag-Api-Key': API_KEY,
          'Bugsnag-Payload-Version': '4',
          'Bugsnag-Sent-At': expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          'Content-Type': 'application/json'
        })
      }))
      done()
    })
  })

  it('does not send if false is returned in onError', (done) => {
    const Bugsnag = getBugsnag()
    Bugsnag.start(testConfig)
    Bugsnag.notify(new Error('123'), (event) => {
      return false
    }, (err, event) => {
      if (err) {
        done(err)
      }
      expect(typedGlobal.fetch).not.toHaveBeenCalled()
      done()
    })
  })

  it('indicates whether or not the client is started', () => {
    const Bugsnag = getBugsnag()
    expect(Bugsnag.isStarted()).toBe(false)
    Bugsnag.start(testConfig)
    expect(Bugsnag.isStarted()).toBe(true)
  })

  describe('session management', () => {
    it('successfully starts a session', (done) => {
      const Bugsnag = getBugsnag()
      Bugsnag.start(API_KEY)

      expect(typedGlobal.fetch).not.toHaveBeenCalled()

      Bugsnag.startSession()

      expect(typedGlobal.fetch).toHaveBeenCalledWith('https://sessions.bugsnag.com', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Bugsnag-Api-Key': API_KEY,
          'Bugsnag-Payload-Version': '1',
          'Bugsnag-Sent-At': expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          'Content-Type': 'application/json'
        })
      }))

      done()
    })

    it('automatically starts a session', (done) => {
      const Bugsnag = getBugsnag()
      Bugsnag.start({ apiKey: API_KEY, autoTrackSessions: true })

      expect(typedGlobal.fetch).toHaveBeenCalledWith('https://sessions.bugsnag.com', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Bugsnag-Api-Key': API_KEY,
          'Bugsnag-Payload-Version': '1',
          'Bugsnag-Sent-At': expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          'Content-Type': 'application/json'
        })
      }))

      done()
    })
  })
})

describe('prevent-discard', () => {
  const browsers = ['chrome', 'moz', 'safari', 'safari-web']

  it.each(browsers)('renames stacktrace.file on %s-extension exceptions', (type) => {
    const Bugsnag = getBugsnag()
    Bugsnag.start(testConfig)

    const testError = new Error('123')
    testError.stack = `Error: message from content\n    at ${type}-extension://notifier.test.ts:11:19`

    Bugsnag.notify(testError, undefined, (err, event) => {
      expect(err).toBeNull()
      expect(event.errors[0].stacktrace[0].file).toStrictEqual(`${type}_extension://notifier.test.ts`)
    })
  })

  it('renames stacktrace.file with multiple exceptions', (done) => {
    const Bugsnag = getBugsnag()
    Bugsnag.start(testConfig)

    const err1 = new Error('123')
    err1.stack = 'Error: message from content\n    at chrome-extension://notifier.test.ts:19:46'

    // @ts-ignore
    const err2 = new Error('456', { cause: err1 })
    // @ts-ignore
    err2.cause = err1
    err2.stack = 'Error: 456\n    at generateErrors (chrome-extension://notifier.test.ts:14:16)\n    at chrome-extension://notifier.test.ts:19:46'

    // @ts-ignore
    const err3 = new Error('789')
    // @ts-ignore
    err3.cause = err2
    err3.stack = 'Error: 789\n    at generateErrors (chrome-extension://notifier.test.ts:12:15)\n    at chrome-extension://notifier.test.ts:19:46'

    Bugsnag.notify(err3, undefined, (err, event) => {
      expect(err).toBeNull()
      expect(event.errors).toHaveLength(3)
      expect(event.errors).toStrictEqual([
        {
          errorClass: 'Error',
          errorMessage: '789',
          type: 'browserjs',
          stacktrace: [
            {
              code: undefined,
              inProject: undefined,
              file: 'chrome_extension://notifier.test.ts',
              method: 'generateErrors',
              lineNumber: 12,
              columnNumber: 15
            },
            {
              code: undefined,
              inProject: undefined,
              file: 'chrome_extension://notifier.test.ts',
              method: undefined,
              lineNumber: 19,
              columnNumber: 46
            }
          ]
        },
        {
          errorClass: 'Error',
          errorMessage: '456',
          type: 'browserjs',
          stacktrace: [
            {
              code: undefined,
              inProject: undefined,
              file: 'chrome_extension://notifier.test.ts',
              method: 'generateErrors',
              lineNumber: 14,
              columnNumber: 16
            },
            {
              code: undefined,
              inProject: undefined,
              file: 'chrome_extension://notifier.test.ts',
              method: undefined,
              lineNumber: 19,
              columnNumber: 46
            }
          ]
        },
        {
          errorClass: 'Error',
          errorMessage: '123',
          type: 'browserjs',
          stacktrace: [
            {
              code: undefined,
              columnNumber: 46,
              file: 'chrome_extension://notifier.test.ts',
              inProject: undefined,
              lineNumber: 19,
              method: undefined
            }
          ]
        }
      ])
      done()
    })
  })
})
