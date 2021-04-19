import Client from '@bugsnag/core/client'
import plugin from '../'

describe('plugin: electron network status', () => {
  it('records online status on load (online = true)', () => {
    const window = makeWindow({ online: true })
    const client = makeClient(window)

    expect(client.getMetadata('device')).toEqual({ online: true })
  })

  it('records online status on load (online = false)', () => {
    const window = makeWindow({ online: false })
    const client = makeClient(window)

    expect(client.getMetadata('device')).toEqual({ online: false })
  })

  it('updates online status when online status changes', () => {
    const window = makeWindow({ online: true })
    const client = makeClient(window)

    expect(client.getMetadata('device')).toEqual({ online: true })

    window._turnOffInternet()

    expect(client.getMetadata('device')).toEqual({ online: false })

    window._turnOnInternet()

    expect(client.getMetadata('device')).toEqual({ online: true })
  })

  it('does not update online status when nothing changes', () => {
    const client = new Client({ apiKey: 'api_key' })

    jest.spyOn(client, 'addMetadata')

    const window = makeWindow({ online: true })
    // @ts-expect-error TODO add _loadPlugin to the internal client types
    client._loadPlugin(plugin(window as unknown as (Window & typeof globalThis)))

    expect(client.getMetadata('device')).toEqual({ online: true })
    expect(client.addMetadata).toHaveBeenCalledTimes(1)

    window._turnOnInternet()

    expect(client.getMetadata('device')).toEqual({ online: true })
    expect(client.addMetadata).toHaveBeenCalledTimes(1)

    window._turnOffInternet()

    expect(client.getMetadata('device')).toEqual({ online: false })
    expect(client.addMetadata).toHaveBeenCalledTimes(2)

    window._turnOffInternet()

    expect(client.getMetadata('device')).toEqual({ online: false })
    expect(client.addMetadata).toHaveBeenCalledTimes(2)
  })
})

function makeClient (window: MockWindow) {
  const client = new Client(
    { apiKey: 'api_key' },
    undefined,
    [plugin(window as unknown as (Window & typeof globalThis))]
  )

  return client
}

interface MockWindow {
  navigator: {
    onLine: boolean
  }
  addEventListener: (event: string, callback: (...args: any[]) => void) => void
  _turnOffInternet: () => void
  _turnOnInternet: () => void
}

function makeWindow ({ online }: { online: boolean}): MockWindow {
  let _online = online
  const callbacks: { [event: string]: Function[] } = {
    online: [],
    offline: []
  }

  return {
    navigator: {
      get onLine () { return _online }
    },
    addEventListener (event, callback) {
      callbacks[event].push(callback)
    },

    _turnOffInternet () {
      _online = false
      callbacks.offline.forEach(cb => { cb() })
    },
    _turnOnInternet () {
      _online = true
      callbacks.online.forEach(cb => { cb() })
    }
  }
}
