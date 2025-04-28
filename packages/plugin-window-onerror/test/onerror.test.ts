/* eslint-disable jest/no-commented-out-tests */

import plugin from '../src/onerror'

import { Client } from '@bugsnag/core'

type EnhancedWindow = Window & typeof globalThis & { onerror: OnErrorEventHandlerNonNull }

let window: EnhancedWindow

describe('plugin: window onerror', () => {
  beforeEach(() => { window = {} as unknown as EnhancedWindow })

  it('should set a window.onerror event handler', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin(window)] })
    expect(typeof window.onerror).toBe('function')
    expect(client).toBe(client)
  })

  it('should not add a window.onerror event handler when autoDetectErrors=false', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH', autoDetectErrors: false, plugins: [plugin(window)] })
    expect(window.onerror).toBe(undefined)
    expect(client).toBe(client)
  })

  it('should not add a window.onerror event handler when enabledErrorTypes.unhandledExceptions=false', () => {
    const client = new Client({
      apiKey: 'API_KEY_YEAH',
      enabledErrorTypes: {
        unhandledExceptions: false,
        unhandledRejections: false
      },
      plugins: [plugin(window)]
    })
    expect(window.onerror).toBe(undefined)
    expect(client).toBe(client)
  })

  it('accepts a component as the second argument', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin(window, 'test onerror')] })
    const payloads: EventDeliveryPayload[] = []
    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))

    const evt = { type: 'error', detail: 'something bad happened' } as unknown as Event
    window.onerror(evt)

    expect(payloads.length).toBe(1)
    const event = payloads[0].events[0].toJSON()
    expect(event.metaData['window onerror']).toBeUndefined()
    expect(event.metaData['test onerror']).toBeDefined()
  })

  describe('window.onerror function', () => {
    it('captures uncaught errors in timer callbacks', done => {
      const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin(window)] })
      const payloads: EventDeliveryPayload[] = []
      client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))

      window.onerror('Uncaught Error: Bad things', 'foo.js', 10, 20, new Error('Bad things'))

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
    })
    //
    // it('captures uncaught errors in DOM (level 2) event handlers', done => {
    //   const client = new Client(VALID_NOTIFIER)
    //   const payloads = []
    //   client.setOptions({ apiKey: 'API_KEY_YEAH' })
    //   client.configure()
    //   client.use(plugin, window)
    //   client.delivery({ sendEvent: (payload) => payloads.push(payload) })
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

    // eslint-disable-next-line jest/expect-expect
    it('calls any previously registered window.onerror callback', done => {
      window.onerror = () => done()

      const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin(window)] })
      const payloads: EventDeliveryPayload[] = []
      client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))

      window.onerror('Uncaught Error: Bad things', 'foo.js', 10, 20, new Error('Bad things'))
    })

    it('handles single argument usage of window.onerror', () => {
      const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin(window)] })
      const payloads: EventDeliveryPayload[] = []
      client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))

      const evt = { type: 'error', detail: 'something bad happened' } as unknown as Event
      window.onerror(evt)

      expect(payloads.length).toBe(1)
      const event = payloads[0].events[0].toJSON()
      expect(event.severity).toBe('error')
      expect(event.unhandled).toBe(true)
      expect(event.exceptions[0].errorClass).toBe('Event: error')
      expect(event.exceptions[0].message).toBe('something bad happened')
      expect(event.severityReason).toEqual({ type: 'unhandledException' })
    })

    it('handles single argument usage of window.onerror with extra parameter', () => {
      const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin(window)] })
      const payloads: EventDeliveryPayload[] = []

      client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))

      // this situation is caused by the following kind of jQuery call:
      // jQuery('select.province').trigger(jQuery.Event('error.validator.bv'), { valid: false })
      const evt = { type: 'error', detail: 'something bad happened' } as unknown as Event
      const extra = { valid: false }
      window.onerror(evt, extra as any)

      expect(payloads.length).toBe(1)
      const event = payloads[0].events[0].toJSON()
      expect(event.severity).toBe('error')
      expect(event.unhandled).toBe(true)
      expect(event.exceptions[0].errorClass).toBe('Event: error')
      expect(event.exceptions[0].message).toBe('something bad happened')
      expect(event.severityReason).toEqual({ type: 'unhandledException' })
    })

    //
    // if ('addEventListener' in window) {
    //   it('captures uncaught errors in DOM (level 3) event handlers', done => {
    //     const client = new Client(VALID_NOTIFIER)
    //     const payloads = []
    //     client.setOptions({ apiKey: 'API_KEY_YEAH' })
    //     client.configure()
    //     client.use(plugin)
    //     client.delivery({ sendEvent: (payload) => payloads.push(payload) })
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
    //     client.delivery({ sendEvent: (payload) => payloads.push(payload) })
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
      const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin(window)] })
      const payloads: EventDeliveryPayload[] = []

      client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))

      // call onerror as it would be when `throw 'hello' is run`
      // @ts-expect-error
      window.onerror('uncaught exception: hello', '', 0, 0, 'hello')

      try {
        expect(payloads.length).toBe(1)
        const event = payloads[0].events[0].toJSON()
        expect(event.exceptions[0].errorClass).toBe('Error')
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
    })

    it('calls a previously installed window.onerror callback', function (done) {
      const args = ['Uncaught Error: derp!', 'http://localhost:4999', 10, 3, new Error('derp!')] as const
      window.onerror = (messageOrEvent, url, lineNo, charNo, error) => {
        expect(messageOrEvent).toBe(args[0])
        expect(url).toBe(args[1])
        expect(lineNo).toBe(args[2])
        expect(charNo).toBe(args[3])
        expect(error).toBe(args[4])
        expect(payloads.length).toBe(1)
        done()
      }
      const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin(window)] })
      const payloads: EventDeliveryPayload[] = []

      client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))

      // call onerror as it would be when `throw 'hello' is run`
      window.onerror(...args)
    })

    it('calls a previously installed window.onerror when a CORS error happens', function (done) {
      const args = ['Script error.', undefined, 0, undefined, undefined] as const
      window.onerror = (messageOrEvent, url, lineNo, charNo, error) => {
        expect(messageOrEvent).toBe(args[0])
        expect(url).toBe(args[1])
        expect(lineNo).toBe(args[2])
        expect(charNo).toBe(args[3])
        expect(error).toBe(args[4])
        expect(payloads.length).toBe(0)
        done()
      }
      const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin(window)] })
      const payloads: EventDeliveryPayload[] = []

      client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))

      // call onerror as it would be when `throw 'hello' is run`
      window.onerror(...args)
    })
  })
})
