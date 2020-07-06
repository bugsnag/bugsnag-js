import plugin from '../device'

import Client, { SessionDeliveryPayload, EventDeliveryPayload } from '@bugsnag/core/client'

const navigator = { language: 'en-GB', userAgent: 'testing browser 1.2.3' } as unknown as Navigator
const screen = { orientation: { type: 'landscape-primary' } } as unknown as Screen

describe('plugin: device', () => {
  it('should add an onError callback which captures device information', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin(navigator)] })
    const payloads: EventDeliveryPayload[] = []

    expect(client._cbs.e.length).toBe(1)

    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].device).toBeDefined()
    expect(payloads[0].events[0].device.time instanceof Date).toBe(true)
    expect(payloads[0].events[0].device.locale).toBe(navigator.language)
    expect(payloads[0].events[0].device.userAgent).toBe(navigator.userAgent)
    expect(payloads[0].events[0].device.orientation).toBe('portrait')
  })

  it('should capture the screen orientation if possible and add it to the event', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin(navigator, screen)] })
    const payloads: EventDeliveryPayload[] = []

    expect(client._cbs.e.length).toBe(1)

    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].device).toBeDefined()
    expect(payloads[0].events[0].device.time instanceof Date).toBe(true)
    expect(payloads[0].events[0].device.locale).toBe(navigator.language)
    expect(payloads[0].events[0].device.userAgent).toBe(navigator.userAgent)
    expect(payloads[0].events[0].device.orientation).toBe('landscape-primary')
  })

  it('should add an onSession callback which captures device information', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin(navigator)] })
    const payloads: SessionDeliveryPayload[] = []
    client._sessionDelegate = {
      startSession: (client, session) => {
        client._delivery.sendSession(session, () => {})
      }
    }

    expect(client._cbs.s.length).toBe(1)

    client._setDelivery(client => ({ sendEvent: () => {}, sendSession: (payload) => payloads.push(payload) }))
    client.startSession()

    expect(payloads.length).toEqual(1)
    expect(payloads[0].device).toBeDefined()
    expect(payloads[0].device && payloads[0].device.locale).toBe(navigator.language)
    expect(payloads[0].device && payloads[0].device.userAgent).toBe(navigator.userAgent)
    expect(payloads[0].device && payloads[0].device.orientation).toBe('portrait')
  })

  it('should capture the screen orientation if possible and add it to the session', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin(navigator, screen)] })
    const payloads: SessionDeliveryPayload[] = []
    client._sessionDelegate = {
      startSession: (client, session) => {
        client._delivery.sendSession(session, () => {})
      }
    }

    expect(client._cbs.s.length).toBe(1)

    client._setDelivery(client => ({ sendEvent: () => {}, sendSession: (payload) => payloads.push(payload) }))
    client.startSession()

    expect(payloads.length).toEqual(1)
    expect(payloads[0].device).toBeDefined()
    expect(payloads[0].device && payloads[0].device.locale).toBe(navigator.language)
    expect(payloads[0].device && payloads[0].device.userAgent).toBe(navigator.userAgent)
    expect(payloads[0].device && payloads[0].device.orientation).toBe('landscape-primary')
  })
})
