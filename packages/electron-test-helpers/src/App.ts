// https://www.electronjs.org/docs/api/app

import { BrowserWindow, BrowserWindowStatic, makeBrowserWindow } from './BrowserWindow'

type AppEvent
  = 'browser-window-focus'
  | 'browser-window-blur'
  | 'browser-window-created'
  | 'ready'
  | 'will-quit'
  | 'child-process-gone'
  | 'render-process-gone'

export class App {
  private readonly callbacks: { [event in AppEvent]: Function[] } = {
    ready: [],
    'will-quit': [],
    'browser-window-blur': [],
    'browser-window-focus': [],
    'browser-window-created': [],
    'child-process-gone': [],
    'render-process-gone': []
  }

  private readonly locale: string
  private readonly BrowserWindow: BrowserWindowStatic
  private readonly version: string

  public readonly name: string
  public readonly isPackaged: boolean

  constructor (
    locale: string,
    BrowserWindow: BrowserWindowStatic,
    isPackaged: boolean,
    version: string,
    name: string
  ) {
    this.locale = locale
    this.BrowserWindow = BrowserWindow
    this.isPackaged = isPackaged
    this.version = version
    this.name = name
  }

  getLocale (): string {
    return this.locale
  }

  getVersion (): string {
    return this.version
  }

  getName (): string {
    return this.name
  }

  async whenReady (): Promise<void> {
    // this doesn't need to do anything - it will resolve on the next tick
  }

  on (event: AppEvent, callback: Function): void {
    this.callbacks[event].push(callback)
  }

  listenerCount (event: AppEvent): number {
    return this.callbacks[event].length
  }

  _emit (event: string, ...args: any[]): void {
    switch (event) {
      case 'browser-window-blur':
        return this._emitBlurEvent(...args)

      case 'browser-window-focus':
        return this._emitFocusEvent(...args)
    }

    this.callbacks[event as AppEvent].forEach(cb => { cb(null, ...args) })
  }

  _emitBlurEvent (maybeWindow?: BrowserWindow) {
    this.BrowserWindow._blur()
    this.callbacks['browser-window-blur'].forEach(cb => { cb(null, maybeWindow) })
  }

  _emitFocusEvent (maybeWindow?: BrowserWindow) {
    const window = maybeWindow === undefined
      ? this.BrowserWindow.getAllWindows()[0]
      : maybeWindow

    this.BrowserWindow._focus(window.index)
    this.callbacks['browser-window-focus'].forEach(cb => { cb(null, window) })
  }

  _createWindow () {
    const newWindow = this.BrowserWindow._create()
    this.callbacks['browser-window-created'].forEach(cb => { cb(null, newWindow) })

    this._emitFocusEvent(newWindow)
  }

  _closeWindow (window: BrowserWindow) {
    // electron doesn't blur the very last window to close
    if (this.BrowserWindow.getAllWindows().length > 1) {
      this._emitBlurEvent()
    }

    this.BrowserWindow._close(window)
  }
}

export function makeApp ({
  locale = 'en-GB',
  BrowserWindow = makeBrowserWindow(),
  isPackaged = true,
  version = '1.2.3',
  name = 'my cool app :^)'
} = {}): App {
  return new App(locale, BrowserWindow, isPackaged, version, name)
}
