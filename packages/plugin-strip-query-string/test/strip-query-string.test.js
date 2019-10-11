const { describe, it, expect } = global

const plugin = require('../')

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: strip query string', () => {
  it('should strip querystrings and fragments from urls', () => {
    expect(
      plugin._strip('https://bath.tub.xyz/assets/js/app.js?id=49c3ad475f69072745e3')
    ).toBe('https://bath.tub.xyz/assets/js/app.js')
    expect(
      plugin._strip('http://bath.tub.xyz/assets/js/app.js#nmfrz')
    ).toBe('http://bath.tub.xyz/assets/js/app.js')
    expect(
      plugin._strip('http://bath.tub.xyz:8808/assets/js/app.js#nmfrz')
    ).toBe('http://bath.tub.xyz:8808/assets/js/app.js')
    expect(
      plugin._strip('http://bath.tub.xyz:8808/assets/js/app.js?id=49c3ad475f69072745e3&name=bob#nmfrz')
    ).toBe('http://bath.tub.xyz:8808/assets/js/app.js')
  })

  it('should leave non-urls alone', () => {
    expect(plugin._strip('global code')).toBe('global code')
    expect(plugin._strip('(native)')).toBe('(native)')
    expect(
      'webpack:///../react-hot-loader/~/react-proxy/modules/createClassProxy.js?'
    ).toBe(
      'webpack:///../react-hot-loader/~/react-proxy/modules/createClassProxy.js?'
    )
  })

  it('runs the strip beforeSend callback without errors', () => {
    const client = new Client(VALID_NOTIFIER)
    const payloads = []
    let originalStacktrace
    client.setOptions({
      apiKey: 'API_KEY_YEAH',
      beforeSend: report => {
        originalStacktrace = report.stacktrace.map(f => f)
      }
    })
    client.configure()
    client.use(plugin)

    client.delivery(client => ({ sendReport: (payload) => payloads.push(payload) }))
    const err = new Error('noooo')
    err.stack = 'Error: foo\n  at page.html?id=intro:89:10'
    client.notify(err)

    expect(
      originalStacktrace[0].file.indexOf(payloads[0].events[0].stacktrace[0].file)
    ).toEqual(0)
    expect(
      payloads[0].events[0].stacktrace[0].file.length < originalStacktrace[0].file.length
    ).toBe(true)
    expect(
      /\?/.test(payloads[0].events[0].stacktrace[0].file)
    ).toBe(false)
  })
})
