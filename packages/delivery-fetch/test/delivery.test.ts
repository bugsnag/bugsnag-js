import delivery from '../delivery'
import type { Client } from '@bugsnag/core'
import type { EventDeliveryPayload } from '@bugsnag/core/client'

// Prevent typescript from complaining about fetch not existing on global object
const globalAny: any = global

describe('delivery:fetch', () => {
  it('sends events successfully', done => {
    globalAny.fetch = jest.fn(() => Promise.resolve({
      json: () => Promise.resolve()
    }))

    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: '/echo/' },
      redactedKeys: []
    }

    const payload = { sample: 'payload' } as unknown as EventDeliveryPayload

    delivery({ logger: {}, _config: config } as unknown as Client).sendEvent(payload, (err) => {
      expect(err).toBe(null)
      expect(globalAny.fetch).toHaveBeenCalled()
      expect(globalAny.fetch).toHaveBeenCalledWith('/echo/', expect.objectContaining({
        method: 'POST',
        body: expect.stringMatching(JSON.stringify(payload)),
        headers: expect.objectContaining({
          'Bugsnag-Api-Key': 'aaaaaaaa',
          'Bugsnag-Payload-Version': '4',
          'Bugsnag-Sent-At': expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          'Content-Type': 'application/json'
        })
      }))
      done()
    })
  })
})
