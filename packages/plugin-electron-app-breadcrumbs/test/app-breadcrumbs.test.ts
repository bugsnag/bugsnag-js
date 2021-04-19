import Client from '@bugsnag/core/client'
import { makeApp, makeBrowserWindow } from '@bugsnag/electron-test-helpers'
import plugin from '../'

describe('plugin: electron app breadcrumbs', () => {
  afterEach(() => { expect.hasAssertions() })

  describe('records breadcrumbs app events', () => {
    it('ready', () => {
      const app = makeApp()
      const client = makeClient({ app })

      app._emit('ready')

      const breadcrumb = { message: 'App became ready', metadata: {}, type: 'state' }
      expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
    })

    it('will-quit', () => {
      const app = makeApp()
      const client = makeClient({ app })

      app._emit('will-quit')

      const breadcrumb = { message: 'App is quitting', metadata: {}, type: 'state' }
      expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
    })

    it('browser-window-blur', () => {
      const BrowserWindow = makeBrowserWindow()
      const app = makeApp({ BrowserWindow })
      const client = makeClient({ app, BrowserWindow })

      const window = new BrowserWindow(123, 'beep boop')
      app._emit('browser-window-blur', window)

      const breadcrumb = {
        message: 'Browser window 123 lost focus',
        metadata: { id: 123, title: 'beep boop' },
        type: 'state'
      }

      expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
    })

    it('browser-window-focus', () => {
      const BrowserWindow = makeBrowserWindow()
      const app = makeApp({ BrowserWindow })
      const client = makeClient({ app, BrowserWindow })

      const window = new BrowserWindow(456, 'bee boo')
      app._emit('browser-window-focus', window)

      const breadcrumb = {
        message: 'Browser window 456 gained focus',
        metadata: { id: 456, title: 'bee boo' },
        type: 'state'
      }

      expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
    })

    it('child-process-gone with name', () => {
      const app = makeApp()
      const client = makeClient({ app })

      app._emit('child-process-gone', {
        type: 'Pepper Plugin',
        reason: 'oom',
        exitCode: 255,
        name: 'peppa'
      })

      const breadcrumb = {
        message: 'peppa (Pepper Plugin) child process unexpectedly disappeared',
        metadata: { reason: 'oom', exitCode: 255 },
        type: 'state'
      }

      expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
    })

    it('child-process-gone without name', () => {
      const app = makeApp()
      const client = makeClient({ app })

      app._emit('child-process-gone', {
        type: 'GPU',
        reason: 'abnormal-exit',
        exitCode: 127
      })

      const breadcrumb = {
        message: 'GPU child process unexpectedly disappeared',
        metadata: { reason: 'abnormal-exit', exitCode: 127 },
        type: 'state'
      }

      expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
    })

    it('render-process-gone', () => {
      const app = makeApp()
      const client = makeClient({ app })

      app._emit('render-process-gone', { id: 19 }, { reason: 'killed', exitCode: 1 })

      const breadcrumb = {
        message: 'Renderer process unexpectedly disappeared',
        metadata: { webContentsId: 19, reason: 'killed', exitCode: 1 },
        type: 'state'
      }

      expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
    })

    it('browser-window-created', () => {
      const BrowserWindow = makeBrowserWindow()
      const app = makeApp({ BrowserWindow })
      const client = makeClient({ app, BrowserWindow })

      const window = new BrowserWindow(789, 'be bo')
      app._emit('browser-window-created', window)

      const breadcrumb = {
        message: 'Browser window 789 created',
        metadata: { id: 789, title: 'be bo' },
        type: 'state'
      }

      expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
    })
  })

  describe('records breadcrumbs for BrowserWindow events', () => {
    describe('existing windows', () => {
      it('closed', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()
        const window = new BrowserWindow(8271, 'abc xyz')

        const client = makeClient({ app, BrowserWindow })

        window._emit('closed')

        const breadcrumb = {
          message: 'Browser window 8271 closed',
          metadata: { id: 8271, title: 'abc xyz' },
          type: 'state'
        }

        expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
      })

      it('closed with changed values', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()
        const window = new BrowserWindow(8271, 'abc xyz')

        const client = makeClient({ app, BrowserWindow })

        window.title = 'zzz zzz'

        window._emit('close')
        window._emit('closed')

        const breadcrumb = {
          message: 'Browser window 8271 closed',
          metadata: { id: 8271, title: 'zzz zzz' },
          type: 'state'
        }

        expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
      })

      it('unresponsive', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()
        const window = new BrowserWindow(12312, 'xyz abc')

        const client = makeClient({ app, BrowserWindow })

        window._emit('unresponsive')

        const breadcrumb = {
          message: 'Browser window 12312 became unresponsive',
          metadata: { id: 12312, title: 'xyz abc' },
          type: 'state'
        }

        expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
      })

      it('responsive', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()
        const window = new BrowserWindow(9585, 'sfouhs')

        const client = makeClient({ app, BrowserWindow })

        window._emit('responsive')

        const breadcrumb = {
          message: 'Browser window 9585 became responsive',
          metadata: { id: 9585, title: 'sfouhs' },
          type: 'state'
        }

        expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
      })

      it('show', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()
        const window = new BrowserWindow(687976, 'rgsoifoea')

        const client = makeClient({ app, BrowserWindow })

        window._emit('show')

        const breadcrumb = {
          message: 'Browser window 687976 was shown',
          metadata: { id: 687976, title: 'rgsoifoea' },
          type: 'state'
        }

        expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
      })

      it('hide', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()
        const window = new BrowserWindow(64684, 'sofipwad')

        const client = makeClient({ app, BrowserWindow })

        window._emit('hide')

        const breadcrumb = {
          message: 'Browser window 64684 was hidden',
          metadata: { id: 64684, title: 'sofipwad' },
          type: 'state'
        }

        expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
      })

      it('maximize', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()
        const window = new BrowserWindow(21876, 'afoefawd')

        const client = makeClient({ app, BrowserWindow })

        window._emit('maximize')

        const breadcrumb = {
          message: 'Browser window 21876 was maximized',
          metadata: { id: 21876, title: 'afoefawd' },
          type: 'state'
        }

        expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
      })

      it('minimize', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()
        const window = new BrowserWindow(78631, 'awopdawdd')

        const client = makeClient({ app, BrowserWindow })

        window._emit('minimize')

        const breadcrumb = {
          message: 'Browser window 78631 was minimized',
          metadata: { id: 78631, title: 'awopdawdd' },
          type: 'state'
        }

        expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
      })

      it('resized', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()
        const window = new BrowserWindow(444555, 'iiiiii', { size: { width: 123, height: 456 } })

        const client = makeClient({ app, BrowserWindow })

        window._emit('resized')

        const breadcrumb = {
          message: 'Browser window 444555 was resized',
          metadata: { id: 444555, title: 'iiiiii', width: 123, height: 456 },
          type: 'state'
        }

        expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
      })

      it('moved', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()
        const window = new BrowserWindow(555777, 'eee', { position: { top: 147, left: 258 } })

        const client = makeClient({ app, BrowserWindow })

        window._emit('moved')

        const breadcrumb = {
          message: 'Browser window 555777 was moved',
          metadata: { id: 555777, title: 'eee', top: 147, left: 258 },
          type: 'state'
        }

        expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
      })

      it('enter-full-screen', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()
        const window = new BrowserWindow(46464, 'ooooooo')

        const client = makeClient({ app, BrowserWindow })

        window._emit('enter-full-screen')

        const breadcrumb = {
          message: 'Browser window 46464 went full-screen',
          metadata: { id: 46464, title: 'ooooooo' },
          type: 'state'
        }

        expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
      })

      it('leave-full-screen', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()
        const window = new BrowserWindow(7878745, 'aaaa')

        const client = makeClient({ app, BrowserWindow })

        window._emit('leave-full-screen')

        const breadcrumb = {
          message: 'Browser window 7878745 left full-screen',
          metadata: { id: 7878745, title: 'aaaa' },
          type: 'state'
        }

        expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
      })
    })

    describe('new windows', () => {
      it('closed', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()

        const client = makeClient({ app, BrowserWindow })

        const window = new BrowserWindow(8271, 'abc xyz')

        app._emit('browser-window-created', window)
        window._emit('closed')

        const breadcrumb = {
          message: 'Browser window 8271 closed',
          metadata: { id: 8271, title: 'abc xyz' },
          type: 'state'
        }

        // breadcrumbs[0] is the 'browser-window-created' crumb
        expect(client._breadcrumbs[1]).toMatchBreadcrumb(breadcrumb)
      })

      it('unresponsive', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()

        const client = makeClient({ app, BrowserWindow })

        const window = new BrowserWindow(12312, 'xyz abc')

        app._emit('browser-window-created', window)
        window._emit('unresponsive')

        const breadcrumb = {
          message: 'Browser window 12312 became unresponsive',
          metadata: { id: 12312, title: 'xyz abc' },
          type: 'state'
        }

        expect(client._breadcrumbs[1]).toMatchBreadcrumb(breadcrumb)
      })

      it('responsive', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()

        const client = makeClient({ app, BrowserWindow })

        const window = new BrowserWindow(9585, 'sfouhs')

        app._emit('browser-window-created', window)
        window._emit('responsive')

        const breadcrumb = {
          message: 'Browser window 9585 became responsive',
          metadata: { id: 9585, title: 'sfouhs' },
          type: 'state'
        }

        expect(client._breadcrumbs[1]).toMatchBreadcrumb(breadcrumb)
      })

      it('show', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()

        const client = makeClient({ app, BrowserWindow })

        const window = new BrowserWindow(687976, 'rgsoifoea')

        app._emit('browser-window-created', window)
        window._emit('show')

        const breadcrumb = {
          message: 'Browser window 687976 was shown',
          metadata: { id: 687976, title: 'rgsoifoea' },
          type: 'state'
        }

        expect(client._breadcrumbs[1]).toMatchBreadcrumb(breadcrumb)
      })

      it('hide', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()

        const client = makeClient({ app, BrowserWindow })

        const window = new BrowserWindow(64684, 'sofipwad')

        app._emit('browser-window-created', window)
        window._emit('hide')

        const breadcrumb = {
          message: 'Browser window 64684 was hidden',
          metadata: { id: 64684, title: 'sofipwad' },
          type: 'state'
        }

        expect(client._breadcrumbs[1]).toMatchBreadcrumb(breadcrumb)
      })

      it('maximize', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()

        const client = makeClient({ app, BrowserWindow })

        const window = new BrowserWindow(21876, 'afoefawd')

        app._emit('browser-window-created', window)
        window._emit('maximize')

        const breadcrumb = {
          message: 'Browser window 21876 was maximized',
          metadata: { id: 21876, title: 'afoefawd' },
          type: 'state'
        }

        expect(client._breadcrumbs[1]).toMatchBreadcrumb(breadcrumb)
      })

      it('minimize', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()

        const client = makeClient({ app, BrowserWindow })

        const window = new BrowserWindow(78631, 'awopdawdd')

        app._emit('browser-window-created', window)
        window._emit('minimize')

        const breadcrumb = {
          message: 'Browser window 78631 was minimized',
          metadata: { id: 78631, title: 'awopdawdd' },
          type: 'state'
        }

        expect(client._breadcrumbs[1]).toMatchBreadcrumb(breadcrumb)
      })

      it('resized', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()

        const client = makeClient({ app, BrowserWindow })

        const window = new BrowserWindow(444555, 'iiiiii', { size: { width: 123, height: 456 } })

        app._emit('browser-window-created', window)
        window._emit('resized')

        const breadcrumb = {
          message: 'Browser window 444555 was resized',
          metadata: { id: 444555, title: 'iiiiii', width: 123, height: 456 },
          type: 'state'
        }

        expect(client._breadcrumbs[1]).toMatchBreadcrumb(breadcrumb)
      })

      it('moved', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()

        const client = makeClient({ app, BrowserWindow })

        const window = new BrowserWindow(555777, 'eee', { position: { top: 147, left: 258 } })

        app._emit('browser-window-created', window)
        window._emit('moved')

        const breadcrumb = {
          message: 'Browser window 555777 was moved',
          metadata: { id: 555777, title: 'eee', top: 147, left: 258 },
          type: 'state'
        }

        expect(client._breadcrumbs[1]).toMatchBreadcrumb(breadcrumb)
      })

      it('enter-full-screen', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()

        const client = makeClient({ app, BrowserWindow })

        const window = new BrowserWindow(46464, 'ooooooo')

        app._emit('browser-window-created', window)
        window._emit('enter-full-screen')

        const breadcrumb = {
          message: 'Browser window 46464 went full-screen',
          metadata: { id: 46464, title: 'ooooooo' },
          type: 'state'
        }

        expect(client._breadcrumbs[1]).toMatchBreadcrumb(breadcrumb)
      })

      it('leave-full-screen', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()

        const client = makeClient({ app, BrowserWindow })

        const window = new BrowserWindow(7878745, 'aaaa')

        app._emit('browser-window-created', window)
        window._emit('leave-full-screen')

        const breadcrumb = {
          message: 'Browser window 7878745 left full-screen',
          metadata: { id: 7878745, title: 'aaaa' },
          type: 'state'
        }

        expect(client._breadcrumbs[1]).toMatchBreadcrumb(breadcrumb)
      })
    })
  })

  it('honours enabledBreadcrumbTypes', () => {
    const appEvents = ['ready', 'will-quit', 'browser-window-blur', 'browser-window-focus', 'child-process-gone', 'render-process-gone']
    const browserWindowEvents = ['closed', 'unresponsive', 'responsive', 'show', 'hide', 'maximize', 'minimize', 'resized', 'moved', 'enter-full-screen', 'leave-full-screen']

    const app = makeApp()
    const BrowserWindow = makeBrowserWindow()

    const client = makeClient({ app, BrowserWindow, config: { enabledBreadcrumbTypes: [] } })

    const window = new BrowserWindow(412, 'hhh')

    appEvents.forEach(appEvent => app._emit.bind(app))
    app._emit('browser-window-created', window)

    browserWindowEvents.forEach(window._emit.bind(window))

    expect(client._breadcrumbs).toHaveLength(0)
  })
})

function makeClient ({
  app = makeApp(),
  BrowserWindow = makeBrowserWindow(),
  config = {}
} = {}) {
  return new Client(
    { apiKey: 'api_key', ...config },
    undefined,
    [plugin(app, BrowserWindow)]
  )
}
