const { describe, it, expect } = global

const plugin = require('../')

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: throttle', () => {
  it('prevents more than maxEvents being sent', () => {
    const payloads = []
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({
      apiKey: 'aaaa-aaaa-aaaa-aaaa'
    })
    c.configure()
    c.use(plugin)
    c.delivery(client => ({ sendReport: (payload) => payloads.push(payload) }))
    for (let i = 0; i < 100; i++) c.notify(new Error('This is fail'))
    expect(payloads.length).toBe(10)
  })
})
