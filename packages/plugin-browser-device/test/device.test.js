const { describe, it, expect } = global

const plugin = require('../device')

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

const navigator = { locale: 'en_GB', userAgent: 'testing browser 1.2.3' }

describe('plugin: device', () => {
  it('should add an onError callback which captures device information', done => {
    const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
    const payloads = []
    client.use(plugin, navigator)

    expect(client._cbs.e.length).toBe(1)

    client._delivery(client => ({
      sendEvent: (payload, cb) => {
        payloads.push(payload)
        cb()
      }
    }))
    client.notify(new Error('noooo'), () => {}, () => {
      const ISO_8601 = /^\d{4}(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?)?)?)?$/i
      expect(payloads.length).toEqual(1)
      expect(payloads[0].events[0].device).toBeDefined()
      expect(payloads[0].events[0].device.time).toMatch(ISO_8601)
      expect(payloads[0].events[0].device.locale).toBe(navigator.browserLanguage)
      expect(payloads[0].events[0].device.userAgent).toBe(navigator.userAgent)
      done()
    })
  })

  it('should add an onSessionPayload callback which captures device information', done => {
    const client = new Client({ apiKey: 'API_KEY_YEAH' }, undefined, VALID_NOTIFIER)
    const payloads = []
    client.use(plugin, navigator)

    expect(client._cbs.sp.length).toBe(1)
    client._sessionDelegate({
      startSession: (client, session) => {
        client._session = session
        const payload = {
          notifier: client._notifier,
          device: {},
          app: {},
          sessions: [
            {
              id: client._session.id,
              startedAt: client._session.startedAt,
              user: client.user
            }
          ]
        }

        const cbs = client._cbs.sp.slice(0)
        client.__delivery.sendSession(
          cbs.reduce((accum, cb) => {
            cb(accum)
            return accum
          }, payload),
          () => {}
        )
      }
    })
    client._delivery(client => ({
      sendSession: (payload, cb) => {
        payloads.push(payload)
        cb()
      }
    }))
    client.startSession()
    expect(payloads.length).toEqual(1)
    expect(payloads[0].device).toBeDefined()
    expect(payloads[0].device.userAgent).toBe(navigator.userAgent)
    done()
  })
})
