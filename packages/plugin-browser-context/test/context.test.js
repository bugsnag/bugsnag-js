const { describe, it, expect } = global

const plugin = require('../')

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

const window = {
  location: {
    pathname: '/test-page.html'
  }
}

describe('plugin: context', () => {
  it('sets event.context to window.location.pathname', done => {
    const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
    const payloads = []
    client.use(plugin, window)

    client._delivery(client => ({ sendEvent: (payload, cb) => { payloads.push(payload); cb() } }))
    client.notify(new Error('noooo'), () => {}, () => {
      expect(payloads.length).toEqual(1)
      expect(payloads[0].events[0]._context).toBe(window.location.pathname)
      done()
    })
  })

  it('sets doesn’t overwrite an existing context', done => {
    const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
    const payloads = []
    client.use(plugin, window)

    client.setContext('something else')

    client._delivery(client => ({ sendEvent: (payload, cb) => { payloads.push(payload); cb() } }))
    client.notify(new Error('noooo'), () => {}, () => {
      expect(payloads.length).toEqual(1)
      expect(payloads[0].events[0]._context).toBe('something else')
      done()
    })
  })
})
