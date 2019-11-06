const { describe, it, expect } = global

const plugin = require('../')

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: ip', () => {
  it('does nothing when collectUserIp=true', done => {
    const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
    const payloads = []
    client.use(plugin)

    client._delivery(client => ({
      sendEvent: (payload, cb) => {
        payloads.push(payload)
        cb()
      }
    }))
    client.notify(new Error('noooo'), event => { event.request = { some: 'detail' } }, () => {
      expect(payloads.length).toEqual(1)
      expect(payloads[0].events[0].request).toEqual({ some: 'detail' })
      done()
    })
  })

  it('doesn’t overwrite an existing user id', done => {
    const client = new Client({ apiKey: 'API_KEY_YEAH', collectUserIp: false }, undefined, VALID_NOTIFIER)
    const payloads = []
    client.use(plugin)

    client.setUser('foobar')

    client._delivery(client => ({
      sendEvent: (payload, cb) => {
        payloads.push(payload)
        cb()
      }
    }))
    client.notify(new Error('noooo'), () => {}, () => {
      expect(payloads.length).toEqual(1)
      expect(payloads[0].events[0]._user).toEqual({ id: 'foobar', name: undefined, email: undefined })
      expect(payloads[0].events[0].request).toEqual({ clientIp: '[REDACTED]' })
      done()
    })
  })

  it('overwrites a user id if it is explicitly `undefined`', done => {
    const client = new Client({ apiKey: 'API_KEY_YEAH', collectUserIp: false }, undefined, VALID_NOTIFIER)
    const payloads = []
    client.use(plugin)

    client.setUser(undefined)

    client._delivery(client => ({
      sendEvent: (payload, cb) => {
        payloads.push(payload)
        cb()
      }
    }))
    client.notify(new Error('noooo'), () => {}, () => {
      expect(payloads.length).toEqual(1)
      expect(payloads[0].events[0]._user).toEqual({ id: '[REDACTED]', name: undefined, email: undefined })
      expect(payloads[0].events[0].request).toEqual({ clientIp: '[REDACTED]' })
      done()
    })
  })

  it('redacts user IP if none is provided', done => {
    const client = new Client({ apiKey: 'API_KEY_YEAH', collectUserIp: false }, undefined, VALID_NOTIFIER)
    const payloads = []
    client.use(plugin)

    client._delivery(client => ({
      sendEvent: (payload, cb) => {
        payloads.push(payload)
        cb()
      }
    }))
    client.notify(new Error('noooo'), () => {}, () => {
      expect(payloads.length).toEqual(1)
      expect(payloads[0].events[0]._user).toEqual({ id: '[REDACTED]' })
      expect(payloads[0].events[0].request).toEqual({ clientIp: '[REDACTED]' })
      done()
    })
  })
})
