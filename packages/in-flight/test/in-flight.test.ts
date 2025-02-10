import clone from '@bugsnag/core/lib/clone-client'
import type { SessionDeliveryPayload } from '@bugsnag/core/client'
import { Client, EventPayload } from '@bugsnag/core'

// The in-flight package has module level state which can leak between tests
// We can avoid this using jest's 'isolateModules' but need to type the
// 'bugsnagInFlight' variable for this test to compile
import BugsnagInFlightJustForTypescript from '../types/bugsnag-in-flight'

let bugsnagInFlight: typeof BugsnagInFlightJustForTypescript
jest.isolateModules(() => { bugsnagInFlight = require('../src/in-flight') })
const noop = () => {}
const id = <T>(a: T) => a

describe('@bugsnag/in-flight', () => {
  it('tracks in-flight events', () => {
    const client = new Client({ apiKey: 'AN_API_KEY' })
    const payloads: EventPayload[] = []
    const sendSession = jest.fn()

    client._setDelivery(() => ({
      sendEvent: (payload, cb) => {
        expect(client._depth).toBe(2)
        payloads.push(payload)
        cb()
      },
      sendSession
    }))

    bugsnagInFlight.trackInFlight(client)

    expect(payloads.length).toBe(0)

    const onError = jest.fn()
    const callback = jest.fn()

    expect(client._depth).toBe(1)

    client.notify(new Error('xyz'), onError, callback)

    expect(client._depth).toBe(1)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(payloads.length).toBe(1)
    expect(sendSession).not.toHaveBeenCalled()
  })

  it('can track in-flight events after a client is cloned', () => {
    const client = new Client({ apiKey: 'AN_API_KEY' })

    // eslint thinks this is never reassigned, but it clearly is
    let cloned: Client // eslint-disable-line prefer-const

    const payloads: EventPayload[] = []
    const sendSession = jest.fn()

    client._setDelivery(() => ({
      sendEvent: (payload, cb) => {
        expect(cloned._depth).toBe(2)
        payloads.push(payload)
        cb()
      },
      sendSession
    }))

    bugsnagInFlight.trackInFlight(client)

    expect(payloads.length).toBe(0)

    const onError = jest.fn()
    const callback = jest.fn()

    cloned = clone(client)

    expect(cloned._depth).toBe(1)

    cloned.notify(new Error('xyz'), onError, callback)

    expect(cloned._depth).toBe(1)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(payloads.length).toBe(1)
    expect(sendSession).not.toHaveBeenCalled()
  })

  it('tracks in-flight sessions', () => {
    const client = new Client({ apiKey: 'AN_API_KEY' })
    const payloads: SessionDeliveryPayload[] = []
    const sendEvent = jest.fn()
    const callback = jest.fn()

    client._sessionDelegate = {
      startSession: jest.fn(function (client, session) {
        client._delivery.sendSession(session, callback)

        return client
      }),
      pauseSession: jest.fn(),
      resumeSession: jest.fn()
    }

    client._setDelivery(() => ({
      sendEvent,
      sendSession: (payload, cb) => {
        payloads.push(payload)
        cb()
      }
    }))

    bugsnagInFlight.trackInFlight(client)

    expect(payloads.length).toBe(0)
    expect(callback).not.toHaveBeenCalled()
    expect(client._sessionDelegate.startSession).not.toHaveBeenCalled()
    expect(client._sessionDelegate.pauseSession).not.toHaveBeenCalled()
    expect(client._sessionDelegate.resumeSession).not.toHaveBeenCalled()

    client.startSession()

    expect(payloads.length).toBe(1)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(client._sessionDelegate.startSession).toHaveBeenCalledTimes(1)
    expect(client._sessionDelegate.pauseSession).not.toHaveBeenCalled()
    expect(client._sessionDelegate.resumeSession).not.toHaveBeenCalled()
  })

  it('tracks in-flight sessions after a client has been cloned', () => {
    const client = new Client({ apiKey: 'AN_API_KEY' })
    const payloads: SessionDeliveryPayload[] = []
    const sendEvent = jest.fn()
    const callback = jest.fn()

    client._sessionDelegate = {
      startSession: jest.fn(function (client, session) {
        client._delivery.sendSession(session, callback)

        return client
      }),
      pauseSession: jest.fn(),
      resumeSession: jest.fn()
    }

    client._setDelivery(() => ({
      sendEvent,
      sendSession: (payload, cb) => {
        payloads.push(payload)
        cb()
      }
    }))

    bugsnagInFlight.trackInFlight(client)

    expect(payloads.length).toBe(0)
    expect(callback).not.toHaveBeenCalled()
    expect(client._sessionDelegate.startSession).not.toHaveBeenCalled()
    expect(client._sessionDelegate.pauseSession).not.toHaveBeenCalled()
    expect(client._sessionDelegate.resumeSession).not.toHaveBeenCalled()

    const cloned = clone(client)

    cloned.startSession()

    expect(payloads.length).toBe(1)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(cloned._sessionDelegate.startSession).toHaveBeenCalledTimes(1)
    expect(cloned._sessionDelegate.pauseSession).not.toHaveBeenCalled()
    expect(cloned._sessionDelegate.resumeSession).not.toHaveBeenCalled()
  })

  it('tracks all in-flight requests', () => {
    const client = new Client({ apiKey: 'AN_API_KEY' })
    const eventPayloads: EventPayload[] = []
    const sessionPayloads: SessionDeliveryPayload[] = []
    const sessionCallback = jest.fn()

    client._sessionDelegate = {
      startSession: jest.fn(function (client, session) {
        client._delivery.sendSession(session, sessionCallback)

        return client
      }),
      pauseSession: jest.fn(),
      resumeSession: jest.fn()
    }

    client._setDelivery(() => ({
      sendEvent: (payload, cb) => {
        expect(client._depth).toBe(2)
        eventPayloads.push(payload)
        cb()
      },
      sendSession: (payload, cb) => {
        sessionPayloads.push(payload)
        cb()
      }
    }))

    bugsnagInFlight.trackInFlight(client)

    expect(eventPayloads.length).toBe(0)
    expect(sessionPayloads.length).toBe(0)

    const onError = jest.fn()
    const notifyCallback = jest.fn()

    expect(client._depth).toBe(1)

    client.notify(new Error('xyz'), onError, notifyCallback)
    client.startSession()

    expect(client._depth).toBe(1)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(notifyCallback).toHaveBeenCalledTimes(1)
    expect(sessionCallback).toHaveBeenCalledTimes(1)
    expect(eventPayloads.length).toBe(1)
    expect(sessionPayloads.length).toBe(1)
  })

  it('can flush successfully', async () => {
    const client = new Client({ apiKey: 'AN_API_KEY' })
    const eventPayloads: EventPayload[] = []
    const sessionPayloads: SessionDeliveryPayload[] = []

    client._sessionDelegate = {
      startSession (client, session) {
        client._delivery.sendSession(session, () => {})

        return client
      },
      pauseSession: noop,
      resumeSession: id
    }

    client._setDelivery(() => ({
      sendEvent (payload, cb) {
        setTimeout(function () {
          eventPayloads.push(payload)
          cb()
        }, 100)
      },
      sendSession (payload, cb) {
        setTimeout(function () {
          sessionPayloads.push(payload)
          cb()
        }, 100)
      }
    }))

    bugsnagInFlight.trackInFlight(client)

    client.notify(new Error('xyz'))
    client.startSession()

    expect(eventPayloads.length).toBe(0)
    expect(sessionPayloads.length).toBe(0)

    await bugsnagInFlight.flush(1000)

    expect(eventPayloads.length).toBe(1)
    expect(sessionPayloads.length).toBe(1)
  })

  it('will timeout if flush takes too long', async () => {
    const client = new Client({ apiKey: 'AN_API_KEY' })
    const eventPayloads: EventPayload[] = []
    const sessionPayloads: SessionDeliveryPayload[] = []

    client._sessionDelegate = {
      startSession: (client, session) => {
        client._delivery.sendSession(session, () => {})

        return client
      },
      pauseSession: noop,
      resumeSession: id
    }

    client._setDelivery(() => ({
      sendEvent (payload, cb) {
        setTimeout(() => {
          eventPayloads.push(payload)
          cb()
        }, 250)
      },
      sendSession (payload, cb) {
        setTimeout(() => {
          sessionPayloads.push(payload)
          cb()
        }, 250)
      }
    }))

    bugsnagInFlight.trackInFlight(client)

    client.notify(new Error('xyz'))
    client.startSession()

    expect(eventPayloads.length).toBe(0)
    expect(sessionPayloads.length).toBe(0)

    const expected = new Error('flush timed out after 10ms')
    await expect(() => bugsnagInFlight.flush(10)).rejects.toThrow(expected)

    expect(eventPayloads.length).toBe(0)
    expect(sessionPayloads.length).toBe(0)

    await bugsnagInFlight.flush(1000)

    expect(eventPayloads.length).toBe(1)
    expect(sessionPayloads.length).toBe(1)
  })

  it('can track requests when delivery is changed', async () => {
    const client = new Client({ apiKey: 'AN_API_KEY' })
    const originalEventPayloads: EventPayload[] = []
    const originalSessionPayloads: SessionDeliveryPayload[] = []

    client._sessionDelegate = {
      startSession (client, session) {
        client._delivery.sendSession(session, () => {})

        return client
      },
      pauseSession: noop,
      resumeSession: id
    }

    client._setDelivery(() => ({
      sendEvent (payload, cb) {
        setTimeout(function () {
          originalEventPayloads.push(payload)
          cb()
        }, 100)
      },
      sendSession (payload, cb) {
        setTimeout(function () {
          originalSessionPayloads.push(payload)
          cb()
        }, 100)
      }
    }))

    bugsnagInFlight.trackInFlight(client)

    client.notify(new Error('xyz'))
    client.startSession()

    expect(originalEventPayloads.length).toBe(0)
    expect(originalSessionPayloads.length).toBe(0)

    await bugsnagInFlight.flush(1000)

    expect(originalEventPayloads.length).toBe(1)
    expect(originalSessionPayloads.length).toBe(1)

    const newEventPayloads: EventPayload[] = []
    const newSessionPayloads: SessionDeliveryPayload[] = []

    client._setDelivery(() => ({
      sendEvent (payload, cb) {
        setTimeout(function () {
          newEventPayloads.push(payload)
          cb()
        }, 100)
      },
      sendSession (payload, cb) {
        setTimeout(function () {
          newSessionPayloads.push(payload)
          cb()
        }, 100)
      }
    }))

    client.notify(new Error('xyz'))
    client.startSession()

    expect(originalEventPayloads.length).toBe(1)
    expect(originalSessionPayloads.length).toBe(1)
    expect(newEventPayloads.length).toBe(0)
    expect(newSessionPayloads.length).toBe(0)

    await bugsnagInFlight.flush(1000)

    expect(originalEventPayloads.length).toBe(1)
    expect(originalSessionPayloads.length).toBe(1)
    expect(newEventPayloads.length).toBe(1)
    expect(newSessionPayloads.length).toBe(1)
  })
})
