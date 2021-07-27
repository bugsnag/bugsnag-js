import { promises } from 'fs'
import { join } from 'path'
import { NativeClient } from '..'

const { mkdtemp, readFile, rmdir } = promises

describe('persisting changes to disk', () => {
  let tempdir: string = ''
  let filepath: string = ''
  let lastRunInfoFilePath: string = ''

  const readTempFile = async () => {
    const contents = await readFile(filepath)
    return JSON.parse(contents.toString())
  }

  beforeEach(async () => {
    tempdir = await mkdtemp('client-sync-')
    filepath = join(tempdir, 'output.json')
    lastRunInfoFilePath = join(tempdir, 'last-run-info.json')
  })

  afterEach(async (done) => {
    NativeClient.uninstall()
    await rmdir(tempdir, { recursive: true })
    done()
  })

  it('sets context', async (done) => {
    NativeClient.install(filepath, lastRunInfoFilePath, 5)
    NativeClient.updateContext('silverfish')
    NativeClient.persistState()
    const state = await readTempFile()
    expect(state.context).toBe('silverfish')
    done()
  })

  it('sets user fields', async (done) => {
    NativeClient.install(filepath, lastRunInfoFilePath, 5)
    NativeClient.updateUser('456', 'jo@example.com', 'jo')
    NativeClient.persistState()
    const state = await readTempFile()
    expect(state.user).toEqual({ id: '456', name: 'jo', email: 'jo@example.com' })
    done()
  })

  it('clears user fields', async (done) => {
    NativeClient.install(filepath, lastRunInfoFilePath, 5)
    NativeClient.updateUser('456', 'jo@example.com', 'jo')
    NativeClient.updateUser('456', 'jo@example.com', null)
    NativeClient.persistState()
    const state = await readTempFile()
    expect(state.user).toEqual({ id: '456', email: 'jo@example.com' })
    done()
  })

  it('clears context', async (done) => {
    NativeClient.install(filepath, lastRunInfoFilePath, 5)
    NativeClient.updateContext('silverfish')
    NativeClient.updateContext(null)
    NativeClient.persistState()
    const state = await readTempFile()
    expect(state.context).toBeUndefined()
    done()
  })

  it('adds breadcrumbs', async (done) => {
    NativeClient.install(filepath, lastRunInfoFilePath, 5)
    NativeClient.leaveBreadcrumb({ name: 'launch app' })
    NativeClient.leaveBreadcrumb({ name: 'click start' })
    NativeClient.leaveBreadcrumb({ name: 'click pause' })
    NativeClient.leaveBreadcrumb({ name: 'go to background' })
    NativeClient.leaveBreadcrumb({ name: 'go to foreground' })
    NativeClient.leaveBreadcrumb({ name: 'resume' })
    NativeClient.persistState()

    const state = await readTempFile()
    expect(state.breadcrumbs).toEqual([
      { name: 'click start' },
      { name: 'click pause' },
      { name: 'go to background' },
      { name: 'go to foreground' },
      { name: 'resume' }
    ])
    done()
  })

  it('sets metadata', async () => {
    NativeClient.install(filepath, lastRunInfoFilePath, 5)
    NativeClient.updateMetadata({
      terrain: { spawn: 'desert', current: 'cave' },
      location: { x: 4, y: 12 }
    })
    NativeClient.persistState()

    const state = await readTempFile()
    expect(state.metadata).toEqual({
      terrain: { spawn: 'desert', current: 'cave' },
      location: { x: 4, y: 12 }
    })
  })

  it('set metadata tab contents', async (done) => {
    NativeClient.install(filepath, lastRunInfoFilePath, 5)
    NativeClient.updateMetadata('terrain', { spawn: 'desert', current: 'cave' })
    NativeClient.persistState()

    const state = await readTempFile()
    expect(state.metadata).toEqual({
      terrain: {
        current: 'cave',
        spawn: 'desert'
      }
    })
    done()
  })

  it('clears metadata tab', async (done) => {
    NativeClient.install(filepath, lastRunInfoFilePath, 5)
    NativeClient.updateMetadata('terrain', { spawn: 'desert', current: 'cave' })
    NativeClient.updateMetadata('device', { size: 256 })
    NativeClient.updateMetadata('terrain')
    NativeClient.persistState()

    const state = await readTempFile()
    expect(state.metadata).toEqual({
      device: { size: 256 }
    })

    done()
  })

  it('sets session', async (done) => {
    NativeClient.install(filepath, lastRunInfoFilePath, 5)
    NativeClient.setSession({
      id: '9f65c975-8155-456f-91e5-c4c4b3db0555',
      events: { handled: 1, unhandled: 0 },
      startedAt: '2017-01-01T14:30:00.000Z'
    })
    NativeClient.persistState()

    let state = await readTempFile()
    expect(state.session).toEqual({
      id: '9f65c975-8155-456f-91e5-c4c4b3db0555',
      events: { handled: 1, unhandled: 0 },
      startedAt: '2017-01-01T14:30:00.000Z'
    })

    NativeClient.setSession(null)
    NativeClient.persistState()

    state = await readTempFile()
    expect(state.session).toBeUndefined()

    done()
  })

  it('has no session by default', async (done) => {
    NativeClient.install(filepath, lastRunInfoFilePath, 5)
    NativeClient.persistState()
    const state = await readTempFile()
    expect(state.session).toBeUndefined()

    done()
  })

  it('sets app info', async (done) => {
    NativeClient.install(filepath, lastRunInfoFilePath, 5)
    NativeClient.setApp({
      releaseStage: 'beta1',
      version: '1.0.22'
    })
    NativeClient.persistState()

    const state = await readTempFile()
    expect(state.app).toEqual({
      releaseStage: 'beta1',
      version: '1.0.22'
    })

    done()
  })

  it('sets device info', async (done) => {
    NativeClient.install(filepath, lastRunInfoFilePath, 5)
    NativeClient.setDevice({
      online: true,
      osName: 'beOS',
      osVersion: 'R6',
      totalMemory: 65536
    })
    NativeClient.persistState()

    const state = await readTempFile()
    expect(state.device).toEqual({
      online: true,
      osName: 'beOS',
      osVersion: 'R6',
      totalMemory: 65536
    })

    done()
  })

  it('initializes with provided state', async () => {
    NativeClient.install(filepath, lastRunInfoFilePath, 5, {
      metadata: { colors: { main: ['yellow', 'green'] } },
      context: 'color picker view',
      title: 'double double, toil and …'
    })
    NativeClient.persistState()

    const state = await readTempFile()
    expect(state).toEqual({
      metadata: { colors: { main: ['yellow', 'green'] } },
      context: 'color picker view',
      title: 'double double, toil and …'
    })
  })

  it('overrides initial state with new values', async () => {
    NativeClient.install(filepath, lastRunInfoFilePath, 5, {
      metadata: { colors: { main: ['yellow', 'green'] } },
      context: 'color picker view',
      title: 'double double, toil and …'
    })
    NativeClient.updateMetadata('colors', { ancilliary: ['grey', 'magenta'] })
    NativeClient.persistState()

    const state = await readTempFile()
    expect(state).toEqual({
      metadata: { colors: { ancilliary: ['grey', 'magenta'] } },
      context: 'color picker view',
      title: 'double double, toil and …'
    })
  })

  it('gracefully handles invalid initial breadcrumb state', async () => {
    NativeClient.install(filepath, lastRunInfoFilePath, 5, {
      metadata: { colors: { main: ['yellow', 'green'] } },
      context: 'color picker view',
      breadcrumbs: 'oy'
    })
    NativeClient.persistState()

    const state = await readTempFile()
    expect(state).toEqual({
      metadata: { colors: { main: ['yellow', 'green'] } },
      context: 'color picker view'
    })
  })

  it('gracefully handles invalid initial context', async () => {
    NativeClient.install(filepath, lastRunInfoFilePath, 5, {
      metadata: { colors: { main: ['yellow', 'green'] } },
      context: 20
    })
    NativeClient.persistState()

    const state = await readTempFile()
    expect(state).toEqual({
      metadata: { colors: { main: ['yellow', 'green'] } }
    })
  })

  it('gracefully handles invalid initial metadata', async () => {
    NativeClient.install(filepath, lastRunInfoFilePath, 5, {
      metadata: 'things',
      context: 'side'
    })
    NativeClient.persistState()

    const state = await readTempFile()
    expect(state).toEqual({ context: 'side' })
  })

  it('gracefully handles invalid initial user info', async () => {
    NativeClient.install(filepath, lastRunInfoFilePath, 5, {
      metadata: { colors: { main: ['yellow', 'green'] } },
      user: ['foo']
    })
    NativeClient.persistState()

    const state = await readTempFile()
    expect(state).toEqual({
      metadata: { colors: { main: ['yellow', 'green'] } }
    })
  })

  it('saves lastRunInfo', async () => {
    const runInfo = { crashed: false, crashedDuringLaunch: false, consecutiveLaunchCrashes: 0 }

    NativeClient.install(filepath, lastRunInfoFilePath, 5)

    NativeClient.setLastRunInfo(JSON.stringify(runInfo))
    NativeClient.persistLstRunInfo()

    const loadedRunInfo = JSON.parse(await readFile(lastRunInfoFilePath, 'utf8'))
    expect(runInfo).toEqual(loadedRunInfo)
  })
})
