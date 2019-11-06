const { describe, it, expect } = global

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }
const plugin = require('../')

describe('plugin: restify', () => {
  it('exports two middleware functions', () => {
    const c = new Client({ apiKey: 'api_key' }, undefined, VALID_NOTIFIER)
    c.use(plugin)
    const middleware = c.getPlugin('restify')
    expect(typeof middleware.requestHandler).toBe('function')
    expect(middleware.requestHandler.length).toBe(3)
    expect(typeof middleware.errorHandler).toBe('function')
    expect(middleware.errorHandler.length).toBe(4)
  })
})
