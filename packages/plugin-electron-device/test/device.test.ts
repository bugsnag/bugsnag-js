import Client from '@bugsnag/core/client'
import Event from '@bugsnag/core/event'
import plugin from '../'

const nextTick = async () => await new Promise(process.nextTick)

const DEFAULTS = {
  freeMemory: 25, // this is in KiB to match Electron's API
  id: 'abcdefghijklmnopqrstuvwxyz',
  locale: 'en-GB',
  platform: 'serenity',
  osVersion: '10.20.30',
  versions: {
    node: '1.1.1',
    chrome: '22.22.22',
    electron: '333.333.333'
  },
  screenDensity: 1.0,
  screenResolution: {
    width: 1234,
    height: 5678
  },
  time: expect.any(Date),
  totalMemory: 100 // this is in KiB to match Electron's API
}

const makeExpectedDevice = (customisations = {}) => ({
  totalMemory: DEFAULTS.totalMemory * 1024,
  id: DEFAULTS.id,
  locale: DEFAULTS.locale,
  osName: DEFAULTS.platform,
  osVersion: DEFAULTS.osVersion,
  runtimeVersions: DEFAULTS.versions,
  screenDensity: DEFAULTS.screenDensity,
  screenResolution: DEFAULTS.screenResolution,
  time: DEFAULTS.time,
  freeMemory: DEFAULTS.freeMemory * 1024,
  ...customisations
})

describe('plugin: electron device info', () => {
  it('attaches device information to the client', async () => {
    const app = makeApp()
    const screen = makeScreen()
    const process = makeProcess()
    const filestore = makeFilestore()

    const { client } = makeClient(app, screen, process, filestore)

    const { id, time, freeMemory, ...expected } = makeExpectedDevice()

    expect(client.getMetadata('device')).toEqual(expected)

    // give the filestore time to resolve the device ID
    await nextTick()

    // @ts-expect-error
    expected.id = id

    expect(client.getMetadata('device')).toEqual(expected)
  })

  it('reports basic device information', async () => {
    const app = makeApp()
    const screen = makeScreen()
    const process = makeProcess()
    const filestore = makeFilestore()

    const { sendEvent, sendSession } = makeClient(app, screen, process, filestore)

    // give the filestore time to resolve the device ID
    await nextTick()

    const expected = makeExpectedDevice()

    const event = await sendEvent()
    expect(event.device).toEqual(expected)

    const session = await sendSession()
    expect(session.device).toEqual(expected)
  })

  it('reports correct OS for macOS', async () => {
    const app = makeApp()
    const screen = makeScreen()
    const process = makeProcess({ platform: 'darwin' })
    const filestore = makeFilestore()

    const { sendEvent, sendSession } = makeClient(app, screen, process, filestore)

    await nextTick()

    const expected = makeExpectedDevice({ osName: 'macOS' })

    const event = await sendEvent()
    expect(event.device).toEqual(expected)

    const session = await sendSession()
    expect(session.device).toEqual(expected)
  })

  it('reports correct OS for Linux', async () => {
    const app = makeApp()
    const screen = makeScreen()
    const process = makeProcess({ platform: 'linux' })
    const filestore = makeFilestore()

    const { sendEvent, sendSession } = makeClient(app, screen, process, filestore)

    await nextTick()

    const expected = makeExpectedDevice({ osName: 'Linux' })

    const event = await sendEvent()
    expect(event.device).toEqual(expected)

    const session = await sendSession()
    expect(session.device).toEqual(expected)
  })

  it('reports correct OS for Windows', async () => {
    const app = makeApp()
    const screen = makeScreen()
    const process = makeProcess({ platform: 'win32' })
    const filestore = makeFilestore()

    const { sendEvent, sendSession } = makeClient(app, screen, process, filestore)

    await nextTick()

    const expected = makeExpectedDevice({ osName: 'Windows' })

    const event = await sendEvent()
    expect(event.device).toEqual(expected)

    const session = await sendSession()
    expect(session.device).toEqual(expected)
  })

  // in theory this is impossible as Chromium should always return a primary
  // display even there is no display; we handle it anyway just to be safe
  it('does not report screen information if there is no primary display', async () => {
    const app = makeApp()
    const screen = { getPrimaryDisplay: () => undefined, on: () => {} }
    const process = makeProcess()
    const filestore = makeFilestore()

    const { sendEvent, sendSession } = makeClient(app, screen, process, filestore)

    await nextTick()

    const { screenResolution, screenDensity, ...expected } = makeExpectedDevice()

    const event = await sendEvent()
    expect(event.device).toEqual(expected)

    const session = await sendSession()
    expect(session.device).toEqual(expected)
  })

  it('reports correct screen information if primary display is changed', async () => {
    const app = makeApp()
    const screen = makeScreen()
    const process = makeProcess()
    const filestore = makeFilestore()

    const { sendEvent, sendSession } = makeClient(app, screen, process, filestore)

    await nextTick()

    const expected = makeExpectedDevice()

    const event = await sendEvent()
    expect(event.device).toEqual(expected)

    const session = await sendSession()
    expect(session.device).toEqual(expected)

    screen._emitDisplayMetricsChangedEvent({
      size: { width: 100, height: 200 },
      scaleFactor: 2.5
    })

    const expected2 = {
      ...expected,
      screenDensity: 2.5,
      screenResolution: { width: 100, height: 200 }
    }

    const event2 = await sendEvent()
    expect(event2.device).toEqual(expected2)

    const session2 = await sendSession()
    expect(session2.device).toEqual(expected2)
  })

  it('does not update screen information if a secondary display is changed', async () => {
    const app = makeApp()
    const screen = makeScreen()
    const process = makeProcess()
    const filestore = makeFilestore()

    const { sendEvent, sendSession } = makeClient(app, screen, process, filestore)

    await nextTick()

    const expected = makeExpectedDevice()

    const event = await sendEvent()
    expect(event.device).toEqual(expected)

    const session = await sendSession()
    expect(session.device).toEqual(expected)

    screen._emitDisplayMetricsChangedEvent({
      size: { width: 100, height: 200 },
      scaleFactor: 2.5,
      primaryDisplay: false
    })

    const event2 = await sendEvent()
    expect(event2.device).toEqual(expected)

    const session2 = await sendSession()
    expect(session2.device).toEqual(expected)
  })

  it('does not update screen information if the update is not relevant', async () => {
    const app = makeApp()
    const screen = makeScreen()
    const process = makeProcess()
    const filestore = makeFilestore()

    const { client, sendEvent, sendSession } = makeClient(app, screen, process, filestore)

    client.addMetadata = jest.fn()

    await nextTick()

    const expected = makeExpectedDevice()

    const event = await sendEvent()
    expect(event.device).toEqual(expected)

    const session = await sendSession()
    expect(session.device).toEqual(expected)

    expect(client.addMetadata).toHaveBeenCalledTimes(1)

    screen._emitDisplayMetricsChangedEvent({ rotation: 270 })

    expect(client.addMetadata).toHaveBeenCalledTimes(1)
  })

  it('reports correct device.id when one has been cached', async () => {
    const id = 'aoidjoahefodhadowhjoawjdopajp'

    const app = makeApp()
    const screen = makeScreen()
    const process = makeProcess()
    const filestore = makeFilestore(id)

    const { sendEvent, sendSession } = makeClient(app, screen, process, filestore)

    await nextTick()

    const expected = makeExpectedDevice({ id })

    const event = await sendEvent()
    expect(event.device).toEqual(expected)

    const session = await sendSession()
    expect(session.device).toEqual(expected)
  })

  it('creates a new device.id when one has not been cached', async () => {
    const app = makeApp()
    const screen = makeScreen()
    const process = makeProcess()
    const filestore = makeFilestore(null)

    const { sendEvent, sendSession } = makeClient(app, screen, process, filestore)

    await nextTick()

    const expected = makeExpectedDevice({
      // a regex that should always match any valid cuid
      id: expect.stringMatching(/^c[a-z0-9]{20,32}$/)
    })

    const event = await sendEvent()
    expect(event.device).toEqual(expected)

    const session = await sendSession()
    expect(session.device).toEqual(expected)
  })

  it('handles filestore errors from getDeviceInfo()', async () => {
    const app = makeApp()
    const screen = makeScreen()
    const process = makeProcess()
    const filestore = {
      async getDeviceInfo () {
        throw new Error('insert disk 2')
      }
    }

    const { client, sendEvent, sendSession } = makeClient(app, screen, process, filestore)

    await nextTick()

    const { id, ...expected } = makeExpectedDevice()

    const event = await sendEvent()
    expect(event.device).toEqual(expected)

    const session = await sendSession()
    expect(session.device).toEqual(expected)

    expect(client._logger.error).toHaveBeenCalledTimes(1)
    expect(client._logger.error).toHaveBeenCalledWith(new Error('insert disk 2'))
  })

  it('handles filestore errors from setDeviceInfo()', async () => {
    const app = makeApp()
    const screen = makeScreen()
    const process = makeProcess()
    const filestore = {
      async getDeviceInfo () {
        return {}
      },
      async setDeviceInfo (info) {
        throw new Error('no room on memory card')
      }
    }

    const { client, sendEvent, sendSession } = makeClient(app, screen, process, filestore)

    await nextTick()

    const { id, ...expected } = makeExpectedDevice()

    const event = await sendEvent()
    expect(event.device).toEqual(expected)

    const session = await sendSession()
    expect(session.device).toEqual(expected)

    expect(client._logger.error).toHaveBeenCalledTimes(1)
    expect(client._logger.error).toHaveBeenCalledWith(new Error('no room on memory card'))
  })
})

function makeClient (...pluginArgs: any[]): Client {
  const client = new Client({ apiKey: 'api_key' }, undefined, [plugin(...pluginArgs)])

  let lastSession

  client._setDelivery(() => ({
    sendEvent (payload, cb) {
      expect(payload.events).toHaveLength(1)
      cb(payload.events[0])
    },
    sendSession (session) {
      expect(session).toBeTruthy()
      lastSession = session
    }
  }))

  client._sessionDelegate = {
    startSession (client, session) {
      client._delivery.sendSession(session)
    }
  }

  client._logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }

  const sendEvent = async () => await new Promise(resolve => {
    client._notify(new Event('Error', 'incorrect lambda type'), () => {}, resolve)
  })

  const sendSession = async () => await new Promise(resolve => {
    const lastSessionBefore = lastSession

    const resolveIfSessionSent = () => {
      if (lastSession !== lastSessionBefore) {
        resolve(lastSession)
        return
      }

      setTimeout(resolveIfSessionSent, 1)
    }

    resolveIfSessionSent()

    client.startSession()
  })

  return { client, sendEvent, sendSession }
}

// create a stub of electron's 'app'
function makeApp (locale = DEFAULTS.locale) {
  return { getLocale: () => locale }
}

// create a stub of electron's 'screen'
function makeScreen () {
  let _scaleFactor = DEFAULTS.screenDensity
  let _size = DEFAULTS.screenResolution
  let _rotation = 0
  let _callback = (event, display, changedMetrics) => {
    throw new Error('no callback provided!')
  }

  const getPrimaryDisplay = () => ({
    id: 'primary-display-id',
    scaleFactor: _scaleFactor,
    size: _size,
    rotation: _rotation
  })

  return {
    getPrimaryDisplay,
    on (eventName: string, callback: typeof _callback) {
      if (eventName !== 'display-metrics-changed') {
        throw new Error(`Unexpected event '${eventName}'`)
      }

      _callback = callback
    },
    _emitDisplayMetricsChangedEvent ({
      size = _size,
      scaleFactor = _scaleFactor,
      rotation = _rotation,
      primaryDisplay = true
    } = {}) {
      const changedMetrics: string[] = []

      if (_size !== size) {
        changedMetrics.push('bounds')
      }

      if (_scaleFactor !== scaleFactor) {
        changedMetrics.push('scaleFactor')
      }

      if (_rotation !== rotation) {
        changedMetrics.push('rotation')
      }

      const event = {}
      let display

      if (primaryDisplay) {
        _size = size
        _scaleFactor = scaleFactor
        _rotation = rotation
        display = getPrimaryDisplay()
      } else {
        display = { size, scaleFactor, rotation }
      }

      _callback(event, display, changedMetrics)
    }
  }
}

// create a stub of the Node 'process'
function makeProcess ({
  total = DEFAULTS.totalMemory,
  free = DEFAULTS.freeMemory,
  platform = DEFAULTS.platform,
  osVersion = DEFAULTS.osVersion,
  versions = DEFAULTS.versions
} = {}) {
  return {
    getSystemMemoryInfo: () => ({ total, free }),
    getSystemVersion: () => osVersion,
    versions,
    platform
  }
}

// create a stub of '@bugsnag/electron-filestore'
function makeFilestore (id: string|null|undefined = DEFAULTS.id) {
  let _deviceInfo = { id }

  return {
    async getDeviceInfo () {
      return _deviceInfo
    },
    async setDeviceInfo (deviceInfo) {
      _deviceInfo = deviceInfo
    }
  }
}
