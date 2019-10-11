const { describe, it, expect } = global

const plugin = require('../')

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: ip', () => {
  it('does nothing when collectUserIp=true', () => {
    const client = new Client(VALID_NOTIFIER)
    const payloads = []
    client.setOptions({ apiKey: 'API_KEY_YEAH' })
    client.configure()
    client.use(plugin)

    client.delivery(client => ({ sendReport: (payload) => payloads.push(payload) }))
    client.notify(new Error('noooo'), {
      beforeSend: report => { report.request = { 'some': 'detail' } }
    })

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].request).toEqual({ 'some': 'detail' })
  })

  it('doesn’t overwrite an existing user id', () => {
    const client = new Client(VALID_NOTIFIER)
    const payloads = []
    client.setOptions({ apiKey: 'API_KEY_YEAH', collectUserIp: false })
    client.configure()
    client.use(plugin)

    client.user = { id: 'foobar' }

    client.delivery(client => ({ sendReport: (payload) => payloads.push(payload) }))
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].user).toEqual({ id: 'foobar' })
    expect(payloads[0].events[0].request).toEqual({ clientIp: '[NOT COLLECTED]' })
  })

  it('overwrites a user id if it is explicitly `undefined`', () => {
    const client = new Client(VALID_NOTIFIER)
    const payloads = []
    client.setOptions({ apiKey: 'API_KEY_YEAH', collectUserIp: false })
    client.configure()
    client.use(plugin)

    client.user = { id: undefined }

    client.delivery(client => ({ sendReport: (payload) => payloads.push(payload) }))
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].user).toEqual({ id: '[NOT COLLECTED]' })
    expect(payloads[0].events[0].request).toEqual({ clientIp: '[NOT COLLECTED]' })
  })

  it('redacts user IP if none is provided', () => {
    const client = new Client(VALID_NOTIFIER)
    const payloads = []
    client.setOptions({ apiKey: 'API_KEY_YEAH', collectUserIp: false })
    client.configure()
    client.use(plugin)

    client.delivery(client => ({ sendReport: (payload) => payloads.push(payload) }))
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].user).toEqual({ id: '[NOT COLLECTED]' })
    expect(payloads[0].events[0].request).toEqual({ clientIp: '[NOT COLLECTED]' })
  })
})
