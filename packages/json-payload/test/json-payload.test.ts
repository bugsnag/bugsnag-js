import type { EventDeliveryPayload, SessionDeliveryPayload } from '@bugsnag/core'
import { Event, Session } from '@bugsnag/core'
import jsonPayload from '../'

function makeBigObject () {
  const big: Record<string, string> = {}
  let i = 0
  while (JSON.stringify(big).length < 2 * 10e5) {
    big['entry' + i] = 'long repetitive string'.repeat(1000)
    i++
  }
  return big
}

describe('jsonPayload.event', () => {
  it('safe stringifies the payload and redacts values from certain paths of the supplied keys', () => {
    const event = new Event('CheckoutError', 'Failed load tickets')
    event.setUser('123', 'jim@bugsnag.com', 'Jim Bug')
    event.request = { apiKey: '245b39ebd3cd3992e85bffc81c045924' }

    expect(jsonPayload.event({
      apiKey: 'd145b8e5afb56516423bc4d605e45442',
      notifier: { name: 'Bugsnag', version: '1.0.0', url: 'https://bugsnag.com' },
      events: [event]
    }, ['apiKey'])).toBe('{"apiKey":"d145b8e5afb56516423bc4d605e45442","notifier":{"name":"Bugsnag","version":"1.0.0","url":"https://bugsnag.com"},"events":[{"payloadVersion":"4","exceptions":[{"errorClass":"CheckoutError","errorMessage":"Failed load tickets","type":"browserjs","stacktrace":[],"message":"Failed load tickets"}],"severity":"warning","unhandled":false,"severityReason":{"type":"handledException"},"app":{},"device":{},"request":{"apiKey":"[REDACTED]"},"breadcrumbs":[],"metaData":{},"user":{"id":"123","email":"jim@bugsnag.com","name":"Jim Bug"},"featureFlags":[]}]}')
  })

  it('strips the metaData of the first event if the payload is too large', () => {
    const event = new Event('CheckoutError', 'Failed load tickets')
    event.setUser('123', 'jim@bugsnag.com', 'Jim Bug')
    event.request = { apiKey: '245b39ebd3cd3992e85bffc81c045924' }
    event._metadata = { 'big thing': makeBigObject() }

    const payload: EventDeliveryPayload = {
      apiKey: 'd145b8e5afb56516423bc4d605e45442',
      notifier: { name: 'Bugsnag', version: '1.0.0', url: 'https://bugsnag.com' },
      events: [event]
    }

    expect(jsonPayload.event(payload)).toBe('{"apiKey":"d145b8e5afb56516423bc4d605e45442","notifier":{"name":"Bugsnag","version":"1.0.0","url":"https://bugsnag.com"},"events":[{"payloadVersion":"4","exceptions":[{"errorClass":"CheckoutError","errorMessage":"Failed load tickets","type":"browserjs","stacktrace":[],"message":"Failed load tickets"}],"severity":"warning","unhandled":false,"severityReason":{"type":"handledException"},"app":{},"device":{},"request":{"apiKey":"245b39ebd3cd3992e85bffc81c045924"},"breadcrumbs":[],"metaData":{"notifier":"WARNING!\\nSerialized payload was 2.003764MB (limit = 1MB)\\nmetadata was removed"},"user":{"id":"123","email":"jim@bugsnag.com","name":"Jim Bug"},"featureFlags":[]}]}')
  })

  it('does not attempt to strip any other data paths from the payload to reduce the size', () => {
    const event1 = new Event('CheckoutError', 'Failed load tickets')
    event1.setUser('123', 'jim@bugsnag.com', 'Jim Bug')
    event1.request = { apiKey: '245b39ebd3cd3992e85bffc81c045924' }
    
    // Second event metadata should not be stripped, only the first
    const event2 = new Event('APIError', 'Request failed')
    event2._metadata = { 'big thing': makeBigObject() }
    
    const payload = {
      apiKey: 'd145b8e5afb56516423bc4d605e45442',
      notifier: { name: 'Bugsnag', version: '1.0.0', url: 'https://bugsnag.com' },
      events: [event1, event2]
    }

    expect(jsonPayload.event(payload).length).toBeGreaterThan(10e5)
  })
})

describe('jsonPayload.session', () => {
  it('safe stringifies the payload', () => {
    const session = new Session('123', new Date('2012-12-21T00:00:00.0000Z'))
    const sessionPayload: SessionDeliveryPayload = {
      app: { version: '1.0.0' },
      device: { id: '123' },
      notifier: { name: 'Bugsnag', version: '1.0.0', url: 'https://bugsnag.com' },
      sessions: [session]
    }

    expect(jsonPayload.session(sessionPayload)).toBe('{"app":{"version":"1.0.0"},"device":{"id":"123"},"notifier":{"name":"Bugsnag","version":"1.0.0","url":"https://bugsnag.com"},"sessions":[{"id":"123","startedAt":"2012-12-21T00:00:00.000Z","events":{"handled":0,"unhandled":0}}]}')
  })
})
