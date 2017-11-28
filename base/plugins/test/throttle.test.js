const { describe, it, expect } = global

const plugin = require('../throttle')

const Client = require('../../client')
const config = { ...require('../../config').schema, ...plugin.configSchema }
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: throttle', () => {
  it('prevents more than maxEvents being sent', () => {
    const payloads = []
    const c = new Client(VALID_NOTIFIER, config)
    c.configure({
      apiKey: 'aaaa-aaaa-aaaa-aaaa'
    })
    c.use(plugin)
    c.transport({ sendReport: (logger, config, payload) => payloads.push(payload) })
    for (let i = 0; i < 100; i++) c.notify(new Error('This is fail'))
    expect(payloads.length).toBe(10)
  })
})
