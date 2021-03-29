import { makeApp, makeClientForPlugin, makeDisplay, makePowerMonitor, makeProcess, makeScreen } from '@bugsnag/electron-test-helpers'
import plugin from '../'

const nextTick = async () => await new Promise(process.nextTick)

function makeClient ({
  app = makeApp(),
  screen = makeScreen(),
  process = makeProcess(),
  filestore = makeFilestore(),
  NativeClient = makeNativeClient(),
  powerMonitor = makePowerMonitor()
} = {}) {
  return makeClientForPlugin({ plugin: plugin(app, screen, process, filestore, NativeClient, powerMonitor) })
}

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

  it('reports correct locale and OS for macOS', async () => {
    const process = makeProcess({ platform: 'darwin' })

    const { sendEvent, sendSession } = makeClient({ process })

    const expectedBeforeNextTick = makeExpectedEventDevice({ osName: 'macOS' })
    delete (expectedBeforeNextTick as any).id

    const event = await sendEvent()
    expect(event.device).toEqual(expectedBeforeNextTick)

    await nextTick()

    const event2 = await sendEvent()
    expect(event2.device).toEqual(makeExpectedEventDevice({ osName: 'macOS' }))

    const session = await sendSession()
    expect(session.device).toEqual(makeExpectedSessionDevice({ osName: 'macOS' }))
  })

  it('reports correct locale and OS for Linux', async () => {
    const process = makeProcess({ platform: 'linux' })

    const { sendEvent, sendSession } = makeClient({ process })

    const expectedBeforeNextTick = makeExpectedEventDevice({ osName: 'Linux' })
    delete (expectedBeforeNextTick as any).id

    const event = await sendEvent()
    expect(event.device).toEqual(expectedBeforeNextTick)

    await nextTick()

    const event2 = await sendEvent()
    expect(event2.device).toEqual(makeExpectedEventDevice({ osName: 'Linux' }))

    const session = await sendSession()
    expect(session.device).toEqual(makeExpectedSessionDevice({ osName: 'Linux' }))
  })

  it('reports correct locale and OS for Windows', async () => {
    // on windows, app.getLocale will return an empty string until the app is ready
    const app = makeApp()
    app.getLocale = jest.fn()
      .mockImplementationOnce(() => '')
      .mockImplementation(() => 'en-GB')

    const process = makeProcess({ platform: 'win32' })

    const { sendEvent, sendSession } = makeClient({ app, process })

    const expectedBeforeNextTick = makeExpectedEventDevice({ osName: 'Windows' })
    delete (expectedBeforeNextTick as any).id
    expectedBeforeNextTick.locale = ''

    const event = await sendEvent()
    expect(event.device).toEqual(expectedBeforeNextTick)

    await nextTick()

    const event2 = await sendEvent()
    expect(event2.device).toEqual(makeExpectedEventDevice({ osName: 'Windows' }))

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
    const primaryDisplay = makeDisplay()

    const screen = makeScreen({ primaryDisplay })

    const { sendEvent, sendSession } = makeClient({ screen })

    await nextTick()

    const event = await sendEvent()
    expect(event.device).toEqual(makeExpectedEventDevice())
    expect(event.getMetadata('device')).toEqual(makeExpectedMetadataDevice())

    const session = await sendSession()
    expect(session.device).toEqual(makeExpectedSessionDevice())

    primaryDisplay.size = { width: 100, height: 200 }
    primaryDisplay.scaleFactor = 2.5

    screen._emit('display-metrics-changed', primaryDisplay, ['bounds', 'scaleFactor'])

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
    const primaryDisplay = makeDisplay({ size: { width: 222, height: 3333 }, scaleFactor: 1000 })
    const secondaryDisplay = makeDisplay({ size: { width: 100, height: 200 }, scaleFactor: 2.5 })

    const screen = makeScreen({ primaryDisplay })

    const { sendEvent, sendSession } = makeClient({ screen })

    await nextTick()

    const expectedEvent = makeExpectedEventDevice()
    const expectedSession = makeExpectedSessionDevice()

    const event = await sendEvent()
    expect(event.device).toEqual(expectedEvent)

    const session = await sendSession()
    expect(session.device).toEqual(expectedSession)

    screen._emit('display-metrics-changed', secondaryDisplay, ['bounds', 'scaleFactor'])

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

    screen._emit('display-metrics-changed', makeDisplay({ rotation: 270 }), ['rotation'])

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

    powerMonitor._emit('on-battery')

    const event2 = await sendEvent()
    expect(event2.getMetadata('device')).toEqual(makeExpectedMetadataDevice({ usingBattery: true }))

    powerMonitor._emit('on-ac')

    const event3 = await sendEvent()
    expect(event3.getMetadata('device')).toEqual(makeExpectedMetadataDevice({ usingBattery: false }))
  })

  it('records changes to locked state', async () => {
    const powerMonitor = makePowerMonitor()

    const { sendEvent } = makeClient({ powerMonitor })

    await nextTick()

    const event = await sendEvent()
    expect(event.getMetadata('device')).toEqual(makeExpectedMetadataDevice({ isLocked: false }))

    powerMonitor._emit('lock-screen')

    const event2 = await sendEvent()
    expect(event2.getMetadata('device')).toEqual(makeExpectedMetadataDevice({ isLocked: true }))

    powerMonitor._emit('unlock-screen')

    const event3 = await sendEvent()
    expect(event3.getMetadata('device')).toEqual(makeExpectedMetadataDevice({ isLocked: false }))
  })
})

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
