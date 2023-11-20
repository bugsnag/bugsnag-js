import { app, BrowserWindow } from 'electron'
import { makeClientForPlugin } from '@bugsnag/electron-test-helpers'
import path from 'path'
import plugin from '..'

const uncaughtExceptionPreloadPath = path.join(__dirname, 'fixtures', 'uncaught-exception-preload.js')
const relativeUncaughtExceptionPreloadPath = path.relative(__dirname, uncaughtExceptionPreloadPath)
const safePreloadPath = path.join(__dirname, 'fixtures', 'safe-preload.js')
const index = path.join(__dirname, 'fixtures', 'index.html')

describe('plugin: preload-error', () => {
  it('creates an Event on preload-error', async () => {
    const client = makeClient()

    const window = new BrowserWindow({
      show: false,
      webPreferences: { preload: uncaughtExceptionPreloadPath }
    })

    await window.loadFile(index)

    expect(client._delivery.sendEvent).toHaveBeenCalledTimes(1)

    const [payload] = (client._delivery.sendEvent as jest.MockedFunction<typeof client._delivery.sendEvent>).mock.calls[0]

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

  it('removes the projectRoot from the Event context', async () => {
    const client = makeClient({
      config: { projectRoot: __dirname },
      schema: {
        projectRoot: {
          defaultValue: () => null,
          validate: (value: unknown) => value === null || typeof value === 'string',
          message: 'should be string'
        }
      }
    })

    const window = new BrowserWindow({
      show: false,
      webPreferences: { preload: uncaughtExceptionPreloadPath }
    })

    await window.loadFile(index)

    expect(client._delivery.sendEvent).toHaveBeenCalledTimes(1)

    const [payload] = (client._delivery.sendEvent as jest.MockedFunction<typeof client._delivery.sendEvent>).mock.calls[0]

    expect(payload.events).toHaveLength(1)

    const event = payload.events[0]
    expect(event.context).toBe(relativeUncaughtExceptionPreloadPath)
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

function makeClient ({ config = {}, schema = {}, _app = app } = {}) {
  const { client } = makeClientForPlugin({ config, schema, plugins: [plugin(_app)] })
  client._setDelivery(() => ({ sendEvent: jest.fn(), sendSession: () => {} }))

  return client
}
