const { describe, it, expect } = global

const plugin = require('../')

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: throttle', () => {
  it('prevents more than maxEvents being sent', () => {
    const payloads = []
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' }, undefined, VALID_NOTIFIER)
    c.use(plugin)
    c._delivery(client => ({
      sendEvent: (payload, cb) => {
        payloads.push(payload)
        cb()
      }
    }))
    for (let i = 0; i < 100; i++) c.notify(new Error('This is fail'))
    setTimeout(() => expect(payloads.length).toBe(10), 1)
  })
})
