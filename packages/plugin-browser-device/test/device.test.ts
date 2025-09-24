import plugin from '../src/device'

import { Client, Device, Event, Session, SessionDeliveryPayload, EventDeliveryPayload, schema } from '@bugsnag/core'

interface SessionWithDevice extends Session { device: Device }

const navigator = { language: 'en-GB', userAgent: 'testing browser 1.2.3' } as unknown as Navigator
const mockWindow = { screen: { orientation: { type: 'landscape-primary' } } } as unknown as Window & typeof globalThis
const noop = () => {}
const id = <T>(a: T) => a

describe('plugin: device', () => {
  it('should add an onError callback which captures device information', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, [plugin(navigator)])
    const payloads: EventDeliveryPayload[] = []

    expect(client._cbs.e).toHaveLength(1)

    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].device).toBeDefined()
    expect(payloads[0].events[0].device.time instanceof Date).toBe(true)
    expect(payloads[0].events[0].device.locale).toBe(navigator.language)
    expect(payloads[0].events[0].device.userAgent).toBe(navigator.userAgent)
    expect(payloads[0].events[0].device.orientation).toBe('portrait')
    expect(payloads[0].events[0].device).toHaveProperty('id')
  })

  it('should capture the screen orientation if possible and add it to the event', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, [plugin(navigator, mockWindow)])
    const payloads: EventDeliveryPayload[] = []

    expect(client._cbs.e).toHaveLength(1)

    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].device).toBeDefined()
    expect(payloads[0].events[0].device.time instanceof Date).toBe(true)
    expect(payloads[0].events[0].device.locale).toBe(navigator.language)
    expect(payloads[0].events[0].device.userAgent).toBe(navigator.userAgent)
    expect(payloads[0].events[0].device.orientation).toBe('landscape-primary')
    expect(payloads[0].events[0].device).toHaveProperty('id')
  })

  it('should add an onSession callback which captures device information', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, [plugin(navigator)])
    const payloads: SessionDeliveryPayload[] = []
    client._sessionDelegate = {
      startSession: (client, session) => {
        client._delivery.sendSession(session, () => {})

        return client
      },
      pauseSession: noop,
      resumeSession: id
    }

    expect(client._cbs.s).toHaveLength(1)

    client._setDelivery(client => ({ sendEvent: () => {}, sendSession: (payload) => payloads.push(payload) }))
    client.startSession()

    expect(payloads.length).toEqual(1)
    expect(payloads[0].device).toBeDefined()
    expect(payloads[0].device && payloads[0].device.locale).toBe(navigator.language)
    expect(payloads[0].device && payloads[0].device.userAgent).toBe(navigator.userAgent)
    expect(payloads[0].device && payloads[0].device.orientation).toBe('portrait')
    expect(payloads[0].device && payloads[0].device).toHaveProperty('id')
  })

  it('should capture the screen orientation if possible and add it to the session', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, [plugin(navigator, mockWindow)])
    const payloads: SessionDeliveryPayload[] = []
    client._sessionDelegate = {
      startSession: (client, session) => {
        client._delivery.sendSession(session, () => {})

        return client
      },
      pauseSession: noop,
      resumeSession: id
    }

    expect(client._cbs.s).toHaveLength(1)

    client._setDelivery(client => ({ sendEvent: () => {}, sendSession: (payload) => payloads.push(payload) }))
    client.startSession()

    expect(payloads.length).toEqual(1)
    expect(payloads[0].device).toBeDefined()
    expect(payloads[0].device && payloads[0].device.locale).toBe(navigator.language)
    expect(payloads[0].device && payloads[0].device.userAgent).toBe(navigator.userAgent)
    expect(payloads[0].device && payloads[0].device.orientation).toBe('landscape-primary')
    expect(payloads[0].device && payloads[0].device).toHaveProperty('id')
  })

  describe('device.id', () => {
    const anonymousIdKey = 'bugsnag-anonymous-id'
    const fakeCuid = 'cabcdefghijklmnopqrstuvwx'
    const _localStorage = window.localStorage

    afterEach(() => {
      Object.defineProperty(window, 'localStorage', { get: () => _localStorage })
      window.localStorage.removeItem(anonymousIdKey)
    })

    const mockDelivery = (
      client: Client,
      events: Event[],
      sessions: SessionWithDevice[]
    ) => {
      client._sessionDelegate = {
        startSession (client: Client, session: Session) {
          client._delivery.sendSession(
            { sessions: [session] },
            (err) => { if (err) throw err }
          )

          return client
        },
        pauseSession: noop,
        resumeSession: id
      }

      client._setDelivery((client) => ({
        sendEvent (payload) {
          expect(payload.events).toHaveLength(1)
          events.push(payload.events[0])
        },

        sendSession (payload) {
          if (!payload.sessions || !payload.sessions.length) {
            throw new Error('No sessions found in payload')
          }

          sessions.push(payload.sessions[0] as SessionWithDevice)
        }
      }))
    }

    const looksLikeDeviceId = (maybeId: any) => {
      if (!maybeId) return 'is falsy'
      if (!Object.prototype.hasOwnProperty.call(maybeId, 'length')) return 'has no "length" property'
      if (maybeId.length < 20) return `is too short (${maybeId.length} chars)`
      if (maybeId.length > 32) return `is too long (${maybeId.length} chars)`
      if (maybeId[0] !== 'c') return `does not start with "c" (${maybeId})`
      return true
    }

    it('should generate a device ID when "generateAnonymousId" is enabled', () => {
      const client = new Client(
        { apiKey: 'API_KEY_YEAH', generateAnonymousId: true },
        undefined,
        [plugin(navigator)]
      )

      const events: Event[] = []
      const sessions: SessionWithDevice[] = []

      mockDelivery(client, events, sessions)
      client.notify(new Error('noooo'))

      expect(events).toHaveLength(1)
      expect(looksLikeDeviceId(events[0].device.id)).toBe(true)

      client.startSession()

      expect(sessions).toHaveLength(1)
      expect(sessions[0].device.id).toBe(events[0].device.id)
    })

    it('should fetch the device ID from localStorage', () => {
      window.localStorage.setItem(anonymousIdKey, fakeCuid)

      const client = new Client(
        { apiKey: 'API_KEY_YEAH', generateAnonymousId: true },
        undefined,
        [plugin(navigator)]
      )

      const events: Event[] = []
      const sessions: SessionWithDevice[] = []

      mockDelivery(client, events, sessions)
      client.notify(new Error('noooo'))

      expect(events).toHaveLength(1)
      expect(events[0].device.id).toBe(fakeCuid)

      client.startSession()

      expect(sessions).toHaveLength(1)
      expect(sessions[0].device.id).toBe(events[0].device.id)
    })

    it('should save the device ID in localStorage, if it does not exist', () => {
      const client = new Client(
        { apiKey: 'API_KEY_YEAH', generateAnonymousId: true },
        undefined,
        [plugin(navigator)]
      )

      const events: Event[] = []
      const sessions: SessionWithDevice[] = []

      mockDelivery(client, events, sessions)
      client.notify(new Error('noooo'))

      expect(events).toHaveLength(1)
      expect(looksLikeDeviceId(events[0].device.id)).toBe(true)

      const eventDeviceId = events[0].device.id
      const storedId = window.localStorage.getItem(anonymousIdKey)

      expect(eventDeviceId).toBe(storedId)

      client.startSession()

      expect(sessions).toHaveLength(1)
      expect(sessions[0].device.id).toBe(events[0].device.id)

      const sessionDeviceId = sessions[0].device.id

      expect(sessionDeviceId).toBe(storedId)
    })

    it('should reuse the same device ID for every event/session', () => {
      const client = new Client(
        { apiKey: 'API_KEY_YEAH', generateAnonymousId: true },
        undefined,
        [plugin(navigator)]
      )

      const events: Event[] = []
      const sessions: SessionWithDevice[] = []

      mockDelivery(client, events, sessions)
      client.notify(new Error('noooo 1'))

      expect(events).toHaveLength(1)
      expect(looksLikeDeviceId(events[0].device.id)).toBe(true)

      const initialDeviceId = events[0].device.id

      client.startSession()

      expect(sessions).toHaveLength(1)
      expect(sessions[0].device.id).toBe(initialDeviceId)

      client.notify(new Error('noooo 2'))

      expect(events.length).toEqual(2)
      expect(events[1].device.id).toBe(initialDeviceId)

      client.startSession()

      expect(sessions).toHaveLength(2)
      expect(sessions[1].device.id).toBe(initialDeviceId)

      client.notify(new Error('noooo 3'))

      expect(events.length).toEqual(3)
      expect(events[2].device.id).toBe(initialDeviceId)

      client.startSession()

      expect(sessions).toHaveLength(3)
      expect(sessions[2].device.id).toBe(initialDeviceId)
    })

    it('should not generate a device ID when "generateAnonymousId" is disabled', () => {
      const client = new Client(
        { apiKey: 'API_KEY_YEAH', generateAnonymousId: false },
        undefined,
        [plugin(navigator)]
      )

      const events: Event[] = []
      const sessions: SessionWithDevice[] = []

      mockDelivery(client, events, sessions)
      client.notify(new Error('noooo'))

      expect(events).toHaveLength(1)
      expect(events[0].device).not.toHaveProperty('id')

      client.startSession()

      expect(sessions).toHaveLength(1)
      expect(sessions[0].device).not.toHaveProperty('id')
    })

    it('should not generate a device ID when localStorage cannot be accessed', () => {
      // Make 'window.localStorage' throw so it cannot be safely accessed
      Object.defineProperty(window, 'localStorage', {
        get () { throw new Error('No localStorage for you') }
      })

      const client = new Client(
        { apiKey: 'API_KEY_YEAH', generateAnonymousId: true },
        undefined,
        [plugin(navigator)]
      )

      const events: Event[] = []
      const sessions: SessionWithDevice[] = []

      mockDelivery(client, events, sessions)
      client.notify(new Error('noooo'))

      expect(events).toHaveLength(1)
      expect(events[0].device.id).toBeUndefined()

      client.startSession()

      expect(sessions).toHaveLength(1)
      expect(sessions[0].device.id).toBeUndefined()
    })

    it('should not generate a device ID when localStorage cannot be read from', () => {
      Object.defineProperty(window, 'localStorage', {
        get () {
          return {
            getItem (key: string) { throw new Error('localStorage is broken') },
            setItem (key: string, value: string) {}
          }
        }
      })

      const client = new Client(
        { apiKey: 'API_KEY_YEAH', generateAnonymousId: true },
        undefined,
        [plugin(navigator)]
      )

      const events: Event[] = []
      const sessions: SessionWithDevice[] = []

      mockDelivery(client, events, sessions)
      client.notify(new Error('noooo'))

      expect(events).toHaveLength(1)
      expect(events[0].device.id).toBeUndefined()

      client.startSession()

      expect(sessions).toHaveLength(1)
      expect(sessions[0].device.id).toBeUndefined()
    })

    it('should not generate a device ID when localStorage cannot be written to', () => {
      Object.defineProperty(window, 'localStorage', {
        get () {
          return {
            getItem (key: string) { return undefined },
            setItem (key: string, value: string) { throw new Error('localStorage is now read only') }
          }
        }
      })

      const client = new Client(
        { apiKey: 'API_KEY_YEAH', generateAnonymousId: true },
        undefined,
        [plugin(navigator)]
      )

      const events: Event[] = []
      const sessions: SessionWithDevice[] = []

      mockDelivery(client, events, sessions)
      client.notify(new Error('noooo'))

      expect(events).toHaveLength(1)
      expect(events[0].device.id).toBeUndefined()

      client.startSession()

      expect(sessions).toHaveLength(1)
      expect(sessions[0].device.id).toBeUndefined()
    })

    it('should regenerate the device ID when the stored value is too short', () => {
      const storedId = 'not an id'
      window.localStorage.setItem(anonymousIdKey, storedId)

      const client = new Client(
        { apiKey: 'API_KEY_YEAH', generateAnonymousId: true },
        undefined,
        [plugin(navigator)]
      )

      const events: Event[] = []
      const sessions: SessionWithDevice[] = []

      mockDelivery(client, events, sessions)
      client.notify(new Error('noooo'))

      expect(events).toHaveLength(1)
      expect(events[0].device.id).not.toBe(storedId)
      expect(looksLikeDeviceId(events[0].device.id)).toBe(true)

      client.startSession()

      expect(sessions).toHaveLength(1)
      expect(sessions[0].device.id).toBe(events[0].device.id)
    })

    it('should regenerate the device ID when the stored value is too long', () => {
      const storedId = 'not an id. This is because it is far too long to be an id'
      window.localStorage.setItem(anonymousIdKey, storedId)

      const client = new Client(
        { apiKey: 'API_KEY_YEAH', generateAnonymousId: true },
        undefined,
        [plugin(navigator)]
      )

      const events: Event[] = []
      const sessions: SessionWithDevice[] = []

      mockDelivery(client, events, sessions)
      client.notify(new Error('noooo'))

      expect(events).toHaveLength(1)
      expect(events[0].device.id).not.toBe(storedId)
      expect(looksLikeDeviceId(events[0].device.id)).toBe(true)

      client.startSession()

      expect(sessions).toHaveLength(1)
      expect(sessions[0].device.id).toBe(events[0].device.id)
    })

    it('should regenerate the device ID when the stored value does not match the format', () => {
      const storedId = 'cabc-efgh-jklm-opqr-tuvwx'
      window.localStorage.setItem(anonymousIdKey, storedId)

      const client = new Client(
        { apiKey: 'API_KEY_YEAH', generateAnonymousId: true },
        undefined,
        [plugin(navigator)]
      )

      const events: Event[] = []
      const sessions: SessionWithDevice[] = []

      mockDelivery(client, events, sessions)
      client.notify(new Error('noooo'))

      expect(events).toHaveLength(1)
      expect(events[0].device.id).not.toBe(storedId)
      expect(looksLikeDeviceId(events[0].device.id)).toBe(true)

      client.startSession()

      expect(sessions).toHaveLength(1)
      expect(sessions[0].device.id).toBe(events[0].device.id)
    })

    it('should not set device.id as user.id when collectUserIp=true', () => {
      const client = new Client(
        { apiKey: 'API_KEY_YEAH' },
        {
          ...schema,
          collectUserIp: {
            defaultValue: () => true,
            validate: () => true,
            message: ''
          }
        },
        [plugin(navigator)]
      )
      const events: Event[] = []
      const sessions: SessionWithDevice[] = []

      expect(client._cbs.e).toHaveLength(1)

      mockDelivery(client, events, sessions)
      client.notify(new Error('noooo'))

      expect(events).toHaveLength(1)
      expect(events[0]._user.id).toBe(undefined)

      client.startSession()

      expect(sessions).toHaveLength(1)
      expect(sessions[0].getUser().id).toBe(undefined)
    })

    it('should set device.id as user.id when collectUserIp=false', () => {
      const client = new Client(
        { apiKey: 'API_KEY_YEAH', collectUserIp: false },
        {
          ...schema,
          collectUserIp: {
            defaultValue: () => true,
            validate: () => true,
            message: ''
          }
        },
        [plugin(navigator)]
      )
      const events: Event[] = []
      const sessions: SessionWithDevice[] = []

      expect(client._cbs.e).toHaveLength(1)

      mockDelivery(client, events, sessions)
      client.notify(new Error('noooo'))

      expect(events).toHaveLength(1)
      expect(events[0]._user.id).toBeTruthy()
      expect(events[0]._user.id).toBe(events[0].device.id)

      client.startSession()

      expect(sessions).toHaveLength(1)
      expect(sessions[0].getUser().id).toBeTruthy()
      expect(sessions[0].getUser().id).toBe(events[0].device.id)
    })

    it('should not replace an existing user.id with device.id', () => {
      const client = new Client(
        { apiKey: 'API_KEY_YEAH', collectUserIp: false },
        {
          ...schema,
          collectUserIp: {
            defaultValue: () => true,
            validate: () => true,
            message: ''
          }
        },
        [plugin(navigator)]
      )
      const events: Event[] = []
      const sessions: SessionWithDevice[] = []

      expect(client._cbs.e).toHaveLength(1)

      mockDelivery(client, events, sessions)
      client.setUser('123', 'user@ema.il', 'User Email')
      client.notify(new Error('noooo'))

      expect(events).toHaveLength(1)
      expect(events[0]._user.id).toBe('123')

      client.startSession()

      expect(sessions).toHaveLength(1)
      expect(sessions[0].getUser().id).toBe('123')
    })
  })
})
