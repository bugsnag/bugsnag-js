import plugin from '../device'

import Client, { SessionDeliveryPayload, EventDeliveryPayload } from '@bugsnag/core/client'

const navigator = { language: 'en-GB', userAgent: 'testing browser 1.2.3' } as unknown as Navigator

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
  })
})
