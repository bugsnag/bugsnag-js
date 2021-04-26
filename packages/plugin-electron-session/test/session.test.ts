import Client, { EventDeliveryPayload } from '@bugsnag/core/client'
import { SessionPayload } from '@bugsnag/core'
import { makeApp, makeBrowserWindow } from '@bugsnag/electron-test-helpers'
import plugin from '../'

const expectCuid = expect.stringMatching(/^c[a-z0-9]{20,30}$/)

describe('plugin: electron sessions', () => {
  beforeEach(() => { jest.useRealTimers() })

  it('calls session delivery', async () => {
    const BrowserWindow = makeBrowserWindow()
    const app = makeApp({ BrowserWindow })

    const client = new Client(
      { apiKey: 'abcabcabcabcabcabcabc1234567890f' },
      undefined,
      [plugin(app, BrowserWindow)]
    )

    const payload = await createSession(client)

    const expectedPayload = {
      app: { releaseStage: 'production', type: undefined, version: undefined },
      device: {},
      notifier: undefined,
      sessions: [{
        id: expectCuid,
        startedAt: expect.any(Date),
        user: {}
      }]
    }

    expect(payload).toEqual(expectedPayload)

    // copy the session into a plain object to avoid Jest calling toJSON on it
    // this happens in the diff when a test fails, but makes it _really_ annoying
    // to figure out what the session actually looks like
    const session = Object.assign({}, client._session)

    const expectedSession = {
      id: expectCuid,
      startedAt: expect.any(Date),
      _handled: 0,
      _unhandled: 0,
      _user: {},
      app: { releaseStage: 'production', type: undefined, version: undefined },
      device: {}
    }

    expect(session).toEqual(expectedSession)
  })

  it('starts a session when the app returns to the foreground after being in the background for 60 seconds', () => {
    jest.useFakeTimers('modern')

    const BrowserWindow = makeBrowserWindow()
    const app = makeApp({ BrowserWindow })

    const client = new Client(
      { apiKey: 'abcabcabcabcabcabcabc1234567890f' },
      undefined,
      [plugin(app, BrowserWindow)]
    )

    const window = new BrowserWindow(123, 'hello world')
    const payloads: SessionPayload[] = []

    client._setDelivery(() => ({
      sendEvent (payload: EventDeliveryPayload, cb = () => {}) {
      },
      sendSession (payload: SessionPayload, cb = () => {}) {
        payloads.push(payload)
        cb()
      }
    }))

    // jump forward two seconds; this won't result in a session because we are
    // in the foreground
    jest.advanceTimersByTime(120_000)
    expect(payloads).toHaveLength(0)

    // background the browser window
    app._emit('browser-window-blur', window)

    jest.advanceTimersByTime(60_000)
    app._emit('browser-window-focus', window)

    const expectedPayload = {
      app: { releaseStage: 'production', type: undefined, version: undefined },
      device: {},
      notifier: undefined,
      sessions: [{
        id: expectCuid,
        startedAt: expect.any(Date),
        user: {}
      }]
    }

    expect(payloads).toHaveLength(1)
    expect(payloads[0]).toEqual(expectedPayload)
  })

  it('does not start a session when the app switches between foreground and background', () => {
    jest.useFakeTimers('modern')

    const BrowserWindow = makeBrowserWindow()
    const app = makeApp({ BrowserWindow })

    const client = new Client(
      { apiKey: 'abcabcabcabcabcabcabc1234567890f' },
      undefined,
      [plugin(app, BrowserWindow)]
    )

    const window = new BrowserWindow(123, 'hello world')
    const payloads: SessionPayload[] = []

    client._setDelivery(() => ({
      sendEvent (payload: EventDeliveryPayload, cb = () => {}) {
      },
      sendSession (payload: SessionPayload, cb = () => {}) {
        payloads.push(payload)
        cb()
      }
    }))

    app._emit('browser-window-blur', window)

    jest.advanceTimersByTime(50_000)
    expect(payloads).toHaveLength(0)

    app._emit('browser-window-focus', window)

    jest.advanceTimersByTime(90_000)
    expect(payloads).toHaveLength(0)

    app._emit('browser-window-blur', window)

    jest.advanceTimersByTime(50_000)
    expect(payloads).toHaveLength(0)

    app._emit('browser-window-focus', window)

    jest.advanceTimersByTime(90_000)
    expect(payloads).toHaveLength(0)

    // blur again but expect no session as we don't enter the foreground
    app._emit('browser-window-blur', window)

    jest.advanceTimersByTime(90_000)
    expect(payloads).toHaveLength(0)

    // enter the foreground with no additional wait and we should get a session

    app._emit('browser-window-focus', window)
    expect(payloads).toHaveLength(1)
  })

  it('does not start a session when autoTrackSessions is disabled', () => {
    jest.useFakeTimers('modern')

    const BrowserWindow = makeBrowserWindow()
    const app = makeApp({ BrowserWindow })

    const client = new Client(
      { apiKey: 'abcabcabcabcabcabcabc1234567890f', autoTrackSessions: false },
      undefined,
      [plugin(app, BrowserWindow)]
    )

    const window = new BrowserWindow(123, 'hello world')
    const payloads: SessionPayload[] = []

    client._setDelivery(() => ({
      sendEvent (payload: EventDeliveryPayload, cb = () => {}) {
      },
      sendSession (payload: SessionPayload, cb = () => {}) {
        payloads.push(payload)
        cb()
      }
    }))

    app._emit('browser-window-blur', window)

    jest.advanceTimersByTime(120_000)

    app._emit('browser-window-focus', window)

    expect(payloads).toHaveLength(0)
  })
})

async function createSession (client: Client): Promise<SessionPayload> {
  return new Promise(resolve => {
    client._setDelivery(() => ({
      sendEvent (payload: EventDeliveryPayload, cb = () => {}) {
      },
      sendSession (payload: SessionPayload, cb = () => {}) {
        cb()
        resolve(payload)
      }
    }))

    client.startSession()
  })
}
