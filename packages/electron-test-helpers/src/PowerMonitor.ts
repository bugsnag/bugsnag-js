// https://www.electronjs.org/docs/api/power-monitor

export type PowerMonitorEvent
  = 'suspend'
  | 'resume'
  | 'on-ac'
  | 'on-battery'
  | 'shutdown'
  | 'lock-screen'
  | 'unlock-screen'
  | 'user-did-become-active'
  | 'user-did-resign-active'

class PowerMonitor {
  private readonly callbacks: { [event in PowerMonitorEvent]: Function[] } = {
    suspend: [],
    resume: [],
    'on-ac': [],
    'on-battery': [],
    shutdown: [],
    'lock-screen': [],
    'unlock-screen': [],
    'user-did-become-active': [],
    'user-did-resign-active': []
  }

  private usingBattery: boolean
  private isLocked: boolean

  constructor ({
    usingBattery = false,
    isLocked = false
  } = {}) {
    this.usingBattery = usingBattery
    this.isLocked = isLocked
  }

  on (event: PowerMonitorEvent, callback: Function): void {
    this.callbacks[event].push(callback)
  }

  getSystemIdleState (idleThreshold) {
    if (idleThreshold > 0) {
      return this.isLocked ? 'locked' : 'active'
    }

    // https://github.com/electron/electron/blob/a9924e1c32e8445887e3a6b5cdff445d93c2b18f/shell/browser/api/electron_api_power_monitor.cc#L129-L130
    throw new TypeError('Invalid idle threshold, must be greater than 0')
  }

  get onBatteryPower () {
    return this.usingBattery
  }

  _emit (event: PowerMonitorEvent): void {
    this._handleEvent(event)

    this.callbacks[event].forEach(cb => { cb() })
  }

  private _handleEvent (event: PowerMonitorEvent): void {
    switch (event) {
      case 'on-ac':
        this.usingBattery = false
        break

      case 'on-battery':
        this.usingBattery = true
        break

      case 'lock-screen':
        this.isLocked = true
        break

      case 'unlock-screen':
        this.isLocked = false
        break
    }
  }
}

export function makePowerMonitor (...args): PowerMonitor {
  return new PowerMonitor(...args)
}
