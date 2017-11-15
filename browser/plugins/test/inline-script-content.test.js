// magical jasmine globals
const { describe, it, expect } = global

const plugin = require('../inline-script-content')

const Client = require('../../../base/client')
const Report = require('../../../base/report')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: inline script content', () => {
  it('should add a beforeSend callback which captures the HTML content if file=current url', () => {
    const client = new Client(VALID_NOTIFIER)
    const payloads = []
    client.configure({ apiKey: 'API_KEY_YEAH' })
    client.use(plugin)

    expect(client.config.beforeSend.length).toBe(1)
    client.transport({ sendReport: (logger, config, payload) => payloads.push(payload) })
    client.notify(new Report('Bad thing', 'Happens in <script/> tags', [
      { fileName: window.location.href.replace(/#.*$/), lineNumber: 10 }
    ]))
    expect(payloads.length).toEqual(1)
    expect(Object.keys(payloads[0].events[0].stacktrace[0].code).length).toBe(10)
  })
})
