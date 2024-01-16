import Breadcrumb from '@bugsnag/core/breadcrumb'
import { makeClientForPlugin, makeDisplay, makeScreen } from '@bugsnag/electron-test-helpers'
import plugin from '../'

describe('plugin: electron screen breadcrumbs', () => {
  it('leaves a breadcrumb for the "display-added" event', () => {
    const screen = makeScreen()
    const { client } = makeClientForPlugin({ plugins: [plugin(screen)] })

    const display = makeDisplay({ id: 1234 })

    screen._emit('display-added', display)

    // the display ID in the message & metadata should not be the actual ID as
    // this could be a privacy concern
    const metadata = { ...display, id: 0 }
    const breadcrumb = new Breadcrumb('Display 0 added', metadata, 'state')

    expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
  })

  it('leaves a breadcrumb for the "display-removed" event', () => {
    const screen = makeScreen()
    const { client } = makeClientForPlugin({ plugins: [plugin(screen)] })

    const display = makeDisplay({ id: 1234 })

    screen._emit('display-removed', display)

    const metadata = { ...display, id: 0 }
    const breadcrumb = new Breadcrumb('Display 0 removed', metadata, 'state')

    expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
  })

  it.each([
    [['bounds'], 'Display 0 bounds changed'],
    [['workArea'], 'Display 0 work area changed'],
    [['scaleFactor'], 'Display 0 scale factor changed'],
    [['rotation'], 'Display 0 rotation changed'],
    [['bounds', 'workArea'], 'Display 0 bounds and work area changed'],
    [['scaleFactor', 'rotation'], 'Display 0 scale factor and rotation changed'],
    [
      ['bounds', 'workArea', 'scaleFactor', 'rotation'],
      'Display 0 bounds, work area, scale factor and rotation changed'
    ]
  ])('leaves a breadcrumb for the "display-metrics-changed" event with changedMetrics = %p', (changedMetrics, message) => {
    const screen = makeScreen()
    const { client } = makeClientForPlugin({ plugins: [plugin(screen)] })

    const display = makeDisplay({ id: 23456 })

    screen._emit('display-metrics-changed', display, changedMetrics)

    const metadata = { ...display, id: 0 }
    const breadcrumb = new Breadcrumb(message, metadata, 'state')

    expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
  })

  it('honours enabledBreadcrumbTypes', () => {
    const screen = makeScreen()
    const { client } = makeClientForPlugin({
      plugins: [plugin(screen)],
      config: { enabledBreadcrumbTypes: [] }
    })

    const display = makeDisplay({ id: 1234 })

    screen._emit('display-added', display)
    screen._emit('display-removed', display)
    screen._emit('display-metrics-changed', display, ['bounds'])

    expect(client._breadcrumbs).toHaveLength(0)
  })

  it('works when enabledBreadcrumbTypes=null', () => {
    const screen = makeScreen()
    const { client } = makeClientForPlugin({
      plugins: [plugin(screen)],
      config: { enabledBreadcrumbTypes: null }
    })

    const display = makeDisplay({ id: 1234 })

    screen._emit('display-added', display)
    screen._emit('display-removed', display)
    screen._emit('display-metrics-changed', display, ['bounds'])

    expect(client._breadcrumbs).toHaveLength(3)
  })

  it('anonymises IDs correctly', () => {
    const screen = makeScreen()
    const { client } = makeClientForPlugin({ plugins: [plugin(screen)] })

    const display = makeDisplay({ id: 1234 })

    screen._emit('display-added', display)

    const metadata = { ...display, id: 0 }
    const breadcrumb = new Breadcrumb('Display 0 added', metadata, 'state')

    expect(client._breadcrumbs.pop()).toMatchBreadcrumb(breadcrumb)

    const display2 = makeDisplay({ id: 5678 })

    screen._emit('display-added', display2)

    const metadata2 = { ...display2, id: 1 }
    const breadcrumb2 = { message: 'Display 1 added', metadata: metadata2, type: 'state' }
    expect(client._breadcrumbs.pop()).toMatchBreadcrumb(breadcrumb2)

    const displayWithSameIdAsFirstDisplay = makeDisplay({ id: 1234 })

    screen._emit('display-added', displayWithSameIdAsFirstDisplay)

    expect(client._breadcrumbs.pop()).toMatchBreadcrumb(breadcrumb)

    screen._emit('display-added', display2)

    expect(client._breadcrumbs.pop()).toMatchBreadcrumb(breadcrumb2)

    const display3 = makeDisplay({ id: 888888 })

    screen._emit('display-added', display3)

    const metadata3 = { ...display3, id: 2 }
    const breadcrumb3 = { message: 'Display 2 added', metadata: metadata3, type: 'state' }
    expect(client._breadcrumbs.pop()).toMatchBreadcrumb(breadcrumb3)
  })
})
