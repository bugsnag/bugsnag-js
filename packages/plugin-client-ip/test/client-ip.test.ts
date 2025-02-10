import plugin from '../'

import type { EventDeliveryPayload } from '@bugsnag/core/client'
import { Client } from '@bugsnag/core'

describe('plugin: ip', () => {
  it('does nothing when collectUserIp=true', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, [plugin])
    const payloads: EventDeliveryPayload[] = []

    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))
    client.notify(new Error('noooo'), event => { event.request = { some: 'detail' } })

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].request).toEqual({ some: 'detail' })
  })

  it('doesn’t overwrite an existing user id', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH', collectUserIp: false }, undefined, [plugin])
    const payloads: EventDeliveryPayload[] = []

    client._user = { id: 'foobar' }

    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0]._user).toEqual({ id: 'foobar' })
    expect(payloads[0].events[0].request).toEqual({ clientIp: '[REDACTED]' })
  })

  it('overwrites a user id if it is explicitly `undefined`', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH', collectUserIp: false }, undefined, [plugin])
    const payloads: EventDeliveryPayload[] = []

    client._user = { id: undefined }

    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0]._user).toEqual({ id: '[REDACTED]' })
    expect(payloads[0].events[0].request).toEqual({ clientIp: '[REDACTED]' })
  })

  it('redacts user IP if none is provided', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH', collectUserIp: false }, undefined, [plugin])
    const payloads: EventDeliveryPayload[] = []

    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0]._user).toEqual({ id: '[REDACTED]' })
    expect(payloads[0].events[0].request).toEqual({ clientIp: '[REDACTED]' })
  })
})
