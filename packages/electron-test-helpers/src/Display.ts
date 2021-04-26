// https://www.electronjs.org/docs/api/structures/display

interface Size {
  width: number
  height: number
}

interface Rectangle extends Size {
  x: number
  y: number
}

export class Display {
  public id: number
  public rotation: number
  public scaleFactor: number
  public touchSupport: string
  public monochrome: boolean
  public accelerometerSupport: string
  public colorSpace: string
  public colorDepth: number
  public depthPerComponent: number
  public displayFrequency: number
  public bounds: Rectangle
  public size: Size
  public workArea: Rectangle
  public workAreaSize: Size
  public internal: boolean

  constructor ({
    id = 1234,
    rotation = 0,
    scaleFactor = 1.0,
    touchSupport = 'unknown',
    monochrome = false,
    accelerometerSupport = 'unknown',
    colorSpace = 'a really good one ?',
    colorDepth = 64,
    depthPerComponent = 8,
    displayFrequency = 144,
    bounds = { x: 1, y: 2, width: 3, height: 4 },
    size = { width: 1234, height: 5678 },
    workArea = { x: 5, y: 6, width: 7, height: 8 },
    workAreaSize = { width: 100, height: 200 },
    internal = false
  } = {}) {
    this.id = id
    this.rotation = rotation
    this.scaleFactor = scaleFactor
    this.touchSupport = touchSupport
    this.monochrome = monochrome
    this.accelerometerSupport = accelerometerSupport
    this.colorSpace = colorSpace
    this.colorDepth = colorDepth
    this.depthPerComponent = depthPerComponent
    this.displayFrequency = displayFrequency
    this.bounds = bounds
    this.size = size
    this.workArea = workArea
    this.workAreaSize = workAreaSize
    this.internal = internal
  }
}

export function makeDisplay (args?: any) {
  return new Display(args)
}
