import Client from '@bugsnag/core/client'
import { schema as defaultSchema } from '@bugsnag/core/config'
import { Event, Session } from '@bugsnag/core'

interface ClientTestHelpers {
  client: Client
  sendEvent: () => Promise<Event>
  sendSession: () => Promise<Session>
}

export function makeClientForPlugin ({
  config = {},
  schema = {},
  plugin = { load: (_client: Client): any => {} }
} = {}): ClientTestHelpers {
  const client = new Client(
    {
      apiKey: 'abcabcabcabcabcabcabc1234567890f',
      logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
      ...config
    },
    { ...defaultSchema, ...schema },
    [plugin]
  )

  let lastSession

  client._setDelivery(() => ({
    sendEvent (payload, cb) {
      expect(payload.events).toHaveLength(1)
      cb(payload.events[0])
    },
    sendSession (session) {
      expect(session).toBeTruthy()
      lastSession = session
    }
  }))

  client._sessionDelegate = {
    startSession (client, session) {
      client._delivery.sendSession(session)
    }
  }

  const sendEvent = async () => await new Promise(resolve => {
    // @ts-expect-error - we don't have Client internals to correctly type this
    client._notify(new Event('Error', 'incorrect lambda type'), () => {}, resolve)
  })

  const sendSession = async () => await new Promise((resolve, reject) => {
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
