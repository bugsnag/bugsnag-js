import Client from '@bugsnag/core/client'
import Breadcrumb from '@bugsnag/core/breadcrumb'
import plugin from '../'

describe('plugin: electron app breadcrumbs', () => {
  afterEach(() => { expect.hasAssertions() })

  describe('records breadcrumbs app events', () => {
    it('ready', () => {
      const app = makeApp()
      const client = makeClient({ app })

      app._emit('ready')

      const breadcrumb = new Breadcrumb('App became ready', {}, 'state')

      expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
    })

    it('will-quit', () => {
      const app = makeApp()
      const client = makeClient({ app })

      app._emit('will-quit')

      const breadcrumb = new Breadcrumb('App is quitting', {}, 'state')

      expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
    })

    it('browser-window-blur', () => {
      const app = makeApp()
      const BrowserWindow = makeBrowserWindow()
      const client = makeClient({ app, BrowserWindow })

      const window = new BrowserWindow(123, 'beep boop')
      app._emit('browser-window-blur', window)

      const breadcrumb = new Breadcrumb(
        'Browser window 123 lost focus',
        { id: 123, title: 'beep boop' },
        'state'
      )

      expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
    })

    it('browser-window-focus', () => {
      const app = makeApp()
      const BrowserWindow = makeBrowserWindow()
      const client = makeClient({ app, BrowserWindow })

      const window = new BrowserWindow(456, 'bee boo')
      app._emit('browser-window-focus', window)

      const breadcrumb = new Breadcrumb(
        'Browser window 456 gained focus',
        { id: 456, title: 'bee boo' },
        'state'
      )

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

      const breadcrumb = new Breadcrumb(
        'peppa (Pepper Plugin) child process unexpectedly disappeared',
        { reason: 'oom', exitCode: 255 },
        'error'
      )

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

      const breadcrumb = new Breadcrumb(
        'GPU child process unexpectedly disappeared',
        { reason: 'abnormal-exit', exitCode: 127 },
        'error'
      )

      expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
    })

    it('render-process-gone', () => {
      const app = makeApp()
      const client = makeClient({ app })

      app._emit('render-process-gone', { id: 19 }, { reason: 'killed', exitCode: 1 })

      const breadcrumb = new Breadcrumb(
        'Renderer process unexpectedly disappeared',
        { webContentsId: 19, reason: 'killed', exitCode: 1 },
        'error'
      )

      expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
    })

    it('browser-window-created', () => {
      const app = makeApp()
      const BrowserWindow = makeBrowserWindow()
      const client = makeClient({ app, BrowserWindow })

      const window = new BrowserWindow(789, 'be bo')
      app._emit('browser-window-created', window)

      const breadcrumb = new Breadcrumb(
        'Browser window 789 created',
        { id: 789, title: 'be bo' },
        'state'
      )

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

        const breadcrumb = new Breadcrumb(
          'Browser window 8271 closed',
          { id: 8271, title: 'abc xyz' },
          'state'
        )

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

        const breadcrumb = new Breadcrumb(
          'Browser window 8271 closed',
          { id: 8271, title: 'zzz zzz' },
          'state'
        )

        expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
      })

      it('unresponsive', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()
        const window = new BrowserWindow(12312, 'xyz abc')

        const client = makeClient({ app, BrowserWindow })

        window._emit('unresponsive')

        const breadcrumb = new Breadcrumb(
          'Browser window 12312 became unresponsive',
          { id: 12312, title: 'xyz abc' },
          'state'
        )

        expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
      })

      it('responsive', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()
        const window = new BrowserWindow(9585, 'sfouhs')

        const client = makeClient({ app, BrowserWindow })

        window._emit('responsive')

        const breadcrumb = new Breadcrumb(
          'Browser window 9585 became responsive',
          { id: 9585, title: 'sfouhs' },
          'state'
        )

        expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
      })

      it('show', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()
        const window = new BrowserWindow(687976, 'rgsoifoea')

        const client = makeClient({ app, BrowserWindow })

        window._emit('show')

        const breadcrumb = new Breadcrumb(
          'Browser window 687976 was shown',
          { id: 687976, title: 'rgsoifoea' },
          'state'
        )

        expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
      })

      it('hide', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()
        const window = new BrowserWindow(64684, 'sofipwad')

        const client = makeClient({ app, BrowserWindow })

        window._emit('hide')

        const breadcrumb = new Breadcrumb(
          'Browser window 64684 was hidden',
          { id: 64684, title: 'sofipwad' },
          'state'
        )

        expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
      })

      it('maximize', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()
        const window = new BrowserWindow(21876, 'afoefawd')

        const client = makeClient({ app, BrowserWindow })

        window._emit('maximize')

        const breadcrumb = new Breadcrumb(
          'Browser window 21876 was maximized',
          { id: 21876, title: 'afoefawd' },
          'state'
        )

        expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
      })

      it('minimize', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()
        const window = new BrowserWindow(78631, 'awopdawdd')

        const client = makeClient({ app, BrowserWindow })

        window._emit('minimize')

        const breadcrumb = new Breadcrumb(
          'Browser window 78631 was minimized',
          { id: 78631, title: 'awopdawdd' },
          'state'
        )

        expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
      })

      it('resized', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()
        const window = new BrowserWindow(444555, 'iiiiii', { size: { width: 123, height: 456 } })

        const client = makeClient({ app, BrowserWindow })

        window._emit('resized')

        const breadcrumb = new Breadcrumb(
          'Browser window 444555 was resized',
          { id: 444555, title: 'iiiiii', width: 123, height: 456 },
          'state'
        )

        expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
      })

      it('moved', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()
        const window = new BrowserWindow(555777, 'eee', { position: { top: 147, left: 258 } })

        const client = makeClient({ app, BrowserWindow })

        window._emit('moved')

        const breadcrumb = new Breadcrumb(
          'Browser window 555777 was moved',
          { id: 555777, title: 'eee', top: 147, left: 258 },
          'state'
        )

        expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
      })

      it('enter-full-screen', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()
        const window = new BrowserWindow(46464, 'ooooooo')

        const client = makeClient({ app, BrowserWindow })

        window._emit('enter-full-screen')

        const breadcrumb = new Breadcrumb(
          'Browser window 46464 went full-screen',
          { id: 46464, title: 'ooooooo' },
          'state'
        )

        expect(client._breadcrumbs[0]).toMatchBreadcrumb(breadcrumb)
      })

      it('leave-full-screen', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()
        const window = new BrowserWindow(7878745, 'aaaa')

        const client = makeClient({ app, BrowserWindow })

        window._emit('leave-full-screen')

        const breadcrumb = new Breadcrumb(
          'Browser window 7878745 left full-screen',
          { id: 7878745, title: 'aaaa' },
          'state'
        )

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

        const breadcrumb = new Breadcrumb(
          'Browser window 8271 closed',
          { id: 8271, title: 'abc xyz' },
          'state'
        )

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

        const breadcrumb = new Breadcrumb(
          'Browser window 12312 became unresponsive',
          { id: 12312, title: 'xyz abc' },
          'state'
        )

        expect(client._breadcrumbs[1]).toMatchBreadcrumb(breadcrumb)
      })

      it('responsive', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()

        const client = makeClient({ app, BrowserWindow })

        const window = new BrowserWindow(9585, 'sfouhs')

        app._emit('browser-window-created', window)
        window._emit('responsive')

        const breadcrumb = new Breadcrumb(
          'Browser window 9585 became responsive',
          { id: 9585, title: 'sfouhs' },
          'state'
        )

        expect(client._breadcrumbs[1]).toMatchBreadcrumb(breadcrumb)
      })

      it('show', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()

        const client = makeClient({ app, BrowserWindow })

        const window = new BrowserWindow(687976, 'rgsoifoea')

        app._emit('browser-window-created', window)
        window._emit('show')

        const breadcrumb = new Breadcrumb(
          'Browser window 687976 was shown',
          { id: 687976, title: 'rgsoifoea' },
          'state'
        )

        expect(client._breadcrumbs[1]).toMatchBreadcrumb(breadcrumb)
      })

      it('hide', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()

        const client = makeClient({ app, BrowserWindow })

        const window = new BrowserWindow(64684, 'sofipwad')

        app._emit('browser-window-created', window)
        window._emit('hide')

        const breadcrumb = new Breadcrumb(
          'Browser window 64684 was hidden',
          { id: 64684, title: 'sofipwad' },
          'state'
        )

        expect(client._breadcrumbs[1]).toMatchBreadcrumb(breadcrumb)
      })

      it('maximize', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()

        const client = makeClient({ app, BrowserWindow })

        const window = new BrowserWindow(21876, 'afoefawd')

        app._emit('browser-window-created', window)
        window._emit('maximize')

        const breadcrumb = new Breadcrumb(
          'Browser window 21876 was maximized',
          { id: 21876, title: 'afoefawd' },
          'state'
        )

        expect(client._breadcrumbs[1]).toMatchBreadcrumb(breadcrumb)
      })

      it('minimize', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()

        const client = makeClient({ app, BrowserWindow })

        const window = new BrowserWindow(78631, 'awopdawdd')

        app._emit('browser-window-created', window)
        window._emit('minimize')

        const breadcrumb = new Breadcrumb(
          'Browser window 78631 was minimized',
          { id: 78631, title: 'awopdawdd' },
          'state'
        )

        expect(client._breadcrumbs[1]).toMatchBreadcrumb(breadcrumb)
      })

      it('resized', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()

        const client = makeClient({ app, BrowserWindow })

        const window = new BrowserWindow(444555, 'iiiiii', { size: { width: 123, height: 456 } })

        app._emit('browser-window-created', window)
        window._emit('resized')

        const breadcrumb = new Breadcrumb(
          'Browser window 444555 was resized',
          { id: 444555, title: 'iiiiii', width: 123, height: 456 },
          'state'
        )

        expect(client._breadcrumbs[1]).toMatchBreadcrumb(breadcrumb)
      })

      it('moved', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()

        const client = makeClient({ app, BrowserWindow })

        const window = new BrowserWindow(555777, 'eee', { position: { top: 147, left: 258 } })

        app._emit('browser-window-created', window)
        window._emit('moved')

        const breadcrumb = new Breadcrumb(
          'Browser window 555777 was moved',
          { id: 555777, title: 'eee', top: 147, left: 258 },
          'state'
        )

        expect(client._breadcrumbs[1]).toMatchBreadcrumb(breadcrumb)
      })

      it('enter-full-screen', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()

        const client = makeClient({ app, BrowserWindow })

        const window = new BrowserWindow(46464, 'ooooooo')

        app._emit('browser-window-created', window)
        window._emit('enter-full-screen')

        const breadcrumb = new Breadcrumb(
          'Browser window 46464 went full-screen',
          { id: 46464, title: 'ooooooo' },
          'state'
        )

        expect(client._breadcrumbs[1]).toMatchBreadcrumb(breadcrumb)
      })

      it('leave-full-screen', () => {
        const app = makeApp()
        const BrowserWindow = makeBrowserWindow()

        const client = makeClient({ app, BrowserWindow })

        const window = new BrowserWindow(7878745, 'aaaa')

        app._emit('browser-window-created', window)
        window._emit('leave-full-screen')

        const breadcrumb = new Breadcrumb(
          'Browser window 7878745 left full-screen',
          { id: 7878745, title: 'aaaa' },
          'state'
        )

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

    appEvents.forEach(app._emit.bind(app))
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

function makeApp () {
  const callbacks = {
    ready: [],
    'will-quit': [],
    'browser-window-blur': [],
    'browser-window-focus': [],
    'browser-window-created': [],
    'child-process-gone': [],
    'render-process-gone': []
  }

  return {
    on (event, callback) {
      callbacks[event].push(callback)
    },

    _emit (event, ...args) {
      callbacks[event].forEach(cb => { cb(null, ...args) })
    }
  }
}

function makeBrowserWindow () {
  const defaultSize = { width: 16, height: 9 }
  const defaultPosition = { top: 2, left: 5 }

  return class FakeBrowserWindow {
    private readonly callbacks: { [event: string]: Function[] } = {
      close: [],
      closed: [],
      unresponsive: [],
      responsive: [],
      show: [],
      hide: [],
      maximize: [],
      minimize: [],
      resized: [],
      moved: [],
      'enter-full-screen': [],
      'leave-full-screen': []
    }

    public title: string
    private readonly id: number
    private readonly size: [number, number]
    private readonly position: [number, number]

    private static readonly _browserWindows: FakeBrowserWindow[] = []

    constructor (id: number, title: string, { size = defaultSize, position = defaultPosition } = {}) {
      this.id = id
      this.title = title
      this.size = [size.width, size.height]
      this.position = [position.left, position.top]

      FakeBrowserWindow._browserWindows.push(this)
    }

    static getAllWindows (): FakeBrowserWindow[] {
      return FakeBrowserWindow._browserWindows
    }

    on (event: string, callback: Function) {
      this.callbacks[event].push(callback)
    }

    getSize (): [number, number] {
      return this.size
    }

    getPosition (): [number, number] {
      return this.position
    }

    _emit (event: string, ...args: any[]): void {
      this.callbacks[event].forEach(cb => { cb(null, ...args) })
    }
  }
}
