import plugin from '../src/context'

import { Client, EventDeliveryPayload } from '@bugsnag/core'

const window = {
  location: {
    pathname: '/test-page.html'
  }
} as unknown as Window & typeof globalThis

describe('plugin: context', () => {
  it('sets client.context (and event.context) to window.location.pathname', done => {
    const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, [plugin(window)])
    const payloads: EventDeliveryPayload[] = []

    client._setDelivery(client => ({
      sendEvent: (payload, cb) => {
        payloads.push(payload)
        cb()
      },
      sendSession: () => {}

    }))

    let eventContext: string | undefined
    client.notify(new Error('noooo'), (event) => {
      eventContext = event.context
    }, () => {
      expect(eventContext).toBe(window.location.pathname)
      expect(payloads.length).toEqual(1)
      expect(payloads[0].events[0].context).toBe(window.location.pathname)
      done()
    })
  })

  it('sets doesn’t overwrite an existing context', done => {
    expect.assertions(3)
    const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, [plugin(window)])
    const payloads: EventDeliveryPayload[] = []

    client.setContext('something else')

    client._setDelivery(client => ({
      sendEvent: (payload, cb) => {
        payloads.push(payload)
        cb()
      },
      sendSession: () => {}
    }))
    client.notify(new Error('noooo'), (event) => {
      expect(event.context).toBe('something else')
    }, () => {
      expect(payloads.length).toEqual(1)
      expect(payloads[0].events[0].context).toBe('something else')
      done()
    })
  })
})
