const { describe, it, expect } = global

const plugin = require('../throttle')

const Client = require('../../client')
const Report = require('../../report')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: throttle', () => {
  it('should have a name and description', () => {
    expect(plugin.name).toBe('throttle')
    expect(plugin.description).toBeDefined()
  })

  it('serialises comparable properties of a report', () => {
    const r = new Report('FloopError', 'hypermix is not conflatable')
    r.device = { time: (new Date()).toISOString() }
    expect(typeof plugin._serialise).toBe('function')
    const serialise = plugin._serialise
    const parsed = JSON.parse(serialise(r))
    expect(parsed.device).toBe(undefined)
    expect(parsed.errorClass).toBe('FloopError')
    expect(parsed.errorMessage).toBe('hypermix is not conflatable')
  })

  it('detects previously seen reports', () => {
    const r0 = new Report('FloopError', 'hypermix is not conflatable')
    const r1 = new Report('FlapError', 'durameter contains too many fliptrips')
    const r2 = new Report('FloopError', 'hypermix is not conflatable')
    const serialise = plugin._serialise
    expect(typeof plugin._seen).toBe('function')
    expect(plugin._seen([ r0 ].map(serialise).map(report => ({ time: 0, report })), r1)).toBe(0)
    expect(plugin._seen([ r0, r1 ].map(serialise).map(report => ({ time: 0, report })), r2)).toBe(1)
  })

  it('prevents more than maxEventsPerWindow being sent', () => {
    const payloads = []
    const c = new Client(VALID_NOTIFIER)
    c.configure({
      apiKey: 'aaaa-aaaa-aaaa-aaaa',
      maxEventsPerWindow: 5,
      maxDuplicateEventsPerWindow: 5,
      eventWindowSize: 1000
    })
    c.use(plugin)
    c.transport({ sendReport: (config, payload) => payloads.push(payload) })
    for (let i = 0; i < 10; i++) c.notify(new Error('This is fail'))
    expect(payloads.length).toBe(5)
  })

  it('updates maxEventsPerWindow quota as time progresses', done => {
    const payloads = []
    const c = new Client(VALID_NOTIFIER)
    c.configure({
      apiKey: 'aaaa-aaaa-aaaa-aaaa',
      maxEventsPerWindow: 5,
      maxDuplicateEventsPerWindow: 5,
      eventWindowSize: 10
    })
    c.use(plugin)
    c.transport({ sendReport: (config, payload) => payloads.push(payload) })
    for (let i = 0; i < 10; i++) c.notify(new Error('This is fail'))
    expect(payloads.length).toBe(5)
    setTimeout(() => {
      for (let i = 0; i < 10; i++) c.notify(new Error('This is fail'))
      try {
        expect(payloads.length).toBe(10)
        done()
      } catch (e) {
        done(e)
      }
    }, 20)
  })

  it('prevents more than maxDuplicateEventsPerWindow being sent', () => {
    const payloads = []
    const c = new Client(VALID_NOTIFIER)
    c.configure({
      apiKey: 'aaaa-aaaa-aaaa-aaaa',
      maxEventsPerWindow: 10,
      maxDuplicateEventsPerWindow: 1,
      eventWindowSize: 1000
    })
    c.use(plugin)
    c.transport({ sendReport: (config, payload) => payloads.push(payload) })
    for (let i = 0; i < 10; i++) c.notify(new Error('This is fail'))
    expect(payloads.length).toBe(2)
  })
})
