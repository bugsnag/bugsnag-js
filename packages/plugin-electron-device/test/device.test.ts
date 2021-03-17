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
  totalMemory: 100, // this is in KiB to match Electron's API
  usingBattery: false,
  isLocked: false
}

// expected data for 'session.device'
const makeExpectedSessionDevice = (customisations = {}) => ({
  totalMemory: DEFAULTS.totalMemory * 1024,
  id: DEFAULTS.id,
  locale: DEFAULTS.locale,
  osName: DEFAULTS.platform,
  osVersion: DEFAULTS.osVersion,
  runtimeVersions: DEFAULTS.versions,
  ...customisations
})

// expected data for 'event.device'
const makeExpectedEventDevice = (customisations = {}) => ({
  ...makeExpectedSessionDevice(),
  time: DEFAULTS.time,
  freeMemory: DEFAULTS.freeMemory * 1024,
  ...customisations
})

// expected data for 'event.metadata.device'
const makeExpectedMetadataDevice = (customisations = {}) => ({
  isLocked: DEFAULTS.isLocked,
  screenDensity: DEFAULTS.screenDensity,
  screenResolution: DEFAULTS.screenResolution,
  usingBattery: DEFAULTS.usingBattery,
  ...customisations
})

describe('plugin: electron device info', () => {
  it('syncs device information to the NativeClient', async () => {
    const NativeClient = makeNativeClient()

    makeClient({ NativeClient })

    const { id, ...expected } = makeExpectedSessionDevice()

    expect(NativeClient.setDevice).toHaveBeenNthCalledWith(1, expected)

    // give the filestore time to resolve the device ID
    await nextTick()

    expect(NativeClient.setDevice).toHaveBeenNthCalledWith(2, { ...expected, id })
  })

  it('handles exceptions thrown by the NativeClient', async () => {
    const NativeClient = {
      setDevice: jest.fn().mockImplementation(() => { throw new Error('abc') })
    }

    makeClient({ NativeClient })

    const { id, ...expected } = makeExpectedSessionDevice()

    expect(NativeClient.setDevice).toHaveBeenNthCalledWith(1, expected)

    // give the filestore time to resolve the device ID
    await nextTick()

    expect(NativeClient.setDevice).toHaveBeenNthCalledWith(2, { ...expected, id })
  })

  it('reports basic device information', async () => {
    const { sendEvent, sendSession } = makeClient()

    // give the filestore time to resolve the device ID
    await nextTick()

    const event = await sendEvent()
    expect(event.device).toEqual(makeExpectedEventDevice())
    expect(event.getMetadata('device')).toEqual(makeExpectedMetadataDevice())

    const session = await sendSession()
    expect(session.device).toEqual(makeExpectedSessionDevice())
  })

  it('reports correct OS for macOS', async () => {
    const process = makeProcess({ platform: 'darwin' })

    const { sendEvent, sendSession } = makeClient({ process })

    await nextTick()

    const event = await sendEvent()
    expect(event.device).toEqual(makeExpectedEventDevice({ osName: 'macOS' }))

    const session = await sendSession()
    expect(session.device).toEqual(makeExpectedSessionDevice({ osName: 'macOS' }))
  })

  it('reports correct OS for Linux', async () => {
    const process = makeProcess({ platform: 'linux' })

    const { sendEvent, sendSession } = makeClient({ process })

    await nextTick()

    const event = await sendEvent()
    expect(event.device).toEqual(makeExpectedEventDevice({ osName: 'Linux' }))

    const session = await sendSession()
    expect(session.device).toEqual(makeExpectedSessionDevice({ osName: 'Linux' }))
  })

  it('reports correct OS for Windows', async () => {
    const process = makeProcess({ platform: 'win32' })

    const { sendEvent, sendSession } = makeClient({ process })

    await nextTick()

    const event = await sendEvent()
    expect(event.device).toEqual(makeExpectedEventDevice({ osName: 'Windows' }))

    const session = await sendSession()
    expect(session.device).toEqual(makeExpectedSessionDevice({ osName: 'Windows' }))
  })

  // in theory this is impossible as Chromium should always return a primary
  // display even there is no display; we handle it anyway just to be safe
  it('does not report screen information if there is no primary display', async () => {
    const screen = { getPrimaryDisplay: () => undefined, on: () => {} }

    // @ts-expect-error
    const { sendEvent, sendSession } = makeClient({ screen })

    await nextTick()

    const expectedEvent = makeExpectedEventDevice({ screenResolution: undefined, screenDensity: undefined })
    const expectedSession = makeExpectedSessionDevice({ screenResolution: undefined, screenDensity: undefined })

    const event = await sendEvent()
    expect(event.device).toEqual(expectedEvent)

    const session = await sendSession()
    expect(session.device).toEqual(expectedSession)
  })

  it('reports correct screen information if primary display is changed', async () => {
    const screen = makeScreen()

    const { sendEvent, sendSession } = makeClient({ screen })

    await nextTick()

    const event = await sendEvent()
    expect(event.device).toEqual(makeExpectedEventDevice())
    expect(event.getMetadata('device')).toEqual(makeExpectedMetadataDevice())

    const session = await sendSession()
    expect(session.device).toEqual(makeExpectedSessionDevice())

    screen._emitDisplayMetricsChangedEvent({
      size: { width: 100, height: 200 },
      scaleFactor: 2.5
    })

    const event2 = await sendEvent()
    expect(event2.device).toEqual(makeExpectedEventDevice())
    expect(event2.getMetadata('device')).toEqual(makeExpectedMetadataDevice({
      screenDensity: 2.5,
      screenResolution: { width: 100, height: 200 }
    }))

    const session2 = await sendSession()
    expect(session2.device).toEqual(makeExpectedSessionDevice())
  })

  it('does not update screen information if a secondary display is changed', async () => {
    const screen = makeScreen()

    const { sendEvent, sendSession } = makeClient({ screen })

    await nextTick()

    const expectedEvent = makeExpectedEventDevice()
    const expectedSession = makeExpectedSessionDevice()

    const event = await sendEvent()
    expect(event.device).toEqual(expectedEvent)

    const session = await sendSession()
    expect(session.device).toEqual(expectedSession)

    screen._emitDisplayMetricsChangedEvent({
      size: { width: 100, height: 200 },
      scaleFactor: 2.5,
      primaryDisplay: false
    })

    const event2 = await sendEvent()
    expect(event2.device).toEqual(expectedEvent)

    const session2 = await sendSession()
    expect(session2.device).toEqual(expectedSession)
  })

  it('does not update screen information if the update is not relevant', async () => {
    const screen = makeScreen()
    const NativeClient = makeNativeClient()

    const { sendEvent, sendSession } = makeClient({ screen, NativeClient })

    expect(NativeClient.setDevice).toHaveBeenCalledTimes(1)

    await nextTick()

    const event = await sendEvent()
    expect(event.device).toEqual(makeExpectedEventDevice())

    const session = await sendSession()
    expect(session.device).toEqual(makeExpectedSessionDevice())

    expect(NativeClient.setDevice).toHaveBeenCalledTimes(2)

    screen._emitDisplayMetricsChangedEvent({ rotation: 270 })

    expect(NativeClient.setDevice).toHaveBeenCalledTimes(2)
  })

  it('reports correct device.id when one has been cached', async () => {
    const id = 'aoidjoahefodhadowhjoawjdopajp'

    const filestore = makeFilestore(id)

    const { sendEvent, sendSession } = makeClient({ filestore })

    await nextTick()

    const event = await sendEvent()
    expect(event.device).toEqual(makeExpectedEventDevice({ id }))

    const session = await sendSession()
    expect(session.device).toEqual(makeExpectedSessionDevice({ id }))
  })

  it('does not add device.id when one is not created', async () => {
    const filestore = { getDeviceInfo: jest.fn().mockResolvedValue({}) }

    // @ts-expect-error
    const { sendEvent, sendSession } = makeClient({ filestore })

    await nextTick()

    const event = await sendEvent()
    expect(event.device).toEqual(makeExpectedEventDevice({ id: undefined }))
    expect(event.device).not.toHaveProperty('id')

    const session = await sendSession()
    expect(session.device).toEqual(makeExpectedSessionDevice({ id: undefined }))
    expect(session.device).not.toHaveProperty('id')
  })

  it('handles filestore errors from getDeviceInfo()', async () => {
    const filestore = {
      async getDeviceInfo () {
        throw new Error('insert disk 2')
      },
      async setDeviceInfo (deviceInfo) {}
    }

    const { client, sendEvent, sendSession } = makeClient({ filestore })

    await nextTick()

    const expectedEvent = makeExpectedEventDevice({ id: undefined })
    const expectedSession = makeExpectedSessionDevice({ id: undefined })

    const event = await sendEvent()
    expect(event.device).toEqual(expectedEvent)

    const session = await sendSession()
    expect(session.device).toEqual(expectedSession)

    expect(client._logger.error).toHaveBeenCalledTimes(1)
    expect(client._logger.error).toHaveBeenCalledWith(new Error('insert disk 2'))
  })

  it('records initial battery and locked state', async () => {
    const powerMonitor = makePowerMonitor({ usingBattery: true, isLocked: true })

    const { sendEvent, sendSession } = makeClient({ powerMonitor })

    await nextTick()

    const expectedMetadata = makeExpectedMetadataDevice({ usingBattery: true, isLocked: true })

    const event = await sendEvent()
    expect(event.device).toEqual(makeExpectedEventDevice())
    expect(event.getMetadata('device')).toEqual(expectedMetadata)

    const session = await sendSession()
    expect(session.device).toEqual(makeExpectedSessionDevice())
  })

  it('records changes to battery state', async () => {
    const powerMonitor = makePowerMonitor()

    const { sendEvent } = makeClient({ powerMonitor })

    await nextTick()

    const event = await sendEvent()
    expect(event.getMetadata('device')).toEqual(makeExpectedMetadataDevice({ usingBattery: false }))

    powerMonitor._unplug()

    const event2 = await sendEvent()
    expect(event2.getMetadata('device')).toEqual(makeExpectedMetadataDevice({ usingBattery: true }))

    powerMonitor._plugIn()

    const event3 = await sendEvent()
    expect(event3.getMetadata('device')).toEqual(makeExpectedMetadataDevice({ usingBattery: false }))
  })

  it('records changes to locked state', async () => {
    const powerMonitor = makePowerMonitor()

    const { sendEvent } = makeClient({ powerMonitor })

    await nextTick()

    const event = await sendEvent()
    expect(event.getMetadata('device')).toEqual(makeExpectedMetadataDevice({ isLocked: false }))

    powerMonitor._lock()

    const event2 = await sendEvent()
    expect(event2.getMetadata('device')).toEqual(makeExpectedMetadataDevice({ isLocked: true }))

    powerMonitor._unlock()

    const event3 = await sendEvent()
    expect(event3.getMetadata('device')).toEqual(makeExpectedMetadataDevice({ isLocked: false }))
  })
})

function makeClient ({
  app = makeApp(),
  screen = makeScreen(),
  process = makeProcess(),
  filestore = makeFilestore(),
  NativeClient = makeNativeClient(),
  powerMonitor = makePowerMonitor()
} = {}): Client {
  const client = new Client(
    { apiKey: 'api_key' },
    undefined,
    [plugin(app, screen, process, filestore, NativeClient, powerMonitor)]
  )

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
    async getDeviceInfo (): Promise<{ id?: string|null }> {
      return _deviceInfo
    },
    async setDeviceInfo (deviceInfo) {
      _deviceInfo = deviceInfo
    }
  }
}

function makeNativeClient () {
  return {
    setDevice: jest.fn()
  }
}

function makePowerMonitor ({
  usingBattery = DEFAULTS.usingBattery,
  isLocked = DEFAULTS.isLocked
} = {}) {
  const callbacks: { [event: string]: Function[] } = {
    'on-ac': [],
    'on-battery': [],
    'lock-screen': [],
    'unlock-screen': []
  }

  return {
    on (event, callback) {
      callbacks[event].push(callback)
    },
    getSystemIdleState (idleThreshold) {
      if (idleThreshold > 0) {
        return isLocked ? 'locked' : 'active'
      }

      // https://github.com/electron/electron/blob/a9924e1c32e8445887e3a6b5cdff445d93c2b18f/shell/browser/api/electron_api_power_monitor.cc#L129-L130
      throw new TypeError('Invalid idle threshold, must be greater than 0')
    },
    get onBatteryPower () {
      return usingBattery
    },

    _plugIn () {
      usingBattery = false
      callbacks['on-ac'].forEach(cb => { cb() })
    },
    _unplug () {
      usingBattery = true
      callbacks['on-battery'].forEach(cb => { cb() })
    },
    _lock () {
      isLocked = true
      callbacks['lock-screen'].forEach(cb => { cb() })
    },
    _unlock () {
      isLocked = false
      callbacks['unlock-screen'].forEach(cb => { cb() })
    }
  }
}
