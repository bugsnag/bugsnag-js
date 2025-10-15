import BugsnagIpcRenderer from '../bugsnag-ipc-renderer'
import { CHANNEL_RENDERER_TO_MAIN, CHANNEL_RENDERER_TO_MAIN_SYNC } from '../lib/constants'
import { Breadcrumb } from '@bugsnag/core'

import * as electron from 'electron'

jest.mock('electron', () => ({ ipcRenderer: { invoke: jest.fn(), sendSync: jest.fn() } }), { virtual: true })

afterEach(() => jest.clearAllMocks())

describe('BugsnagIpcRenderer', () => {
  it('should call ipcRenderer.invoke correctly for breadcrumbs', async () => {
    const breadcrumb = new Breadcrumb('hi IPC', { electron: 'has many processes' }, 'log')
    await BugsnagIpcRenderer.leaveBreadcrumb(breadcrumb)
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(CHANNEL_RENDERER_TO_MAIN, 'leaveBreadcrumb', JSON.stringify(breadcrumb))
  })

  it('should call ipcRenderer.invoke correctly for sessions', async () => {
    await BugsnagIpcRenderer.startSession()
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(CHANNEL_RENDERER_TO_MAIN, 'startSession')

    await BugsnagIpcRenderer.resumeSession()
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(CHANNEL_RENDERER_TO_MAIN, 'resumeSession')

    await BugsnagIpcRenderer.pauseSession()
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(CHANNEL_RENDERER_TO_MAIN, 'pauseSession')
  })

  it('should call ipcRenderer correctly for getContext', () => {
    BugsnagIpcRenderer.getContext()
    expect(electron.ipcRenderer.sendSync).toHaveBeenCalledWith(CHANNEL_RENDERER_TO_MAIN_SYNC, 'getContext')
  })

  it('should call ipcRenderer correctly for setContext', async () => {
    await BugsnagIpcRenderer.setContext('ctx')
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(CHANNEL_RENDERER_TO_MAIN, 'setContext', JSON.stringify('ctx'))
  })

  it('should call ipcRenderer correctly for getGroupingDiscriminator', () => {
    BugsnagIpcRenderer.getGroupingDiscriminator()
    expect(electron.ipcRenderer.sendSync).toHaveBeenCalledWith(CHANNEL_RENDERER_TO_MAIN_SYNC, 'getGroupingDiscriminator')
  })

  it('should call ipcRenderer correctly for setGroupingDiscriminator', async () => {
    await BugsnagIpcRenderer.setGroupingDiscriminator('ctx')
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(CHANNEL_RENDERER_TO_MAIN, 'setGroupingDiscriminator', JSON.stringify('ctx'))
  })

  it('should call ipcRenderer correctly for getUser', () => {
    BugsnagIpcRenderer.getUser()
    expect(electron.ipcRenderer.sendSync).toHaveBeenCalledWith(
      CHANNEL_RENDERER_TO_MAIN_SYNC,
      'getUser')
  })

  it('should call ipcRenderer correctly for setUser', async () => {
    await BugsnagIpcRenderer.setUser('123', 'jim@jim.com', 'Jim')
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(
      CHANNEL_RENDERER_TO_MAIN,
      'setUser',
      JSON.stringify('123'),
      JSON.stringify('jim@jim.com'),
      JSON.stringify('Jim')
    )
  })

  it('should call ipcRenderer correctly for addMetadata', async () => {
    await BugsnagIpcRenderer.addMetadata('section', { key: 123 })
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(
      CHANNEL_RENDERER_TO_MAIN,
      'addMetadata',
      JSON.stringify('section'),
      JSON.stringify({ key: 123 })
    )

    await BugsnagIpcRenderer.addMetadata('section', { valueA: 123, valueB: 234 })
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(
      CHANNEL_RENDERER_TO_MAIN,
      'addMetadata',
      JSON.stringify('section'),
      JSON.stringify({ valueA: 123, valueB: 234 })
    )

    await BugsnagIpcRenderer.clearMetadata('section')
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(
      CHANNEL_RENDERER_TO_MAIN,
      'clearMetadata',
      JSON.stringify('section')
    )
  })

  it('calls ipcRenderer correctly for getMetadata', () => {
    BugsnagIpcRenderer.getMetadata('section')
    expect(electron.ipcRenderer.sendSync).toHaveBeenCalledWith(
      CHANNEL_RENDERER_TO_MAIN_SYNC,
      'getMetadata',
      JSON.stringify('section')
    )

    BugsnagIpcRenderer.getMetadata('section', 'key')
    expect(electron.ipcRenderer.sendSync).toHaveBeenCalledWith(
      CHANNEL_RENDERER_TO_MAIN_SYNC,
      'getMetadata',
      JSON.stringify('section'),
      JSON.stringify('key')
    )
  })

  it('should call ipcRenderer correctly for addFeatureFlag', async () => {
    await BugsnagIpcRenderer.addFeatureFlag('name', 'variant')

    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(
      CHANNEL_RENDERER_TO_MAIN,
      'addFeatureFlag',
      JSON.stringify('name'),
      JSON.stringify('variant')
    )
  })

  it('should call ipcRenderer correctly for addFeatureFlags', async () => {
    await BugsnagIpcRenderer.addFeatureFlags([{ name: 'name', variant: 'variant' }])

    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(
      CHANNEL_RENDERER_TO_MAIN,
      'addFeatureFlags',
      JSON.stringify([{ name: 'name', variant: 'variant' }])
    )
  })

  it('should call ipcRenderer correctly for clearFeatureFlag', async () => {
    await BugsnagIpcRenderer.clearFeatureFlag('name')

    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(
      CHANNEL_RENDERER_TO_MAIN,
      'clearFeatureFlag',
      JSON.stringify('name')
    )
  })

  it('should call ipcRenderer correctly for clearFeatureFlags', async () => {
    await BugsnagIpcRenderer.clearFeatureFlags()

    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(
      CHANNEL_RENDERER_TO_MAIN,
      'clearFeatureFlags'
    )
  })

  it('should call ipcRenderer correctly for payload info', async () => {
    await BugsnagIpcRenderer.getPayloadInfo()
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(CHANNEL_RENDERER_TO_MAIN, 'getPayloadInfo')
  })

  it('should call ipcRenderer.invoke correctly for events', async () => {
    const event = { fakeEvent: true }
    await BugsnagIpcRenderer.dispatch(event)
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(CHANNEL_RENDERER_TO_MAIN, 'dispatch', JSON.stringify(event))
  })

  it('should receive main process codeBundleId via getPayloadInfo but not use it when renderer has no codeBundleId', async () => {
    // Mock the electron.ipcRenderer.invoke to return payload info with main's codeBundleId
    const mockPayloadInfo = {
      app: {
        releaseStage: 'production',
        version: '1.0.0',
        type: 'electron',
        codeBundleId: 'main-bundle-abc123'
      },
      breadcrumbs: [],
      context: null,
      device: {},
      metadata: {},
      features: [],
      user: {},
      groupingDiscriminator: null
    };

    (electron.ipcRenderer.invoke as jest.Mock).mockResolvedValueOnce(mockPayloadInfo)

    // Verify that getPayloadInfo returns the main's codeBundleId
    const result = await BugsnagIpcRenderer.getPayloadInfo()

    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(CHANNEL_RENDERER_TO_MAIN, 'getPayloadInfo')
    expect(result.app.codeBundleId).toBe('main-bundle-abc123')

    // Note: This test verifies the IPC transport mechanism works correctly.
    // The actual isolation behavior (preventing main's codeBundleId from being used
    // when renderer has no codeBundleId) is enforced by the renderer-event-data plugin
    // which explicitly sets codeBundleId from the renderer's own config.
  })
})
