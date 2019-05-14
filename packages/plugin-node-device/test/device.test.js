const { describe, it, expect } = global

const plugin = require('../device')

const Client = require('@bugsnag/core/client')
const schema = {
  ...require('@bugsnag/core/config').schema,
  hostname: {
    defaultValue: () => 'test-machine.local',
    validate: () => true,
    message: 'should be a string'
  }
}
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }
const ISO_8601 = /^\d{4}(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?)?)?)?$/i

describe('plugin: node device', () => {
  it('should set device = { hostname } and add a beforeSend callback which adds device time', done => {
    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'API_KEY_YEAH' })
    client.configure(schema)
    client.use(plugin)

    expect(client.config.beforeSend.length).toBe(1)
    expect(client.device.hostname).toBe('test-machine.local')

    client.delivery(client => ({
      sendReport: (payload) => {
        expect(payload.events[0].device).toBeDefined()
        expect(payload.events[0].device.time).toMatch(ISO_8601)
        done()
      }
    }))
    client.notify(new Error('noooo'))
  })

  it('should attach the process.versions hash', done => {
    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'API_KEY_YEAH' })
    client.configure(schema)
    client.use(plugin)

    client.delivery(client => ({
      sendReport: (payload) => {
        expect(payload.events[0].metaData.device.runtimeVersions).toEqual(process.versions)
        done()
      }
    }))
    client.notify(new Error('noooo'))
  })
})
