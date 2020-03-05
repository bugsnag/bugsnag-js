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

describe('plugin: node device', () => {
  it('should set device = { hostname, runtimeVersions } add an onError callback which adds device time', done => {
    const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin] }, schema)

    expect(client._cbs.sp.length).toBe(1)
    expect(client._cbs.e.length).toBe(1)

    client._setDelivery(client => ({
      sendEvent: (payload) => {
        expect(payload.events[0].device).toBeDefined()
        expect(payload.events[0].device.time instanceof Date).toBe(true)
        expect(payload.events[0].device.hostname).toBe('test-machine.local')
        expect(payload.events[0].device.runtimeVersions).toBeDefined()
        expect(payload.events[0].device.runtimeVersions.node).toEqual(process.versions.node)
        done()
      }
    }))
    client.notify(new Error('noooo'))
  })
})
