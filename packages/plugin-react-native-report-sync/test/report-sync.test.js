/* global describe, it, expect */

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }
const proxyquire = require('proxyquire').noCallThru()

describe('plugin: react native report sync', () => {
  const plugin = proxyquire('../', {
    'react-native': {
      Platform: { OS: 'Android' },
      DeviceEventEmitter: { addListener: () => {} }
    }
  })

  it('updates report state with native payload info', done => {
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'api_key' })
    c.configure()
    c.use(plugin, {
      getPayloadInfo: async () => {
        return {
          device: { osName: 'android', brand: 'google' },
          app: { versionName: '1.0' }
        }
      }
    })
    c.notify(new Error('blah'), (report) => {
      expect(report.get('device', 'osName')).toBe('android')
      expect(report.get('app', 'versionName')).toBe('1.0')
      done()
    })
  })
})
