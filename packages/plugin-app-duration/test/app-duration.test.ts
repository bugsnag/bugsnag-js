import plugin from '../src/app-duration'
import { Client, Event } from '@bugsnag/core'

describe('plugin-app-duration', () => {
  it('includes duration in event.app', done => {
    const client = new Client({ apiKey: 'api_key', plugins: [plugin] })

    client._setDelivery(client => ({
      sendEvent: payload => {
        // The maximum number of milliseconds 'duration' should be
        const maximum = 5000

        expect(payload.events[0].app.duration).toBeGreaterThanOrEqual(0)
        expect(payload.events[0].app.duration).toBeLessThanOrEqual(maximum)

        done()
      },
      sendSession: () => {}
    }))

    client.notify(new Error('acbd'))
  })

  it('has a name', () => {
    expect(plugin.name).toBe('appDuration')

    const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
    expect(client.getPlugin('appDuration')).toBeDefined()
  })

  it('can be restarted', async () => {
    let appDurationCallback = (event: Event) => { throw new Error('Should never be called') }

    const event = { app: {} } as unknown as Event
    const client = {
      addOnError (callback: typeof appDurationCallback) {
        appDurationCallback = callback
      }
    }

    const result = plugin.load(client as unknown as Client)

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    await sleep(50)

    appDurationCallback(event)
    expect(event.app.duration).toBeGreaterThanOrEqual(45)

    await sleep(50)

    appDurationCallback(event)
    expect(event.app.duration).toBeGreaterThanOrEqual(90)

    result.reset()

    await sleep(25)

    appDurationCallback(event)
    expect(event.app.duration).toBeGreaterThanOrEqual(20)
    expect(event.app.duration).toBeLessThanOrEqual(90)
  })
})
