import { Client } from '@bugsnag/core'
import { schema as defaultSchema } from '@bugsnag/core/config'
import { Event, Session, SessionPayload, EventPayload, Plugin } from '@bugsnag/core'

interface ClientTestHelpers {
  client: Client
  sendEvent: () => Promise<Event>
  sendSession: () => Promise<Session>
}

export function makeClientForPlugin ({
  config = {},
  schema = {},
  plugins = []
}: { config?: object, schema?: object, plugins?: Plugin[] } = {}): ClientTestHelpers {
  const client = new Client(
    {
      apiKey: 'abcabcabcabcabcabcabc1234567890f',
      logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
      ...config
    },
    { ...defaultSchema, ...schema },
    plugins
  )

  let lastSession: SessionPayload

  client._setDelivery(() => ({
    sendEvent (payload: EventPayload, cb: (err: Error|null, obj: unknown) => void) {
      expect(payload.events).toHaveLength(1)
      cb(null, payload.events[0])
    },
    sendSession (session: SessionPayload) {
      expect(session).toBeTruthy()
      lastSession = session
    }
  }))

  client._sessionDelegate = {
    startSession (client: Client, session: Session) {
      client._delivery.sendSession(session, () => {})
    },
    resumeSession () {
    },
    pauseSession () {
    }
  }

  const sendEvent = async () => new Promise((resolve, reject) => {
    // @ts-expect-error - we don't have Client internals to correctly type this
    client._notify(new Event('Error', 'incorrect lambda type'), () => {}, (err: Error|null, obj) => {
      if (err !== null) return reject(err)
      resolve(obj)
    })
  })

  const sendSession = async () => new Promise((resolve, reject) => {
    const lastSessionBefore = lastSession
    const sessionTimeout = setTimeout(
      () => { reject(new Error('session not delivered in time!')) },
      500
    )

    const resolveIfSessionSent = () => {
      if (lastSession !== lastSessionBefore) {
        clearTimeout(sessionTimeout)
        resolve(lastSession)
        return
      }

      setTimeout(resolveIfSessionSent, 1)
    }

    resolveIfSessionSent()

    client.startSession()
  })

  // @ts-expect-error - we don't have Client internals to correctly type this
  return { client, sendEvent, sendSession }
}
