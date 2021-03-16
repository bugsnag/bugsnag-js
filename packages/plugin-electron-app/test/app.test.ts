import Client from '@bugsnag/core/client'
import Event from '@bugsnag/core/event'
import plugin from '../'

const ONE_HOUR_IN_MS = 60 * 60 * 1000

// expected data for 'session.app'
const makeExpectedSessionApp = (customisations = {}) => ({
  releaseStage: 'production',
  type: undefined,
  version: '1.2.3',
  versionCode: '1.2.3',
  ...customisations
})

// expected data for 'event.app'
const makeExpectedEventApp = (customisations = {}) => ({
  ...makeExpectedSessionApp(),
  inForeground: true,
  isLaunching: true,
  duration: expect.any(Number),
  durationInForeground: expect.any(Number),
  ...customisations
})

// expected data synced to NativeClient
const makeExpectedNativeClientApp = (customisations = {}) => ({
  ...makeExpectedEventApp(),
  duration: undefined,
  durationInForeground: undefined,
  ...customisations
})

// expected data for 'event.metadata.app'
const makeExpectedMetadataApp = (customisations = {}) => ({
  installedFromStore: false,
  name: 'my cool app :^)',
  ...customisations
})

describe('plugin: electron app info', () => {
  afterEach(() => { jest.useRealTimers() })

  it('reports basic app info', async () => {
    const { sendEvent, sendSession } = makeClient()

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp())
    expect(event.getMetadata('app')).toEqual(makeExpectedMetadataApp())

    const session = await sendSession()
    expect(session.app).toEqual(makeExpectedSessionApp())
  })

  it('reports correct release stage for non-packaged builds', async () => {
    const electronApp = makeElectronApp({ isPackaged: false })

    const { sendEvent, sendSession } = makeClient({ electronApp })

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp({ releaseStage: 'development' }))
    expect(event.getMetadata('app')).toEqual(makeExpectedMetadataApp())

    const session = await sendSession()
    expect(session.app).toEqual(makeExpectedSessionApp({ releaseStage: 'development' }))
  })

  it('reports app.type for macOS', async () => {
    const process = makeProcess({ platform: 'darwin' })

    const { sendEvent, sendSession } = makeClient({ process })

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp({ type: 'macOS' }))
    expect(event.getMetadata('app')).toEqual(makeExpectedMetadataApp())

    const session = await sendSession()
    expect(session.app).toEqual(makeExpectedSessionApp({ type: 'macOS' }))
  })

  it('reports app.type for Windows', async () => {
    const process = makeProcess({ platform: 'win32' })

    const { sendEvent, sendSession } = makeClient({ process })

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp({ type: 'Windows' }))
    expect(event.getMetadata('app')).toEqual(makeExpectedMetadataApp())

    const session = await sendSession()
    expect(session.app).toEqual(makeExpectedSessionApp({ type: 'Windows' }))
  })

  it('reports app.type for Linux', async () => {
    const process = makeProcess({ platform: 'linux' })

    const { sendEvent, sendSession } = makeClient({ process })

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp({ type: 'Linux' }))
    expect(event.getMetadata('app')).toEqual(makeExpectedMetadataApp())

    const session = await sendSession()
    expect(session.app).toEqual(makeExpectedSessionApp({ type: 'Linux' }))
  })

  it('reports app.version and app.versionCode for macOS', async () => {
    const process = makeProcess({ platform: 'darwin' })
    const electronApp = makeElectronApp({ version: '5.4.6' })

    const { sendEvent, sendSession } = makeClient({ electronApp, process })

    const expected = { type: 'macOS', version: '5.4.6', versionCode: '5.4.6' }

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp(expected))
    expect(event.getMetadata('app')).toEqual(makeExpectedMetadataApp())

    const session = await sendSession()
    expect(session.app).toEqual(makeExpectedSessionApp(expected))
  })

  it('reports app.version and app.versionCode for Windows', async () => {
    const process = makeProcess({ platform: 'win32' })
    const electronApp = makeElectronApp({ version: '1.3.4' })

    const { sendEvent, sendSession } = makeClient({ electronApp, process })

    const expected = { type: 'Windows', version: '1.3.4', versionCode: '1.3.4' }

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp(expected))
    expect(event.getMetadata('app')).toEqual(makeExpectedMetadataApp())

    const session = await sendSession()
    expect(session.app).toEqual(makeExpectedSessionApp(expected))
  })

  it('reports app.version and app.versionCode for Linux', async () => {
    const process = makeProcess({ platform: 'linux' })
    const electronApp = makeElectronApp({ version: '9.8.7' })

    const { sendEvent, sendSession } = makeClient({ electronApp, process })

    const expected = { type: 'Linux', version: '9.8.7', versionCode: '9.8.7' }

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp(expected))
    expect(event.getMetadata('app')).toEqual(makeExpectedMetadataApp())

    const session = await sendSession()
    expect(session.app).toEqual(makeExpectedSessionApp(expected))
  })

  it('reports if the app was installed from the macOS App Store', async () => {
    const process = makeProcess({ mas: true })

    const { sendEvent, sendSession } = makeClient({ process })

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp())
    expect(event.getMetadata('app')).toEqual(makeExpectedMetadataApp({ installedFromStore: true }))

    const session = await sendSession()
    expect(session.app).toEqual(makeExpectedSessionApp())
  })

  it('reports if the app was installed from the Windows Store', async () => {
    const process = makeProcess({ windowsStore: true })

    const { sendEvent, sendSession } = makeClient({ process })

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp())
    expect(event.getMetadata('app')).toEqual(makeExpectedMetadataApp({ installedFromStore: true }))

    const session = await sendSession()
    expect(session.app).toEqual(makeExpectedSessionApp())
  })

  it('reports when the app is not in the foreground', async () => {
    const BrowserWindow = makeBrowserWindow({ focusedWindow: null })

    const { sendEvent } = makeClient({ BrowserWindow })

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp({ inForeground: false, durationInForeground: undefined }))
  })

  it('tracks focus and blur events for inForeground', async () => {
    const BrowserWindow = makeBrowserWindow({ focusedWindow: null })
    const electronApp = makeElectronApp({ BrowserWindow })

    const { sendEvent } = makeClient({ BrowserWindow, electronApp })

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp({ inForeground: false, durationInForeground: undefined }))

    electronApp._emitFocusEvent()

    const event2 = await sendEvent()
    expect(event2.app).toEqual(makeExpectedEventApp({ inForeground: true }))

    electronApp._emitBlurEvent()

    const event3 = await sendEvent()
    expect(event3.app).toEqual(makeExpectedEventApp({ inForeground: false, durationInForeground: undefined }))
  })

  it('tracks multiple browser windows correctly for inForeground', async () => {
    let windowCount = 2

    const BrowserWindow = {
      getFocusedWindow: () => windowCount === 0 ? null : true,
      _blur: () => { --windowCount },
      _focus: () => {}
    }

    const electronApp = makeElectronApp({ BrowserWindow })

    const { sendEvent } = makeClient({ BrowserWindow, electronApp })

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp({ inForeground: true }))

    // we still have a focused window after this event so 'inForeground' is true
    electronApp._emitBlurEvent()

    const event2 = await sendEvent()
    expect(event2.app).toEqual(makeExpectedEventApp({ inForeground: true }))

    electronApp._emitBlurEvent()

    const event3 = await sendEvent()
    expect(event3.app).toEqual(makeExpectedEventApp({ inForeground: false, durationInForeground: undefined }))
  })

  it('handles "inForeground" when all windows are closed', async () => {
    const electronApp = makeElectronApp()

    const { sendEvent } = makeClient({ electronApp })

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp({ inForeground: true }))

    electronApp._emitWindowAllClosedEvent()

    const event2 = await sendEvent()
    expect(event2.app).toEqual(makeExpectedEventApp({ inForeground: false, durationInForeground: undefined }))
  })

  it('quits if there are no additional "window-all-closed" listeners', async () => {
    const electronApp = makeElectronApp()
    electronApp.quit = jest.fn()

    // install a listener to act as electron's internal listener
    electronApp.on('window-all-closed', () => {})

    makeClient({ electronApp })

    electronApp._emitWindowAllClosedEvent()
    expect(electronApp.quit).toHaveBeenCalledTimes(1)

    electronApp._emitWindowAllClosedEvent()
    expect(electronApp.quit).toHaveBeenCalledTimes(2)

    // add a new listener to prevent the quit
    electronApp.on('window-all-closed', () => {})

    electronApp._emitWindowAllClosedEvent()
    expect(electronApp.quit).toHaveBeenCalledTimes(2)
  })

  it('reports the app.duration and app.durationInForeground', async () => {
    jest.useFakeTimers('modern')

    const now = Date.now()
    jest.setSystemTime(now)

    const creationTime = now - ONE_HOUR_IN_MS

    const process = makeProcess({ creationTime })

    const { sendEvent } = makeClient({ process })

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp({
      duration: now - creationTime,
      durationInForeground: now - creationTime
    }))

    const sleepDurationMs = 100
    jest.advanceTimersByTime(sleepDurationMs)

    const event2 = await sendEvent()
    expect(event2.app).toEqual(makeExpectedEventApp({
      duration: now - creationTime + sleepDurationMs,
      durationInForeground: now - creationTime + sleepDurationMs
    }))
  })

  it('reports the app.duration and app.durationInForeground when process.getCreationTime returns null', async () => {
    jest.useFakeTimers('modern')

    const now = Date.now()
    jest.setSystemTime(now)

    const process = makeProcess({ creationTime: null })

    const { sendEvent } = makeClient({ process })

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp({
      duration: 0,
      durationInForeground: 0
    }))

    const sleepDurationMs = 100
    jest.advanceTimersByTime(sleepDurationMs)

    const event2 = await sendEvent()
    expect(event2.app).toEqual(makeExpectedEventApp({
      duration: sleepDurationMs,
      durationInForeground: sleepDurationMs
    }))
  })

  it('reports the app.durationInForeground after backgrounding', async () => {
    jest.useFakeTimers('modern')

    const now = Date.now()
    jest.setSystemTime(now)

    const creationTime = now - ONE_HOUR_IN_MS

    const process = makeProcess({ creationTime })
    const BrowserWindow = makeBrowserWindow({ focusedWindow: null })
    const electronApp = makeElectronApp({ BrowserWindow })

    const { sendEvent } = makeClient({ process, BrowserWindow, electronApp })

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp({
      inForeground: false,
      durationInForeground: undefined
    }))

    electronApp._emitFocusEvent()

    const sleepDurationMs = 500
    jest.advanceTimersByTime(sleepDurationMs)

    const event2 = await sendEvent()
    expect(event2.app).toEqual(makeExpectedEventApp({
      inForeground: true,
      durationInForeground: sleepDurationMs
    }))

    electronApp._emitBlurEvent()

    jest.advanceTimersByTime(sleepDurationMs)

    const event3 = await sendEvent()
    expect(event3.app).toEqual(makeExpectedEventApp({
      inForeground: false,
      durationInForeground: undefined
    }))

    electronApp._emitFocusEvent()

    jest.advanceTimersByTime(sleepDurationMs * 2)

    const event4 = await sendEvent()
    expect(event4.app).toEqual(makeExpectedEventApp({
      inForeground: true,
      durationInForeground: sleepDurationMs * 2
    }))
  })

  it('reports the app.durationInForeground after backgrounding when process.getCreationTime returns null', async () => {
    jest.useFakeTimers('modern')

    const now = Date.now()
    jest.setSystemTime(now)

    const process = makeProcess({ creationTime: null })
    const BrowserWindow = makeBrowserWindow({ focusedWindow: null })
    const electronApp = makeElectronApp({ BrowserWindow })

    const { sendEvent } = makeClient({ process, BrowserWindow, electronApp })

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp({
      inForeground: false,
      durationInForeground: undefined
    }))

    electronApp._emitFocusEvent()

    const sleepDurationMs = 500
    jest.advanceTimersByTime(sleepDurationMs)

    const event2 = await sendEvent()
    expect(event2.app).toEqual(makeExpectedEventApp({
      inForeground: true,
      durationInForeground: sleepDurationMs
    }))

    electronApp._emitBlurEvent()

    jest.advanceTimersByTime(sleepDurationMs)

    const event3 = await sendEvent()
    expect(event3.app).toEqual(makeExpectedEventApp({
      inForeground: false,
      durationInForeground: undefined
    }))

    electronApp._emitFocusEvent()

    jest.advanceTimersByTime(sleepDurationMs * 2)

    const event4 = await sendEvent()
    expect(event4.app).toEqual(makeExpectedEventApp({
      inForeground: true,
      durationInForeground: sleepDurationMs * 2
    }))
  })

  it('reports durationInForeground correctly across multiple browser windows', async () => {
    jest.useFakeTimers('modern')

    const now = Date.now()
    jest.setSystemTime(now)

    let windowCount = 2

    const BrowserWindow = {
      getFocusedWindow: () => windowCount === 0 ? null : true,
      _blur: () => { --windowCount },
      _focus: () => { ++windowCount }
    }

    const electronApp = makeElectronApp({ BrowserWindow })
    const process = makeProcess({ creationTime: null })

    const { sendEvent } = makeClient({ BrowserWindow, electronApp, process })

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp({
      inForeground: true,
      durationInForeground: 0
    }))

    // we still have a focused window after this event so 'inForeground' is true
    // and durationInForeground should still be defined
    electronApp._emitBlurEvent()

    const sleepDurationMs = 500
    jest.advanceTimersByTime(sleepDurationMs)

    const event2 = await sendEvent()
    expect(event2.app).toEqual(makeExpectedEventApp({
      inForeground: true,
      durationInForeground: sleepDurationMs
    }))

    // blur the second window so we're in the background now
    electronApp._emitBlurEvent()

    jest.advanceTimersByTime(sleepDurationMs)

    const event3 = await sendEvent()
    expect(event3.app).toEqual(makeExpectedEventApp({
      inForeground: false,
      durationInForeground: undefined
    }))

    // re-focus a window so we're back in the foreground
    electronApp._emitFocusEvent()

    jest.advanceTimersByTime(sleepDurationMs)

    const event4 = await sendEvent()
    expect(event4.app).toEqual(makeExpectedEventApp({
      inForeground: true,
      durationInForeground: sleepDurationMs
    }))

    // switch focus to the second window, proving that we don't think we've been
    // backgrounded
    electronApp._emitFocusEvent()

    jest.advanceTimersByTime(sleepDurationMs)

    const event5 = await sendEvent()
    expect(event5.app).toEqual(makeExpectedEventApp({
      inForeground: true,
      durationInForeground: sleepDurationMs * 2
    }))
  })

  it('syncs basic data (excluding duration/durationInForeground) to NativeClient', async () => {
    const NativeClient = makeNativeClient()

    const { sendEvent, sendSession } = makeClient({ NativeClient })

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp())
    expect(event.getMetadata('app')).toEqual(makeExpectedMetadataApp())

    const session = await sendSession()
    expect(session.app).toEqual(makeExpectedSessionApp())

    expect(NativeClient.setApp).toHaveBeenCalledTimes(1)
    expect(NativeClient.setApp).toHaveBeenCalledWith(makeExpectedNativeClientApp())
  })

  it('syncs inForeground to NativeClient after focus/blur events', () => {
    const BrowserWindow = makeBrowserWindow({ focusedWindow: null })
    const electronApp = makeElectronApp({ BrowserWindow })
    const NativeClient = makeNativeClient()

    makeClient({ NativeClient, BrowserWindow, electronApp })

    expect(NativeClient.setApp).toHaveBeenCalledTimes(1)
    expect(NativeClient.setApp).toHaveBeenCalledWith(makeExpectedNativeClientApp({ inForeground: false }))

    electronApp._emitFocusEvent()

    expect(NativeClient.setApp).toHaveBeenCalledTimes(2)
    expect(NativeClient.setApp).toHaveBeenNthCalledWith(2, makeExpectedNativeClientApp({ inForeground: true }))

    electronApp._emitBlurEvent()

    expect(NativeClient.setApp).toHaveBeenCalledTimes(3)
    expect(NativeClient.setApp).toHaveBeenNthCalledWith(3, makeExpectedNativeClientApp({ inForeground: false }))
  })

  it('handles exceptions from the NativeClient', async () => {
    const BrowserWindow = makeBrowserWindow()
    const electronApp = makeElectronApp({ BrowserWindow })
    const NativeClient = makeNativeClient()
    NativeClient.setApp.mockImplementation(() => { throw new Error('uh oh') })

    const { client, sendEvent, sendSession } = makeClient({ BrowserWindow, electronApp, NativeClient })

    expect(NativeClient.setApp).toHaveBeenCalledTimes(1)
    expect(NativeClient.setApp).toHaveBeenCalledWith(makeExpectedNativeClientApp())

    expect(client._logger.error).toHaveBeenCalledTimes(1)
    expect(client._logger.error).toHaveBeenCalledWith(new Error('uh oh'))

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp())
    expect(event.getMetadata('app')).toEqual(makeExpectedMetadataApp())

    const session = await sendSession()
    expect(session.app).toEqual(makeExpectedSessionApp())

    expect(NativeClient.setApp).toHaveBeenCalledTimes(1)
    expect(client._logger.error).toHaveBeenCalledTimes(1)

    // ensure NativeClient.setApp calls from blur/focus events are also handled
    electronApp._emitBlurEvent()

    expect(NativeClient.setApp).toHaveBeenCalledTimes(2)
    expect(NativeClient.setApp).toHaveBeenNthCalledWith(2, makeExpectedNativeClientApp({ inForeground: false }))

    expect(client._logger.error).toHaveBeenCalledTimes(2)
    expect(client._logger.error).toHaveBeenNthCalledWith(2, new Error('uh oh'))

    electronApp._emitFocusEvent()

    expect(NativeClient.setApp).toHaveBeenCalledTimes(3)
    expect(NativeClient.setApp).toHaveBeenNthCalledWith(3, makeExpectedNativeClientApp())

    expect(client._logger.error).toHaveBeenCalledTimes(3)
    expect(client._logger.error).toHaveBeenNthCalledWith(3, new Error('uh oh'))
  })

  it('can manually mark the app as not launching', async () => {
    const { client, sendEvent, sendSession } = makeClient()

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp({ isLaunching: true }))
    expect(event.getMetadata('app')).toEqual(makeExpectedMetadataApp())

    const session = await sendSession()
    expect(session.app).toEqual(makeExpectedSessionApp())

    const pluginInstance = client.getPlugin('electronApp')
    pluginInstance.markLaunchComplete()

    const event2 = await sendEvent()
    expect(event2.app).toEqual(makeExpectedEventApp({ isLaunching: false }))
    expect(event2.getMetadata('app')).toEqual(makeExpectedMetadataApp())

    const session2 = await sendSession()
    expect(session2.app).toEqual(makeExpectedSessionApp())
  })

  it('does not sync multiple "markLaunchComplete" calls to native', async () => {
    const NativeClient = makeNativeClient()

    const { client } = makeClient({ NativeClient })

    expect(NativeClient.setApp).toHaveBeenCalledTimes(1)
    expect(NativeClient.setApp).toHaveBeenCalledWith(makeExpectedNativeClientApp())

    const pluginInstance = client.getPlugin('electronApp')
    pluginInstance.markLaunchComplete()

    expect(NativeClient.setApp).toHaveBeenCalledTimes(2)
    expect(NativeClient.setApp).toHaveBeenNthCalledWith(2, makeExpectedNativeClientApp({ isLaunching: false }))

    // as the app is already not launching, calling "markLaunchComplete" again
    // should do nothing
    pluginInstance.markLaunchComplete()
    pluginInstance.markLaunchComplete()
    pluginInstance.markLaunchComplete()

    expect(NativeClient.setApp).toHaveBeenCalledTimes(2)
  })

  it('automatically marks the app as not launching after the default "launchDurationMillis" elapses', async () => {
    jest.useFakeTimers('modern')

    const now = Date.now()
    jest.setSystemTime(now)

    const process = makeProcess({ creationTime: null })
    const config = { launchDurationMillis: undefined }

    const { sendEvent } = makeClient({ process, config })

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp({ isLaunching: true }))
    expect(event.getMetadata('app')).toEqual(makeExpectedMetadataApp())

    // advancing 1 second shouldn't affect isLaunching
    jest.advanceTimersByTime(1000)

    const event2 = await sendEvent()
    expect(event2.app).toEqual(makeExpectedEventApp({ isLaunching: true }))
    expect(event2.getMetadata('app')).toEqual(makeExpectedMetadataApp())

    // advance the remaining 4 seconds to cover the 5 second default 'launcDurationMillis'
    jest.advanceTimersByTime(4000)

    const event3 = await sendEvent()
    expect(event3.app).toEqual(makeExpectedEventApp({ isLaunching: false }))
    expect(event3.getMetadata('app')).toEqual(makeExpectedMetadataApp())
  })

  it('automatically marks the app as not launching after the configured "launchDurationMillis" elapses', async () => {
    jest.useFakeTimers('modern')

    const now = Date.now()
    jest.setSystemTime(now)

    const process = makeProcess({ creationTime: null })
    const config = { launchDurationMillis: 250 }

    const { sendEvent } = makeClient({ process, config })

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp({ isLaunching: true }))
    expect(event.getMetadata('app')).toEqual(makeExpectedMetadataApp())

    jest.advanceTimersByTime(250)

    const event2 = await sendEvent()
    expect(event2.app).toEqual(makeExpectedEventApp({ isLaunching: false }))
    expect(event2.getMetadata('app')).toEqual(makeExpectedMetadataApp())
  })

  it('does not sync "markLaunchComplete" calls after "launchDurationMillis" elapses', async () => {
    jest.useFakeTimers('modern')

    const now = Date.now()
    jest.setSystemTime(now)

    const NativeClient = makeNativeClient()
    const process = makeProcess({ creationTime: null })
    const config = { launchDurationMillis: 250 }

    const { client, sendEvent } = makeClient({ NativeClient, process, config })

    expect(NativeClient.setApp).toHaveBeenCalledTimes(1)
    expect(NativeClient.setApp).toHaveBeenCalledWith(makeExpectedNativeClientApp())

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp({ isLaunching: true }))
    expect(event.getMetadata('app')).toEqual(makeExpectedMetadataApp())

    // advance past launchDurationMillis
    jest.advanceTimersByTime(250)

    const event2 = await sendEvent()
    expect(event2.app).toEqual(makeExpectedEventApp({ isLaunching: false }))
    expect(event2.getMetadata('app')).toEqual(makeExpectedMetadataApp())

    expect(NativeClient.setApp).toHaveBeenCalledTimes(2)
    expect(NativeClient.setApp).toHaveBeenNthCalledWith(2, makeExpectedNativeClientApp({ isLaunching: false }))

    // calling markLaunchComplete should do nothing as we're no longer launching
    const pluginInstance = client.getPlugin('electronApp')
    pluginInstance.markLaunchComplete()
    pluginInstance.markLaunchComplete()
    pluginInstance.markLaunchComplete()

    expect(NativeClient.setApp).toHaveBeenCalledTimes(2)
  })

  it('does not sync "launchDurationMillis" elapsing after "markLaunchComplete" has been caled', async () => {
    jest.useFakeTimers('modern')

    const now = Date.now()
    jest.setSystemTime(now)

    const NativeClient = makeNativeClient()
    const process = makeProcess({ creationTime: null })
    const config = { launchDurationMillis: 250 }

    const { client, sendEvent } = makeClient({ NativeClient, process, config })

    expect(NativeClient.setApp).toHaveBeenCalledTimes(1)
    expect(NativeClient.setApp).toHaveBeenCalledWith(makeExpectedNativeClientApp())

    const event = await sendEvent()
    expect(event.app).toEqual(makeExpectedEventApp({ isLaunching: true }))
    expect(event.getMetadata('app')).toEqual(makeExpectedMetadataApp())

    const pluginInstance = client.getPlugin('electronApp')
    pluginInstance.markLaunchComplete()

    const event2 = await sendEvent()
    expect(event2.app).toEqual(makeExpectedEventApp({ isLaunching: false }))
    expect(event2.getMetadata('app')).toEqual(makeExpectedMetadataApp())

    expect(NativeClient.setApp).toHaveBeenCalledTimes(2)
    expect(NativeClient.setApp).toHaveBeenNthCalledWith(2, makeExpectedNativeClientApp({ isLaunching: false }))

    // advance past launchDurationMillis, this should do nothing as we've
    // manually called "markLaunchComplete"
    jest.advanceTimersByTime(250)
    expect(NativeClient.setApp).toHaveBeenCalledTimes(2)

    jest.advanceTimersByTime(250)
    expect(NativeClient.setApp).toHaveBeenCalledTimes(2)
  })

  it('validates "launchDurationMillis" must be >= 0', async () => {
    const config = { launchDurationMillis: -1234567890 }

    const { client } = makeClient({ config })

    expect(client._config.launchDurationMillis).toBe(5000)
    expect(client._logger.warn).toHaveBeenCalledWith(new Error(
      'Invalid configuration\n  - launchDurationMillis should be a number ≥0, got -1234567890'
    ))
  })
})

function makeClient ({
  BrowserWindow = makeBrowserWindow(),
  electronApp = makeElectronApp({ BrowserWindow }),
  NativeClient = makeNativeClient(),
  process = makeProcess(),
  config = {}
} = {}): Client {
  const client = new Client(
    {
      apiKey: 'abcabcabcabcabcabcabc1234567890f',
      launchDurationMillis: 0,
      logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
      ...config
    },
    undefined,
    [plugin(NativeClient, process, electronApp, BrowserWindow)]
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

function makeElectronApp ({
  BrowserWindow = makeBrowserWindow(),
  isPackaged = true,
  version = '1.2.3',
  name = 'my cool app :^)'
} = {}) {
  const callbacks: { [event: string]: Function[] } = {
    'browser-window-focus': [],
    'browser-window-blur': [],
    'window-all-closed': []
  }

  return {
    isPackaged,
    getVersion () {
      return version
    },
    getName () {
      return name
    },
    on (event, callback) {
      callbacks[event].push(callback)
    },
    quit (): undefined {
      throw new Error('bye!')
    },
    listenerCount (event) {
      return callbacks[event].length
    },

    _emitBlurEvent () {
      BrowserWindow._blur()
      callbacks['browser-window-blur'].forEach(f => { f({}, BrowserWindow) })
    },
    _emitFocusEvent () {
      BrowserWindow._focus()
      callbacks['browser-window-focus'].forEach(f => { f({}, BrowserWindow) })
    },
    _emitWindowAllClosedEvent () {
      callbacks['window-all-closed'].forEach(f => { f() })
    }
  }
}

function makeNativeClient () {
  return {
    setApp: jest.fn()
  }
}

interface BrowserWindowOptions {
  focusedWindow?: boolean|null
}

function makeBrowserWindow ({ focusedWindow = true }: BrowserWindowOptions = {}) {
  let _focusedWindow: boolean|null = focusedWindow

  return {
    getFocusedWindow () {
      return _focusedWindow
    },

    _blur () {
      _focusedWindow = null
    },
    _focus () {
      _focusedWindow = true
    }
  }
}

interface ProcessOptions {
  platform?: string
  mas?: boolean
  windowsStore?: boolean
  creationTime?: number|null
}

function makeProcess ({
  platform = 'serenity',
  mas = false,
  windowsStore = false,
  creationTime = Date.now()
}: ProcessOptions = {}) {
  return {
    platform,
    mas,
    windowsStore,
    getCreationTime: () => creationTime
  }
}
