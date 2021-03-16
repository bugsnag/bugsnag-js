import BugsnagIpcRenderer from '../bugsnag-ipc-renderer'
import { CHANNEL_RENDERER_TO_MAIN, CHANNEL_MAIN_TO_RENDERER } from '../lib/constants'

// @ts-expect-error TS doesn't like the following line because electron is not installed
import * as electron from 'electron'

jest.mock('electron', () => ({ ipcRenderer: { invoke: jest.fn(), on: jest.fn() } }), { virtual: true })

afterEach(() => jest.clearAllMocks())

describe('BugsnagIpcRenderer', () => {
  it('should call ipcRenderer.invoke correctly for breadcrumbs', async () => {
    const bugsnagIpcRenderer = new BugsnagIpcRenderer()
    const breadcrumb = { message: 'hi IPC', type: 'manual', metadata: { electron: 'has many processes' } }
    await bugsnagIpcRenderer.leaveBreadcrumb(breadcrumb)
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(CHANNEL_RENDERER_TO_MAIN, 'leaveBreadcrumb', JSON.stringify(breadcrumb))
  })

  it('should call ipcRenderer.invoke correctly for sessions', async () => {
    const bugsnagIpcRenderer = new BugsnagIpcRenderer()

    await bugsnagIpcRenderer.startSession()
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(CHANNEL_RENDERER_TO_MAIN, 'startSession')

    await bugsnagIpcRenderer.resumeSession()
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(CHANNEL_RENDERER_TO_MAIN, 'resumeSession')

    await bugsnagIpcRenderer.pauseSession()
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(CHANNEL_RENDERER_TO_MAIN, 'pauseSession')
  })

  it('should call ipcRenderer.invoke correctly for context', async () => {
    const bugsnagIpcRenderer = new BugsnagIpcRenderer()
    await bugsnagIpcRenderer.updateContext('ctx')
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(CHANNEL_RENDERER_TO_MAIN, 'updateContext', JSON.stringify({ context: 'ctx' }))
  })

  it('should call ipcRenderer.invoke correctly for user', async () => {
    const bugsnagIpcRenderer = new BugsnagIpcRenderer()
    await bugsnagIpcRenderer.updateUser({ id: '123', email: 'jim@jim.com', name: 'Jim' })
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(
      CHANNEL_RENDERER_TO_MAIN,
      'updateUser',
      JSON.stringify({ user: { id: '123', email: 'jim@jim.com', name: 'Jim' } })
    )
  })

  it('should call ipcRenderer.invoke correctly for metadata', async () => {
    const bugsnagIpcRenderer = new BugsnagIpcRenderer()

    await bugsnagIpcRenderer.updateMetadata('section', { key: 123 })
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(
      CHANNEL_RENDERER_TO_MAIN,
      'updateMetadata',
      JSON.stringify({ section: 'section', values: { key: 123 } })
    )

    await bugsnagIpcRenderer.updateMetadata('section', { valueA: 123, valueB: 234 })
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(
      CHANNEL_RENDERER_TO_MAIN,
      'updateMetadata',
      JSON.stringify({ section: 'section', values: { valueA: 123, valueB: 234 } })
    )

    await bugsnagIpcRenderer.updateMetadata('section', undefined)
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(
      CHANNEL_RENDERER_TO_MAIN,
      'updateMetadata',
      JSON.stringify({ section: 'section', values: undefined })
    )
  })

  it('should call ipcRenderer.invoke correctly for events', async () => {
    const bugsnagIpcRenderer = new BugsnagIpcRenderer()
    const event = { fakeEvent: true }
    await bugsnagIpcRenderer.dispatch(event)
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(CHANNEL_RENDERER_TO_MAIN, 'dispatch', JSON.stringify(event))
  })

  it('should provide the return value for getPayloadInfo', async () => {
    const bugsnagIpcRenderer = new BugsnagIpcRenderer()
    electron.ipcRenderer.invoke.mockResolvedValue({ payloadInfo: {} })
    const returnValue = await bugsnagIpcRenderer.getPayloadInfo()
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(CHANNEL_RENDERER_TO_MAIN, 'getPayloadInfo')
    expect(returnValue).toEqual({ payloadInfo: {} })
  })

  it('should support listening for events from main and parse the event payload', done => {
    const event = { event: 1 }
    const payload = { payload: 1 }
    electron.ipcRenderer.on.mockImplementation((eventName, callback) => {
      expect(eventName).toBe(CHANNEL_MAIN_TO_RENDERER)
      callback(event, JSON.stringify(payload))
    })
    const bugsnagIpcRenderer = new BugsnagIpcRenderer()
    bugsnagIpcRenderer.listen((event, payload) => {
      expect(event).toEqual(event)
      expect(payload).toEqual(payload)
      done()
    })
  })
})
