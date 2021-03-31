import { app, BrowserWindow } from 'electron'
import { makeClientForPlugin } from '@bugsnag/electron-test-helpers'
import { join } from 'path'
import plugin from '..'

const uncaughtExceptionPreloadPath = join(__dirname, 'fixtures', 'uncaught-exception-preload.js')
const safePreloadPath = join(__dirname, 'fixtures', 'safe-preload.js')
const index = join(__dirname, 'fixtures', 'index.html')

describe('plugin: preload-error', () => {
  it('creates an Event on preload-error', async () => {
    const client = makeClient()

    const window = new BrowserWindow({
      show: false,
      webPreferences: { preload: uncaughtExceptionPreloadPath }
    })

    await window.loadFile(index)

    expect(client._delivery.sendEvent).toHaveBeenCalledTimes(1)

    const [payload] = client._delivery.sendEvent.mock.calls[0]

    expect(payload.events).toHaveLength(1)

    const event = payload.events[0]
    expect(event.context).toBe(uncaughtExceptionPreloadPath)
    expect(event.severity).toBe('error')
    expect(event.unhandled).toBe(true)
    expect(event.errors).toHaveLength(1)

    const error = event.errors[0]
    expect(error.errorClass).toBe('Error')
    expect(error.errorMessage).toBe('oh no!')
  })

  it('does nothing if the preload does not throw', async () => {
    const client = makeClient()

    const window = new BrowserWindow({
      show: false,
      webPreferences: { preload: safePreloadPath }
    })

    await window.loadFile(index)

    expect(client._delivery.sendEvent).not.toHaveBeenCalled()
  })

  it('does nothing if autoDetectErrors is disabled', async () => {
    const client = makeClient({
      config: { autoDetectErrors: false }
    })

    const window = new BrowserWindow({
      show: false,
      webPreferences: { preload: uncaughtExceptionPreloadPath }
    })

    await window.loadFile(index)

    expect(client._delivery.sendEvent).not.toHaveBeenCalled()
  })

  it('does nothing if unhandledExceptions are disabled', async () => {
    const client = makeClient({
      config: { enabledErrorTypes: { unhandledExceptions: false } }
    })

    const window = new BrowserWindow({
      show: false,
      webPreferences: { preload: uncaughtExceptionPreloadPath }
    })

    await window.loadFile(index)

    expect(client._delivery.sendEvent).not.toHaveBeenCalled()
  })
})

function makeClient ({ config = {}, _app = app } = {}) {
  const { client } = makeClientForPlugin({ config, plugin: plugin(_app) })
  client._setDelivery(() => ({ sendEvent: jest.fn() }))

  return client
}
