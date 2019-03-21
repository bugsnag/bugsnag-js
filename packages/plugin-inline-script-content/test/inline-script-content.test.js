const { describe, it, expect } = global

const plugin = require('../')

const Client = require('@bugsnag/core/client')
const Report = require('@bugsnag/core/report')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: inline script content', () => {
  it('should add a beforeSend callback which captures the HTML content if file=current url', () => {
    const document = {
      documentElement: {
        outerHTML: `<p>
Lorem ipsum dolor sit amet.
Lorem ipsum dolor sit amet.
Lorem ipsum dolor sit amet.
</p>
<script>
  function BadThing() {
    Error.apply(this, args)
  }
  BadThing.prototype = Object.create(Error.prototype)
  bugsnagClient.notify(new BadThing('Happens in script tags'))
</script>
<p>more content</p>`
      }
    }
    const window = { location: { href: 'https://app.bugsnag.com/errors' } }

    const client = new Client(VALID_NOTIFIER)
    const payloads = []
    client.setOptions({ apiKey: 'API_KEY_YEAH' })
    client.configure()
    client.use(plugin, document, window)

    expect(client.config.beforeSend.length).toBe(1)
    client.delivery(client => ({ sendReport: (payload) => payloads.push(payload) }))
    client.notify(new Report('BadThing', 'Happens in script tags', [
      { fileName: window.location.href.replace(/#.*$/), lineNumber: 10 }
    ]))
    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].stacktrace[0].code).toBeDefined()
    expect(payloads[0].events[0].metaData.script).toBeDefined()
    expect(payloads[0].events[0].metaData.script.content).toEqual(`
  function BadThing() {
    Error.apply(this, args)
  }
  BadThing.prototype = Object.create(Error.prototype)
  bugsnagClient.notify(new BadThing('Happens in script tags'))
`)
  })

  it('calls the previous onreadystatechange handler if it exists', done => {
    const prevHandler = () => { done() }
    const document = { documentElement: { outerHTML: '' }, onreadystatechange: prevHandler }
    const window = { location: { href: 'https://app.bugsnag.com/errors' }, document }
    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'API_KEY_YEAH' })
    client.configure()
    client.use(plugin, document, window)
    // check it installed a new onreadystatechange handler
    expect(document.onreadystatechange === prevHandler).toBe(false)
    // now check it calls the previous one
    document.onreadystatechange()
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
