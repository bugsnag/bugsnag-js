// magical jasmine globals
const { describe, it, expect } = global

const plugin = require('../ip')

const Client = require('../../../base/client')
const schema = { ...require('../../../base/config').schema, ...require('../../config') }
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: ip', () => {
  it('does nothing when collectUserIp=true', () => {
    const client = new Client(VALID_NOTIFIER, schema)
    const payloads = []
    client.configure({ apiKey: 'API_KEY_YEAH' })
    client.use(plugin)

    client.transport({ sendReport: (logger, config, payload) => payloads.push(payload) })
    client.notify(new Error('noooo'), {
      beforeSend: report => { report.request = { 'some': 'detail' } }
    })

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].request).toEqual({ 'some': 'detail' })
  })

  it('doesn’t overwrite an existing user id', () => {
    const client = new Client(VALID_NOTIFIER, schema)
    const payloads = []
    client.configure({ apiKey: 'API_KEY_YEAH', collectUserIp: false })
    client.use(plugin)

    client.user = { id: 'foobar' }

    client.transport({ sendReport: (logger, config, payload) => payloads.push(payload) })
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].user).toEqual({ id: 'foobar' })
    expect(payloads[0].events[0].request).toEqual({ clientIp: '[NOT COLLECTED]' })
  })

  it('redacts user IP if none is provided', () => {
    const client = new Client(VALID_NOTIFIER, schema)
    const payloads = []
    client.configure({ apiKey: 'API_KEY_YEAH', collectUserIp: false })
    client.use(plugin)

    client.transport({ sendReport: (logger, config, payload) => payloads.push(payload) })
    client.notify(new Error('noooo'))

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].user).toEqual({ id: '[NOT COLLECTED]' })
    expect(payloads[0].events[0].request).toEqual({ clientIp: '[NOT COLLECTED]' })
  })
})
