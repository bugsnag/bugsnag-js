import BugsnagBrowserStatic, { Breadcrumb, BrowserConfig, Session } from '../'

const DONE = window.XMLHttpRequest.DONE

const API_KEY = '030bab153e7c2349be364d23b5ae93b5'

interface MockXHR {
  open: jest.Mock<any, any>
  send: jest.Mock<any, any>
  setRequestHeader: jest.Mock<any, any>
}

type SendCallback = (xhr: MockXHR) => void

function mockFetch (onSessionSend?: SendCallback, onNotifySend?: SendCallback) {
  const makeMockXHR = (onSend?: SendCallback) => {
    const xhr = {
      open: jest.fn(),
      send: jest.fn(),
      setRequestHeader: jest.fn(),
      readyState: DONE,
      onreadystatechange: () => {}
    }
    xhr.send.mockImplementation((...args) => {
      xhr.onreadystatechange()
      onSend?.(xhr)
    })
    return xhr
  }

  const session = makeMockXHR(onSessionSend)
  const notify = makeMockXHR(onNotifySend)

  // @ts-ignore
  window.XMLHttpRequest = jest.fn()
    .mockImplementationOnce(() => session)
    .mockImplementationOnce(() => notify)
    .mockImplementation(() => makeMockXHR(() => {}))
  // @ts-ignore
  window.XMLHttpRequest.DONE = DONE

  return { session, notify }
}

describe('browser notifier', () => {
  const onNotifySend = jest.fn()
  const onSessionSend = jest.fn()

  beforeAll(() => {
    jest.spyOn(console, 'debug').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  beforeEach(() => {
    jest.resetModules()
  })

  function getBugsnag (): typeof BugsnagBrowserStatic {
    const Bugsnag = require('../src/bugsnag').default
    return Bugsnag
  }

  it('accepts plugins', () => {
    const Bugsnag = getBugsnag()
    Bugsnag.start({
      apiKey: API_KEY,
      plugins: [{
        name: 'foobar',
        load: client => 10
      }]
    })
    expect(Bugsnag.getPlugin('foobar')).toBe(10)
  })

  it('notifies handled errors', (done) => {
    const onSessionSend = (session: MockXHR) => {
      expect(session.open).toHaveBeenCalledWith('POST', 'https://sessions.bugsnag.com')
      expect(session.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'application/json')
      expect(session.setRequestHeader).toHaveBeenCalledWith('Bugsnag-Api-Key', '030bab153e7c2349be364d23b5ae93b5')
      expect(session.setRequestHeader).toHaveBeenCalledWith('Bugsnag-Payload-Version', '1')
      expect(session.send).toHaveBeenCalledWith(expect.any(String))
    }

    const onNotifySend = (notify: MockXHR) => {
      expect(notify.open).toHaveBeenCalledWith('POST', 'https://notify.bugsnag.com')
      expect(notify.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'application/json')
      expect(notify.setRequestHeader).toHaveBeenCalledWith('Bugsnag-Api-Key', '030bab153e7c2349be364d23b5ae93b5')
      expect(notify.setRequestHeader).toHaveBeenCalledWith('Bugsnag-Payload-Version', '4')
      expect(notify.send).toHaveBeenCalledWith(expect.any(String))
      done()
    }

    mockFetch(onSessionSend, onNotifySend)

    const Bugsnag = getBugsnag()
    Bugsnag.start(API_KEY)
    Bugsnag.notify(new Error('123'), undefined, (err, event) => {
      if (err) {
        done(err)
      }
      expect(event.breadcrumbs[0]).toStrictEqual(expect.objectContaining({
        type: 'state',
        message: 'Bugsnag loaded'
      }))
      expect((event.originalError as Error).message).toBe('123')
    })
  })

  it('does not send an event with invalid configuration', () => {
    mockFetch(onSessionSend, onNotifySend)

    const Bugsnag = getBugsnag()
    // @ts-expect-error
    Bugsnag.start({ apiKey: API_KEY, endpoints: { notify: 'https://notify.bugsnag.com' } })
    Bugsnag.notify(new Error('123'), undefined, (err, event) => {
      expect(err).toStrictEqual(new Error('Event not sent due to incomplete endpoint configuration'))
    })
  })

  it('does not send a session with invalid configuration', (done) => {
    const { session } = mockFetch()
    const Bugsnag = getBugsnag()
    // @ts-expect-error
    Bugsnag.start({ apiKey: API_KEY, endpoints: { notify: 'https://notify.bugsnag.com' } })
    Bugsnag.startSession()

    session.onreadystatechange()

    process.nextTick(() => {
      expect(session.open).not.toHaveBeenCalled()
      expect(session.setRequestHeader).not.toHaveBeenCalled()
      expect(session.send).not.toHaveBeenCalled()

      done()
    })
  })

  it('does not send if false is returned in onError', (done) => {
    const { session, notify } = mockFetch()
    const Bugsnag = getBugsnag()
    Bugsnag.start(API_KEY)
    Bugsnag.notify(new Error('123'), (event) => {
      return false
    }, (err, event) => {
      if (err) {
        done(err)
      }
      expect(notify.open).not.toHaveBeenCalled()
      done()
    })

    session.onreadystatechange()
  })

  it('accepts all config options', (done) => {
    const Bugsnag = getBugsnag()

    const completeConfig: BrowserConfig = {
      apiKey: API_KEY,
      appVersion: '1.2.3',
      appType: 'worker',
      autoDetectErrors: true,
      enabledErrorTypes: {
        unhandledExceptions: true,
        unhandledRejections: true
      },
      onError: [
        () => true
      ],
      onBreadcrumb: (b: Breadcrumb) => {
        return false
      },
      onSession: (s: Session) => {
        return true
      },
      endpoints: { notify: 'https://notify.bugsnag.com', sessions: 'https://sessions.bugsnag.com' },
      autoTrackSessions: true,
      enabledReleaseStages: ['zzz'],
      releaseStage: 'production',
      maxBreadcrumbs: 20,
      enabledBreadcrumbTypes: ['manual', 'log', 'request'],
      context: 'contextual',
      featureFlags: [],
      plugins: [],
      user: null,
      metadata: {
        debug: { foo: 'bar' }
      },
      logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
      redactedKeys: ['foo', /bar/],
      collectUserIp: true,
      maxEvents: 10,
      generateAnonymousId: false,
      trackInlineScripts: true,
      reportUnhandledPromiseRejectionsAsHandled: true,
      sendPayloadChecksums: true
    }

    Bugsnag.start(completeConfig)
    Bugsnag.notify(new Error('123'), (event) => {
      return false
    }, (err, event) => {
      if (err) {
        done(err)
      }
      expect(event.breadcrumbs.length).toBe(0)
      expect((event.originalError as Error).message).toBe('123')
      expect(event.getMetadata('debug')).toEqual({ foo: 'bar' })
      done()
    })
  })

  it('indicates whether or not the client is started', () => {
    const Bugsnag = getBugsnag()
    expect(Bugsnag.isStarted()).toBe(false)
    Bugsnag.start(API_KEY)
    expect(Bugsnag.isStarted()).toBe(true)
  })

  it('enables accessing feature flags from events passed to onError callback', (done) => {
    const Bugsnag = getBugsnag()
    Bugsnag.start(API_KEY)
    Bugsnag.addFeatureFlag('feature 1', '1.0')
    Bugsnag.notify(new Error('test error'), (event) => {
      event.addFeatureFlag('feature 2', '2.0')
      expect(event.getFeatureFlags()).toStrictEqual([
        { featureFlag: 'feature 1', variant: '1.0' },
        { featureFlag: 'feature 2', variant: '2.0' }
      ])
      done()
    })
  })

  describe('navigation breadcrumbs', () => {
    it('resets events on pushState', () => {
      const Bugsnag = getBugsnag()
      const client = Bugsnag.createClient('API_KEY')
      // @ts-ignore
      const resetEventCount = jest.spyOn(client, 'resetEventCount')

      window.history.pushState('', '', 'new-url')
      expect(resetEventCount).toHaveBeenCalled()

      resetEventCount.mockReset()
      resetEventCount.mockRestore()
    })

    it('does not reset events on replaceState', () => {
      const Bugsnag = getBugsnag()
      const client = Bugsnag.createClient('API_KEY')
      // @ts-ignore
      const resetEventCount = jest.spyOn(client, 'resetEventCount')

      window.history.replaceState('', '', 'new-url')
      expect(resetEventCount).not.toHaveBeenCalled()

      resetEventCount.mockReset()
      resetEventCount.mockRestore()
    })

    it('does not start unnecessary sessions', () => {
      const Bugsnag = getBugsnag()
      const client = Bugsnag.createClient('API_KEY')
      const startSession = jest.spyOn(client, 'startSession')

      window.history.replaceState('', '', 'new-url')
      expect(startSession).not.toHaveBeenCalled()

      window.history.pushState('', '', 'new-url')
      expect(startSession).not.toHaveBeenCalled()

      startSession.mockReset()
      startSession.mockRestore()
    })
  })

  describe('payload checksum behavior (Bugsnag-Integrity header)', () => {
    beforeEach(() => {
      // @ts-ignore
      window.isSecureContext = true
    })

    afterEach(() => {
      // @ts-ignore
      window.isSecureContext = false
    })

    it('includes the integrity header by default', (done) => {
      const onSessionSend = (session: MockXHR) => {
        expect(session.open).toHaveBeenCalledWith('POST', 'https://sessions.bugsnag.com')
        expect(session.setRequestHeader).toHaveBeenCalledWith('Bugsnag-Integrity', expect.any(String))
        expect(session.send).toHaveBeenCalledWith(expect.any(String))
      }

      const onNotifySend = (notify: MockXHR) => {
        expect(notify.open).toHaveBeenCalledWith('POST', 'https://notify.bugsnag.com')
        expect(notify.setRequestHeader).toHaveBeenCalledWith('Bugsnag-Integrity', expect.any(String))
        expect(notify.send).toHaveBeenCalledWith(expect.any(String))
        done()
      }

      mockFetch(onSessionSend, onNotifySend)

      const Bugsnag = getBugsnag()
      Bugsnag.start(API_KEY)

      Bugsnag.notify(new Error('123'), undefined, (err, event) => {
        if (err) {
          done(err)
        }
      })
    })

    it('does not include the integrity header if endpoint configuration is supplied', (done) => {
      const onSessionSend = (session: MockXHR) => {
        expect(session.open).toHaveBeenCalledWith('POST', 'https://sessions.custom.com')
        expect(session.setRequestHeader).not.toHaveBeenCalledWith('Bugsnag-Integrity', expect.any(String))
        expect(session.send).toHaveBeenCalledWith(expect.any(String))
      }

      const onNotifySend = (notify: MockXHR) => {
        expect(notify.open).toHaveBeenCalledWith('POST', 'https://notify.custom.com')
        expect(notify.setRequestHeader).not.toHaveBeenCalledWith('Bugsnag-Integrity', expect.any(String))
        expect(notify.send).toHaveBeenCalledWith(expect.any(String))
        done()
      }

      mockFetch(onSessionSend, onNotifySend)

      const Bugsnag = getBugsnag()
      Bugsnag.start({ apiKey: API_KEY, endpoints: { notify: 'https://notify.custom.com', sessions: 'https://sessions.custom.com' } })
      Bugsnag.notify(new Error('123'), undefined, (err, event) => {
        if (err) {
          done(err)
        }
      })
    })

    it('can be enabled for a custom endpoint configuration by using sendPayloadChecksums', (done) => {
      const onSessionSend = (session: MockXHR) => {
        expect(session.open).toHaveBeenCalledWith('POST', 'https://sessions.custom.com')
        expect(session.setRequestHeader).toHaveBeenCalledWith('Bugsnag-Integrity', expect.any(String))
        expect(session.send).toHaveBeenCalledWith(expect.any(String))
      }

      const onNotifySend = (notify: MockXHR) => {
        expect(notify.open).toHaveBeenCalledWith('POST', 'https://notify.custom.com')
        expect(notify.setRequestHeader).toHaveBeenCalledWith('Bugsnag-Integrity', expect.any(String))
        expect(notify.send).toHaveBeenCalledWith(expect.any(String))
        done()
      }

      mockFetch(onSessionSend, onNotifySend)

      const Bugsnag = getBugsnag()
      Bugsnag.start({
        apiKey: API_KEY,
        endpoints: { notify: 'https://notify.custom.com', sessions: 'https://sessions.custom.com' },
        sendPayloadChecksums: true
      })
      Bugsnag.notify(new Error('123'), undefined, (err, event) => {
        if (err) {
          done(err)
        }
      })
    })
  })
})
