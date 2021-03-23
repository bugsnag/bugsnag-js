// https://www.electronjs.org/docs/api/screen

type ScreenEvent
  = 'display-added'
  | 'display-removed'
  | 'display-metrics-changed'

class Screen {
  private scaleFactor = 1.0
  private size = { width: 1234, height: 5678 }
  private rotation = 0

  private readonly callbacks: { [event in ScreenEvent]: Function[] } = {
    'display-added': [],
    'display-removed': [],
    'display-metrics-changed': []
  }

  getPrimaryDisplay () {
    return {
      id: 'primary-display-id',
      scaleFactor: this.scaleFactor,
      size: this.size,
      rotation: this.rotation
    }
  }

  on (event: ScreenEvent, callback: Function): void {
    this.callbacks[event].push(callback)
  }

  _emit (
    event: ScreenEvent,
    { size = this.size, scaleFactor = this.scaleFactor, rotation = this.rotation, primaryDisplay = true } = {}
  ): void {
    if (event !== 'display-metrics-changed') {
      throw new Error(`unsupported event type: '${event}'`)
    }

    const changedMetrics: string[] = []

    if (this.size !== size) {
      changedMetrics.push('bounds')
    }

    if (this.scaleFactor !== scaleFactor) {
      changedMetrics.push('scaleFactor')
    }

    if (this.rotation !== rotation) {
      changedMetrics.push('rotation')
    }

    let display

    if (primaryDisplay) {
      this.size = size
      this.scaleFactor = scaleFactor
      this.rotation = rotation

      display = this.getPrimaryDisplay()
    } else {
      display = { id: 'not-primary-display-id', size, scaleFactor, rotation }
    }

    this.callbacks[event].forEach(cb => { cb(null, display, changedMetrics) })
  }
}

export function makeScreen () {
  return new Screen()
}
