// https://www.electronjs.org/docs/api/app

type BrowserWindowEvent
  = 'close'
  | 'closed'
  | 'unresponsive'
  | 'responsive'
  | 'show'
  | 'hide'
  | 'maximize'
  | 'minimize'
  | 'resized'
  | 'moved'
  | 'enter-full-screen'
  | 'leave-full-screen'

interface BrowserWindowConstrutorOptions {
  size?: { width: number, height: number }
  position?: { top: number, left: number }
}

// the static methods on BrowserWindow
// these are separate due to TypeScript limitations
export interface BrowserWindowStatic {
  new (id: number, title: string, options?: BrowserWindowConstrutorOptions): BrowserWindow
  getAllWindows: () => BrowserWindow[]
  getFocusedWindow: () => BrowserWindow|null

  _blur: () => void
  _focus: (index: number) => void
  _create: () => BrowserWindow
  _close: (window: BrowserWindow) => void
}

type Size = [number, number]
type Position = [number, number]

// the instance methods & properties on a BrowserWindow
export interface BrowserWindow {
  on: (event: BrowserWindowEvent, callback: Function) => void
  getSize: () => Size
  getPosition: () => Position
  isDestroyed: () => boolean

  _emit: (event: string, ...args: any[]) => void
  readonly callbacks: { [event in BrowserWindowEvent]: Function[] }

  index: number
  id: number
  title: string
}

const defaultSize = { width: 16, height: 9 }
const defaultPosition = { top: 2, left: 5 }

export function makeBrowserWindow ({ windows = [], focusedWindow = null } = {}): BrowserWindowStatic {
  const FakeBrowserWindow: BrowserWindowStatic = class implements BrowserWindow {
    public index: number

    public readonly title: string
    public readonly id: number

    private readonly size: Size
    private readonly position: Position

    readonly callbacks: { [event in BrowserWindowEvent]: Function[] } = {
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

    private static _browserWindows: BrowserWindow[] = windows
    private static _focusedWindow: number|null = focusedWindow

    constructor (id: number, title: string, { size = defaultSize, position = defaultPosition } = {}) {
      this.id = id
      this.title = title
      this.size = [size.width, size.height]
      this.position = [position.left, position.top]

      this.index = (FakeBrowserWindow as any)._browserWindows.length
      ;(FakeBrowserWindow as any)._browserWindows.push(this)
    }

    static getAllWindows (): BrowserWindow[] {
      return this._browserWindows
    }

    static getFocusedWindow (): BrowserWindow|null {
      if (this._focusedWindow === null) {
        return null
      }

      if (this._browserWindows.length <= this._focusedWindow) {
        return null
      }

      return this._browserWindows[this._focusedWindow]
    }

    on (event: BrowserWindowEvent, callback: Function): void {
      this._assertNotDestroyed()

      this.callbacks[event].push(callback)
    }

    getSize (): Size {
      this._assertNotDestroyed()

      return this.size
    }

    getPosition (): Position {
      this._assertNotDestroyed()

      return this.position
    }

    destroy (): void {
      // > Force closing the window, the unload and beforeunload event won't be
      // > emitted for the web page, and close event will also not be emitted for
      // > this window, but it guarantees the closed event will be emitted.
      // > https://www.electronjs.org/docs/latest/api/browser-window#windestroy
      this._emit('closed')

      this._isDestroyed = true
    }

    isDestroyed (): boolean {
      return this._isDestroyed
    }

    _assertNotDestroyed (): void {
      if (this._isDestroyed) {
        throw new TypeError('Object has been destroyed')
      }
    }

    _emit (event: string, ...args: any[]): void {
      this.callbacks[event as BrowserWindowEvent].forEach(cb => { cb(null, ...args) })
    }

    static _blur (): void {
      this._focusedWindow = null
    }

    static _focus (index: number): void {
      if (index >= this._browserWindows.length) {
        throw new Error(`Index ${index} out of range`)
      }

      this._focusedWindow = index
    }

    static _create (): BrowserWindow {
      const newWindow = new FakeBrowserWindow(111222333, 'window window window')

      this._browserWindows.push(newWindow)

      return newWindow
    }

    static _close (window: BrowserWindow): void {
      this._browserWindows = this._browserWindows.filter(w => w !== window)

      if (this._focusedWindow === window.index) {
        this._focusedWindow = null
      } else {
        this._focusedWindow = this._browserWindows.indexOf(window)
      }

      window.callbacks.closed.forEach(f => { f() })
    }
  }

  return FakeBrowserWindow
}
