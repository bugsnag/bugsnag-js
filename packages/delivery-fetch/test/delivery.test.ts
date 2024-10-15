import delivery from '../delivery'
import type { Client } from '@bugsnag/core'
import type { EventDeliveryPayload, SessionDeliveryPayload } from '@bugsnag/core/client'

const globalAny: any = global

describe('delivery:fetch', () => {
  it('sends events successfully', done => {
    window.isSecureContext = true

    globalAny.fetch = jest.fn(() => Promise.resolve({
      json: () => Promise.resolve()
    }))

    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: '/echo/' },
      redactedKeys: []
    }

    const payload = { sample: 'payload' } as unknown as EventDeliveryPayload

    delivery({ logger: { }, _config: config } as unknown as Client).sendEvent(payload, (err) => {
      expect(err).toBeNull()
      expect(globalAny.fetch).toHaveBeenCalled()
      expect(globalAny.fetch).toHaveBeenCalledWith('/echo/', expect.objectContaining({
        method: 'POST',
        body: expect.stringMatching(JSON.stringify(payload)),
        headers: expect.objectContaining({
          'Bugsnag-Api-Key': 'aaaaaaaa',
          'Bugsnag-Payload-Version': '4',
          'Bugsnag-Sent-At': expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          'Content-Type': 'application/json',
          'Bugsnag-Integrity': 'sha1 14faf2461b0519f9d9d62cfb8d79483fcc8f825c'
        })
      }))
      done()
    })

    window.isSecureContext = false
  })

  it('omits the bugsnag integrity header when not in a secure context', done => {
    globalAny.fetch = jest.fn(() => Promise.resolve({
      json: () => Promise.resolve()
    }))

    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: '/echo/' },
      redactedKeys: []
    }

    const payload = { sample: 'payload' } as unknown as EventDeliveryPayload

    delivery({ logger: { }, _config: config } as unknown as Client).sendEvent(payload, (err) => {
      expect(err).toBeNull()
      expect(globalAny.fetch.mock.calls[0][1].headers['Bugsnag-Integrity']).toBeUndefined()
      done()
    })
  })

  it('returns an error for failed event delivery', done => {
    globalAny.fetch = jest.fn().mockRejectedValue(new Error('failed to deliver'))

    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: '/echo/' },
      redactedKeys: []
    }

    const payload = { sample: 'payload' } as unknown as EventDeliveryPayload
    const mockError = jest.fn()

    delivery({ _logger: { error: mockError }, _config: config } as unknown as Client).sendEvent(payload, (err) => {
      expect(err).not.toBeNull()
      expect(err).toStrictEqual(new Error('failed to deliver'))
      expect(mockError).toHaveBeenCalledWith(new Error('failed to deliver'))
      done()
    })
  })

  it('sends sessions successfully', done => {
    globalAny.fetch = jest.fn(() => Promise.resolve({
      json: () => Promise.resolve()
    }))

    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { sessions: '/echo/' },
      redactedKeys: []
    }

    const payload = { sample: 'payload' } as unknown as SessionDeliveryPayload

    delivery({ logger: {}, _config: config } as unknown as Client).sendSession(payload, (err) => {
      expect(err).toBeNull()
      expect(globalAny.fetch).toHaveBeenCalledWith('/echo/', expect.objectContaining({
        method: 'POST',
        body: expect.stringMatching(JSON.stringify(payload)),
        headers: expect.objectContaining({
          'Bugsnag-Api-Key': 'aaaaaaaa',
          'Bugsnag-Payload-Version': '1',
          'Bugsnag-Sent-At': expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          'Content-Type': 'application/json'
        })
      }))
      done()
    })
  })

  it('returns an error for failed sessions', done => {
    globalAny.fetch = jest.fn().mockRejectedValue(new Error('failed to deliver'))

    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { sessions: '/echo/' },
      redactedKeys: []
    }

    const payload = { sample: 'payload' } as unknown as SessionDeliveryPayload

    const mockError = jest.fn()

    delivery({ _logger: { error: mockError }, _config: config } as unknown as Client).sendSession(payload, (err) => {
      expect(err).not.toBeNull()
      expect(err).toStrictEqual(new Error('failed to deliver'))
      expect(mockError).toHaveBeenCalledWith(new Error('failed to deliver'))
      done()
    })
  })

  it('prioritises API key set on an event', done => {
    globalAny.fetch = jest.fn(() => Promise.resolve({ json: Promise.resolve }))

    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: '/echo/' },
      redactedKeys: []
    }

    const payload = { sample: 'payload', apiKey: 'bbbbbbbb' } as unknown as EventDeliveryPayload

    delivery({ _logger: {}, _config: config } as unknown as Client).sendEvent(payload, (err) => {
      expect(err).toBeNull()
      expect(globalAny.fetch).toHaveBeenCalled()
      expect(globalAny.fetch).toHaveBeenCalledWith('/echo/', expect.objectContaining({
        method: 'POST',
        body: expect.stringMatching(JSON.stringify(payload)),
        headers: expect.objectContaining({
          'Bugsnag-Api-Key': 'bbbbbbbb',
          'Bugsnag-Payload-Version': '4',
          'Bugsnag-Sent-At': expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          'Content-Type': 'application/json'
        })
      }))
      done()
    })
  })
})
