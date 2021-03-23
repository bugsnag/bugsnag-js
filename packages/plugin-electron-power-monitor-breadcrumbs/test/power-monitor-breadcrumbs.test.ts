import Breadcrumb from '@bugsnag/core/breadcrumb'
import { PowerMonitorEvent } from '@bugsnag/electron-test-helpers/src/PowerMonitor'
import { makePowerMonitor, makeClientForPlugin } from '@bugsnag/electron-test-helpers'
import plugin from '../'

describe('plugin: electron power monitor breadcrumbs', () => {
  const events: Array<[PowerMonitorEvent, string]> = [
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
    const { client } = makeClientForPlugin({ plugin: plugin(powerMonitor) })

    powerMonitor._emit(event)

    const breadcrumb = new Breadcrumb(expectedMessage, {}, 'state')

    expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
  })

  it.each(events)('honours enabledBreadcrumbTypes for "%s"', (event, expectedMessage) => {
    const powerMonitor = makePowerMonitor()
    const { client } = makeClientForPlugin({
      plugin: plugin(powerMonitor),
      config: { enabledBreadcrumbTypes: [] }
    })

    powerMonitor._emit(event)

    expect(client._breadcrumbs).toHaveLength(0)
  })
})
