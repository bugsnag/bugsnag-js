/* global describe, it, expect */

const plugin = require('../')

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

const MockErrorUtils = {}

describe('plugin: react native global error handler', () => {
  it('should set a floop flop', () => {
    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'API_KEY_YEAH' })
    client.configure()
    client.use(plugin, MockErrorUtils)
  })
})
