import plugin from '../app'
import Client from '@bugsnag/core/client'

describe('plugin-node-app', () => {
  it('includes duration in event.app', done => {
    const client = new Client({ apiKey: 'api_key', plugins: [plugin] })

    client._setDelivery(client => ({
      sendEvent: payload => {
        // The maximum number of milliseconds 'duration' should be
        const maximum = 1000

        expect(payload.events[0].app.duration).toBeGreaterThanOrEqual(0)
        expect(payload.events[0].app.duration).toBeLessThanOrEqual(maximum)

        done()
      },
      sendSession: () => {}
    }))

    client.notify(new Error('acbd'))
  })
})
