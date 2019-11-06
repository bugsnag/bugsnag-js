const { describe, it, expect } = global

const plugin = require('../')

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

const window = { location: { href: 'http://xyz.abc/foo/bar.html' } }

describe('plugin: request', () => {
  it('sets report.request to window.location.href', done => {
    const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
    const payloads = []
    client.use(plugin, window)

    client._delivery(client => ({
      sendEvent: (payload, cb) => {
        payloads.push(payload)
        cb()
      }
    }))
    client.notify(new Error('noooo'), () => {}, () => {
      expect(payloads.length).toEqual(1)
      expect(payloads[0].events[0].request).toEqual({ url: window.location.href })
      done()
    })
  })
})
