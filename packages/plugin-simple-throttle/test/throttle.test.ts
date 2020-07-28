import plugin from '../'

import Client from '@bugsnag/core/client'

describe('plugin: throttle', () => {
  it('prevents more than maxEvents being sent', () => {
    const payloads = []
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' }, undefined, [plugin])
    c._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))
    for (let i = 0; i < 100; i++) c.notify(new Error('This is fail'))
    expect(payloads.length).toBe(10)
  })
})
