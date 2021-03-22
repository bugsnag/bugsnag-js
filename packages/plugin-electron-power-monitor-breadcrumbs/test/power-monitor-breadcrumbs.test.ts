import Client from '@bugsnag/core/client'
import Breadcrumb from '@bugsnag/core/breadcrumb'
import plugin from '../'

describe('plugin: electron power monitor breadcrumbs', () => {
  const events = [
    ['suspend', 'Device suspended'],
    ['resume', 'Device resumed from suspension'],
    ['on-ac', 'Device connected to mains power source'],
    ['on-battery', 'Device switched to battery power source'],
    ['shutdown', 'Device about to shutdown'],
    ['lock-screen', 'Device screen locked'],
    ['unlock-screen', 'Device screen unlocked']
  ]

  it.each(events)('leaves a breadcrumb for the "%s" event', (event, expectedMessage) => {
    const powerMonitor = makePowerMonitor()
    const client = makeClient({ powerMonitor })

    powerMonitor._emit(event)

    const breadcrumb = new Breadcrumb(expectedMessage, {}, 'state')

    expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
  })

  it.each(events)('honours enabledBreadcrumbTypes for "%s"', (event, expectedMessage) => {
    const powerMonitor = makePowerMonitor()
    const client = makeClient({ powerMonitor, config: { enabledBreadcrumbTypes: [] } })

    powerMonitor._emit(event)

    expect(client._breadcrumbs).toHaveLength(0)
  })
})

function makeClient ({
  powerMonitor = makePowerMonitor(),
  config = {}
} = {}) {
  return new Client(
    { apiKey: 'api_key', ...config },
    undefined,
    [plugin(powerMonitor)]
  )
}

function makePowerMonitor () {
  const callbacks: { [event: string]: Function[] } = {
    suspend: [],
    resume: [],
    'on-ac': [],
    'on-battery': [],
    shutdown: [],
    'lock-screen': [],
    'unlock-screen': []
  }

  return {
    on (event, callback) {
      callbacks[event].push(callback)
    },
    _emit (event) {
      callbacks[event].forEach(cb => { cb() })
    }
  }
}
