// https://www.electronjs.org/docs/api/screen

import { Display, makeDisplay } from './Display'

type ScreenEvent
  = 'display-added'
  | 'display-removed'
  | 'display-metrics-changed'

class Screen {
  private readonly callbacks: { [event in ScreenEvent]: Function[] } = {
    'display-added': [],
    'display-removed': [],
    'display-metrics-changed': []
  }

  private readonly primaryDisplay: Display

  constructor ({ primaryDisplay = makeDisplay() } = {}) {
    this.primaryDisplay = primaryDisplay
  }

  getPrimaryDisplay (): Display {
    return this.primaryDisplay
  }

  on (event: ScreenEvent, callback: Function): void {
    this.callbacks[event].push(callback)
  }

  _emit (event: ScreenEvent, ...args: any[]): void {
    this.callbacks[event].forEach(cb => { cb(null, ...args) })
  }
}

export function makeScreen (...args) {
  return new Screen(...args)
}
