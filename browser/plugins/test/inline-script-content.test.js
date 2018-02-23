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
    expect(payloads[0].events[0].stacktrace[0].code).toBeDefined()
    expect(payloads[0].events[0].metaData.script).toBeDefined()
    expect(payloads[0].events[0].metaData.script.content).toBeDefined()
  })

  it('should find scripts content successfully', () => {
    const a = plugin.extractScriptContent([
      'some stuff before script',
      '<script>',
      '',
      '// hello just',
      '// some js here',
      '1 + 2 + 3',
      '',
      '</script>'
    ], 4)
    expect(a.script.length).toBe(7)
    expect(a.start).toBe(1)

    const b = plugin.extractScriptContent([
      'some stuff before script',
      '<script>',
      '1+1+1+1',
      'what(function () {',
      '  1>2',
      '  func()',
      '})',
      '</script>',
      'some stuff after script'
    ], 4)
    expect(b.script.length).toBe(7)
    expect(b.start).toBe(1)

    const c = plugin.extractScriptContent([
      'some stuff before script',
      '<script nonce="1cd2dsf312gfd31dfg23">',
      '1+1+1+1',
      'what(function () {',
      '  1>2',
      '  func()',
      '})',
      '</script>',
      'some stuff after script'
    ], 4)
    expect(c.script.length).toBe(7)
    expect(c.start).toBe(1)
  })
})
