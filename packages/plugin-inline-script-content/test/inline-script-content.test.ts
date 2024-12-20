import plugin from '../inline-script-content'

import Client from '@bugsnag/core/client'
import Event from '@bugsnag/core/event'

describe('plugin: inline script content', () => {
  it('should add an onError callback which captures the HTML content if file=current url', () => {
    const scriptContent = `function BadThing() {
  Error.apply(this, args)
}
BadThing.prototype = Object.create(Error.prototype)
bugsnagClient.notify(new BadThing('Happens in script tags'))`
    const document = {
      scripts: [{ innerHTML: scriptContent }],
      currentScript: { innerHTML: scriptContent },
      documentElement: {
        outerHTML: `<p>
Lorem ipsum dolor sit amet.
Lorem ipsum dolor sit amet.
Lorem ipsum dolor sit amet.
</p>
<script>${scriptContent}
</script>
<p>more content</p>`
      }
    } as unknown as Document
    const window = { location: { href: 'https://app.bugsnag.com/errors' } } as unknown as Window &typeof globalThis

    const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, [plugin(document, window)])
    const payloads = []

    expect(client._cbs.e.length).toBe(1)
    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))
    client._notify(new Event('BadThing', 'Happens in script tags', [
      { fileName: window.location.href, lineNumber: 10 }
    ]))
    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].errors[0].stacktrace[0].code).toBeDefined()
    expect(payloads[0].events[0]._metadata.script).toBeDefined()
    expect(payloads[0].events[0]._metadata.script.content).toEqual(scriptContent)
  })

  it('calls the previous onreadystatechange handler if it exists', done => {
    const prevHandler = () => { done() }
    const document = { documentElement: { outerHTML: '' }, onreadystatechange: prevHandler } as unknown as Document
    const window = { location: { href: 'https://app.bugsnag.com/errors' }, document } as unknown as Window &typeof globalThis
    const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, [plugin(document, window)])
    // check it installed a new onreadystatechange handler
    expect(document.onreadystatechange === prevHandler).toBe(false)
    // now check it calls the previous one
    document.onreadystatechange({} as unknown as globalThis.Event)
    expect(client).toBe(client)
  })

  it('does no wrapping of global functions when disabled', () => {
    const document = { documentElement: { outerHTML: '' } } as unknown as Document
    const addEventListener = function () {}
    const window = { location: { href: 'https://app.bugsnag.com/errors' }, document } as unknown as Window &typeof globalThis
    function EventTarget () {}
    EventTarget.prototype.addEventListener = addEventListener
    // @ts-ignore
    window.EventTarget = EventTarget
    const client = new Client({ apiKey: 'API_KEY_YEAH', trackInlineScripts: false }, undefined, [plugin(document, window)])
    // check the addEventListener function was not wrapped
    expect(window.EventTarget.prototype.addEventListener).toBe(addEventListener)
    expect(client).toBe(client)
  })

  it('truncates script content to a reasonable length', () => {
    let scriptContent = ''
    for (let i = 0; i < 10000; i++) {
      scriptContent += `function fn_${i} (arg0, arg1, arg2) {\n`
      scriptContent += '  console.log(\'this is an awfully long inline script!\')\n'
      scriptContent += '}\n'
    }
    expect(scriptContent.length > 500000).toBe(true)
    const document = {
      scripts: [{ innerHTML: scriptContent }],
      currentScript: { innerHTML: scriptContent },
      documentElement: {
        outerHTML: `<p>
Lorem ipsum dolor sit amet.
Lorem ipsum dolor sit amet.
Lorem ipsum dolor sit amet.
</p>
<script>${scriptContent}
</script>
<p>more content</p>`
      }
    } as unknown as Document
    const window = { location: { href: 'https://app.bugsnag.com/errors' } } as unknown as Window &typeof globalThis

    const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, [plugin(document, window)])
    const payloads = []

    expect(client._cbs.e.length).toBe(1)
    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))
    client._notify(new Event('BadThing', 'Happens in script tags', [
      { fileName: window.location.href, lineNumber: 10 }
    ]))
    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].errors[0].stacktrace[0].code).toBeDefined()
    expect(payloads[0].events[0]._metadata.script).toBeDefined()
    expect(payloads[0].events[0]._metadata.script.content.length).toBe(500000)
  })

  it('truncates surrounding code lines to a reasonable length', () => {
    const longMessage = Array(1000).fill('jim').join(',')
    const scriptContent = `function fn (arg0, arg1, arg2) {
  console.log('${longMessage}')
}`
    expect(longMessage.length > 200).toBe(true)
    const document = {
      scripts: [{ innerHTML: scriptContent }],
      currentScript: { innerHTML: scriptContent },
      documentElement: {
        outerHTML: `<p>
Lorem ipsum dolor sit amet.
Lorem ipsum dolor sit amet.
Lorem ipsum dolor sit amet.
</p>
<script>${scriptContent}
</script>
<p>more content</p>`
      }
    } as unknown as Document
    const window = { location: { href: 'https://app.bugsnag.com/errors' } } as unknown as Window &typeof globalThis

    const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, [plugin(document, window)])
    const payloads = []

    expect(client._cbs.e.length).toBe(1)
    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))
    client._notify(new Event('BadThing', 'Happens in script tags', [
      { fileName: window.location.href, lineNumber: 7 }
    ]))
    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].errors[0].stacktrace[0].code).toBeDefined()
    const surroundingCode = payloads[0].events[0].errors[0].stacktrace[0].code
    Object.keys(surroundingCode).forEach(line => {
      expect(surroundingCode[line].length > 200).toBe(false)
    })
    expect(payloads[0].events[0]._metadata.script).toBeDefined()
  })

  it('works when the stacktrace is empty', () => {
    const scriptContent = 'console.log("EMPTY")'
    const document = {
      scripts: [{ innerHTML: scriptContent }],
      currentScript: { innerHTML: scriptContent },
      documentElement: {
        outerHTML: `<p>
Lorem ipsum dolor sit amet.
Lorem ipsum dolor sit amet.
Lorem ipsum dolor sit amet.
</p>
<script>${scriptContent}
</script>
<p>more content</p>`
      }
    } as unknown as Document
    const window = { location: { href: 'https://app.bugsnag.com/errors' } } as unknown as Window &typeof globalThis

    const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, [plugin(document, window)])
    const payloads = []

    expect(client._cbs.e.length).toBe(1)
    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))
    const spy = jest.spyOn(client._logger, 'error')
    client._notify(new Event('EmptyStacktrace', 'Has nothing in it', []))
    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].errors[0].stacktrace).toEqual([])
    expect(spy).toHaveBeenCalledTimes(0)
  })

  it('calls removeEventListener with wrapped and unwrapped callback', () => {
    const scriptContent = 'console.log("unwrapped")'
    const document = {
      scripts: [{ innerHTML: scriptContent }],
      currentScript: { innerHTML: scriptContent },
      documentElement: {
        outerHTML: `<p>
Lorem ipsum dolor sit amet.
Lorem ipsum dolor sit amet.
Lorem ipsum dolor sit amet.
</p>
<script>${scriptContent}
</script>
<p>more content</p>`
      }
    } as unknown as Document
    function Window () {}
    Window.prototype = {
      addEventListener: function () {},
      removeEventListener: function () {}
    }
    const window = {
      location: { href: 'https://app.bugsnag.com/errors' }
    } as unknown as Window &typeof globalThis

    Object.setPrototypeOf(window, Window.prototype)
    // @ts-ignore
    window.Window = Window

    function myfun () {}
    window.addEventListener('click', myfun)

    const spy = jest.spyOn(Window.prototype, 'removeEventListener')
    const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, [plugin(document, window)])

    window.removeEventListener('click', myfun)
    expect(spy).toHaveBeenCalledTimes(2)
    expect(client).toBe(client)
  })

  it('gets the correct line numbers for errors at the start of the document', () => {
    const scriptContent = 'throw new Error(\'oh\')\nconsole.log(\'next\')'
    const document = {
      scripts: [{ innerHTML: scriptContent }],
      currentScript: { innerHTML: scriptContent },
      documentElement: {
        outerHTML: `<script>${scriptContent}</script>`
      }
    } as unknown as Document
    const window = { location: { href: 'https://app.bugsnag.com/errors' } } as unknown as Window &typeof globalThis

    const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, [plugin(document, window)])
    const payloads = []

    expect(client._cbs.e.length).toBe(1)
    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))
    client._notify(new Event('Error', 'oh', [
      { fileName: window.location.href, lineNumber: 1 }
    ]))
    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].errors[0].stacktrace[0].code).toEqual({
      1: '<!-- DOC START -->',
      2: '<script>throw new Error(\'oh\')',
      3: 'console.log(\'next\')</script>'
    })
    expect(payloads[0].events[0]._metadata.script).toBeDefined()
    expect(payloads[0].events[0]._metadata.script.content).toEqual(scriptContent)
  })

  it('doesn’t add a "script" tab to errors with no stacktrace when currentScript=null', () => {
    const scriptContent = 'throw new Error(\'oh\')\nconsole.log(\'next\')'
    const document = {
      scripts: [{ innerHTML: scriptContent }],
      currentScript: null,
      documentElement: {
        outerHTML: `<script>${scriptContent}</script>`
      }
    } as unknown as Document
    const window = { location: { href: 'https://app.bugsnag.com/errors' } } as unknown as Window &typeof globalThis

    const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, [plugin(document, window)])
    const payloads = []

    expect(client._cbs.e.length).toBe(1)
    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))
    client._notify(new Event('Error', 'oh', []))
    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0]._metadata.script).not.toBeDefined()
  })
})
