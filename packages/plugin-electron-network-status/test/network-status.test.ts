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

    client.addMetadata = jest.spyOn(client, 'addMetadata')

    const window = makeWindow({ online: true })
    client._loadPlugin(plugin(window))

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

function makeClient (window) {
  const client = new Client(
    { apiKey: 'api_key' },
    undefined,
    [plugin(window)]
  )

  return client
}

function makeWindow ({ online }) {
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
