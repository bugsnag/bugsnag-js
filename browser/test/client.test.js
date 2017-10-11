// shim the env for ye olde browsers
require('core-js')

// magical jasmine globals
const { describe, it, expect } = global

const Client = require('../../base/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('client()', () => {
  describe('releaseStage', () => {
    it('can be set via app = { version, releaseStage }', () => {
      const client = new Client(VALID_NOTIFIER)
      const payloads = []
      client.configure({ apiKey: 'API_KEY_YEAH', notifyReleaseStages: [ 'staging' ] })
      client.app = { version: '1.2.3', releaseStage: 'staging' }
      client.transport({ sendReport: (config, payload) => payloads.push(payload) })
      client.notify(new Error('noooo'))
      expect(payloads.length).toEqual(1)
      expect(payloads[0].events[0].app).toEqual({ version: '1.2.3', releaseStage: 'staging' })
    })

    it('allows app.releaseStage to be set', () => {
      const client = new Client(VALID_NOTIFIER)
      const payloads = []
      client.configure({ apiKey: 'API_KEY_YEAH', notifyReleaseStages: [ 'staging' ] })
      client.app.releaseStage = 'staging'
      client.transport({ sendReport: (config, payload) => payloads.push(payload) })
      client.notify(new Error('noooo'))
      expect(payloads.length).toEqual(1)
      expect(payloads[0].events[0].app).toEqual({ releaseStage: 'staging' })
    })

    it('allows app.releaseStage to be set via config', () => {
      const client = new Client(VALID_NOTIFIER)
      const payloads = []
      client.configure({ apiKey: 'API_KEY_YEAH', releaseStage: 'staging', notifyReleaseStages: [ 'staging' ] })
      client.transport({ sendReport: (config, payload) => payloads.push(payload) })
      client.notify(new Error('noooo'))
      expect(payloads.length).toEqual(1)
      expect(payloads[0].events[0].app).toEqual({ releaseStage: 'staging' })
    })
  })

  describe('app version', () => {
    it('can be set via client.app.version', () => {
      const client = new Client(VALID_NOTIFIER)
      const payloads = []
      client.configure({ apiKey: 'API_KEY_YEAH' })
      client.app.version = '1.2.3'
      client.transport({ sendReport: (config, payload) => payloads.push(payload) })
      client.notify(new Error('noooo'))
      expect(payloads.length).toEqual(1)
      expect(payloads[0].events[0].app).toEqual({ version: '1.2.3', releaseStage: 'production' })
    })
  })
})
