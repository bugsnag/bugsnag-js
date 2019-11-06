const { describe, it, expect, beforeEach } = global

const plugin = require('../')

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

let window

describe('plugin: window onerror', () => {
  beforeEach(() => { window = {} })

  it('should set a window.onerror event handler', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
    client.use(plugin, window)
    expect(typeof window.onerror).toBe('function')
  })

  describe('window.onerror function', () => {
    it('captures uncaught errors in timer callbacks', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
      const payloads = []
      client.use(plugin, window)
      client._delivery(client => ({ sendEvent: (payload) => payloads.push(payload) }))

      window.onerror('Uncaught Error: Bad things', 'foo.js', 10, 20, new Error('Bad things'))

      setTimeout(() => {
        try {
          expect(payloads.length).toBe(1)
          const event = payloads[0].events[0].toJSON()
          expect(event.severity).toBe('error')
          expect(event.unhandled).toBe(true)
          expect(event.severityReason).toEqual({ type: 'unhandledException' })
          done()
        } catch (e) {
          done(e)
        }
      }, 1)
    })
    //
    // it('captures uncaught errors in DOM (level 2) event handlers', done => {
    //   const client = new Client(VALID_NOTIFIER)
    //   const payloads = []
    //   client.setOptions({ apiKey: 'API_KEY_YEAH' })
    //   client.configure()
    //   client.use(plugin, window)
    //   client._delivery({ sendEvent: (payload) => payloads.push(payload) })
    //
    //   window.eval(`
    //     var el = window.document.createElement('BUTTON')
    //     el.onclick = function () { throw new Error('bad button l2') }
    //     window.document.body.appendChild(el)
    //     setTimeout(function () { el.click() }, 0)
    //   `)
    //
    //   try {
    //     expect(payloads.length).toBe(1)
    //     const event = payloads[0].events[0].toJSON()
    //     expect(event.severity).toBe('error')
    //     expect(event.unhandled).toBe(true)
    //     expect(event.severityReason).toEqual({ type: 'unhandledException' })
    //     done()
    //   } catch (e) {
    //     done(e)
    //   }
    // })

    it('calls any previously registered window.onerror callback', done => {
      window.onerror = () => done()

      const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
      const payloads = []
      client.use(plugin, window)
      client._delivery(client => ({ sendEvent: (payload) => payloads.push(payload) }))

      window.onerror('Uncaught Error: Bad things', 'foo.js', 10, 20, new Error('Bad things'))
    })

    it('handles single argument usage of window.onerror', () => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
      const payloads = []
      client.use(plugin, window)
      client._delivery(client => ({ sendEvent: (payload) => payloads.push(payload) }))

      const evt = { type: 'error', detail: 'something bad happened' }
      window.onerror(evt)

      setTimeout(() => {
        expect(payloads.length).toBe(1)
        const event = payloads[0].events[0].toJSON()
        expect(event.severity).toBe('error')
        expect(event.unhandled).toBe(true)
        expect(event.exceptions[0].errorClass).toBe('Event: error')
        expect(event.exceptions[0].message).toBe('something bad happened')
        expect(event.severityReason).toEqual({ type: 'unhandledException' })
      }, 1)
    })

    it('handles single argument usage of window.onerror with extra parameter', () => {
      const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
      const payloads = []
      client.use(plugin, window)
      client._delivery(client => ({ sendEvent: (payload) => payloads.push(payload) }))

      // this situation is caused by the following kind of jQuery call:
      // jQuery('select.province').trigger(jQuery.Event('error.validator.bv'), { valid: false })
      const evt = { type: 'error', detail: 'something bad happened' }
      const extra = { valid: false }
      window.onerror(evt, extra)

      setTimeout(() => {
        expect(payloads.length).toBe(1)
        const event = payloads[0].events[0].toJSON()
        expect(event.severity).toBe('error')
        expect(event.unhandled).toBe(true)
        expect(event.exceptions[0].errorClass).toBe('Event: error')
        expect(event.exceptions[0].message).toBe('something bad happened')
        expect(event.severityReason).toEqual({ type: 'unhandledException' })
      }, 1)
    })

    //
    // if ('addEventListener' in window) {
    //   it('captures uncaught errors in DOM (level 3) event handlers', done => {
    //     const client = new Client(VALID_NOTIFIER)
    //     const payloads = []
    //     client.setOptions({ apiKey: 'API_KEY_YEAH' })
    //     client.configure()
    //     client.use(plugin)
    //     client._delivery({ sendEvent: (payload) => payloads.push(payload) })
    //
    //     const el = document.createElement('BUTTON')
    //     el.addEventListener('click', () => { throw new Error('bad button l3') })
    //     window.document.body.appendChild(el)
    //
    //     setTimeout(() => el.click(), 0)
    //     setTimeout(() => {
    //       try {
    //         expect(payloads.length).toBe(1)
    //         const event = payloads[0].events[0].toJSON()
    //         expect(event.severity).toBe('error')
    //         expect(event.unhandled).toBe(true)
    //         expect(event.severityReason).toEqual({ type: 'unhandledException' })
    //         done()
    //       } catch (e) {
    //         done(e)
    //       }
    //     }, 100)
    //   })
    // }
    //
    // if ('requestAnimationFrame' in window) {
    //   it('captures uncaught errors in requestAnimationFrame callbacks', done => {
    //     const client = new Client(VALID_NOTIFIER)
    //     const payloads = []
    //     client.setOptions({ apiKey: 'API_KEY_YEAH' })
    //     client.configure()
    //     client.use(plugin)
    //     client._delivery({ sendEvent: (payload) => payloads.push(payload) })
    //
    //     window.requestAnimationFrame(() => {
    //       throw new Error('ERR_RAF')
    //     })
    //
    //     window.requestAnimationFrame(() => {
    //       try {
    //         expect(payloads.length).toBe(1)
    //         const event = payloads[0].events[0].toJSON()
    //         expect(event.severity).toBe('error')
    //         expect(event.unhandled).toBe(true)
    //         expect(event.severityReason).toEqual({ type: 'unhandledException' })
    //         done()
    //       } catch (e) {
    //         done(e)
    //       }
    //     })
    //   })
    // }

    it('extracts meaning from non-error values as error messages', function (done) {
      const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
      const payloads = []
      client.use(plugin, window)
      client._delivery(client => ({ sendEvent: (payload) => payloads.push(payload) }))

      // call onerror as it would be when `throw 'hello' is run`
      window.onerror('uncaught exception: hello', '', 0, 0, 'hello')

      setTimeout(() => {
        try {
          expect(payloads.length).toBe(1)
          const event = payloads[0].events[0].toJSON()
          expect(event.exceptions[0].errorClass).toBe('window.onerror')
          expect(event.exceptions[0].message).toMatch(
            /^hello|uncaught hello|exception thrown and not caught|uncaught exception: hello$/i
          )
          expect(event.severity).toBe('error')
          expect(event.unhandled).toBe(true)
          expect(event.severityReason).toEqual({ type: 'unhandledException' })
          done()
        } catch (e) {
          done(e)
        }
      }, 1)
    })

    it('calls a previously installed window.onerror callback', function (done) {
      const args = ['Uncaught Error: derp!', 'http://localhost:4999', 10, 3, new Error('derp!')]
      window.onerror = (messageOrEvent, url, lineNo, charNo, error) => {
        expect(messageOrEvent).toBe(args[0])
        expect(url).toBe(args[1])
        expect(lineNo).toBe(args[2])
        expect(charNo).toBe(args[3])
        expect(error).toBe(args[4])
        setTimeout(() => {
          expect(payloads.length).toBe(1)
          done()
        }, 1)
      }
      const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
      const payloads = []
      client.use(plugin, window)
      client._delivery(client => ({ sendEvent: (payload) => payloads.push(payload) }))

      // call onerror as it would be when `throw 'hello' is run`
      window.onerror(...args)
    })

    it('calls a previously installed window.onerror when a CORS error happens', function (done) {
      const args = ['Script error.', undefined, 0, undefined, undefined]
      window.onerror = (messageOrEvent, url, lineNo, charNo, error) => {
        expect(messageOrEvent).toBe(args[0])
        expect(url).toBe(args[1])
        expect(lineNo).toBe(args[2])
        expect(charNo).toBe(args[3])
        expect(error).toBe(args[4])
        setTimeout(() => {
          expect(payloads.length).toBe(0)
          done()
        }, 1)
      }
      const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
      const payloads = []
      client.use(plugin, window)
      client._delivery(client => ({ sendEvent: (payload) => payloads.push(payload) }))

      // call onerror as it would be when `throw 'hello' is run`
      window.onerror(...args)
    })
  })
})
