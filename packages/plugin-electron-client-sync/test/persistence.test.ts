import { mkdtemp, readFile, rmdir } from 'fs'
import { join } from 'path'
import { promisify } from 'util'
import * as bindings from 'bindings'

describe('persisting changes to disk', () => {
  const NativeClient = bindings.default('bugsnag_plugin_electron_client_sync_bindings')
  const createTempDir = promisify(mkdtemp)
  const removeDir = promisify(rmdir)

  let tempdir: string = ''
  let filepath: string = ''

  const readTempFile = async () => {
    const contents = await promisify(readFile)(filepath)
    return JSON.parse(contents.toString())
  }

  beforeEach(async (done) => {
    tempdir = await createTempDir('client-sync-')
    filepath = join(tempdir, 'output.json')
    NativeClient.install(filepath, 5)
    done()
  })

  afterEach(async (done) => {
    NativeClient.uninstall()
    removeDir(tempdir, {recursive: true})
    done()
  })

  it('sets context', async (done) => {
    NativeClient.updateContext('silverfish')
    NativeClient.persistState()
    const state = await readTempFile()
    expect(state['context']).toBe('silverfish')
    done()
  })

  it('sets user fields', async (done) => {
    NativeClient.updateUser('456', 'jo@example.com', 'jo')
    NativeClient.persistState()
    const state = await readTempFile()
    expect(state['user']).toEqual({id: '456', name: 'jo', email: 'jo@example.com'})
    done()
  })

  it('clears user fields', async (done) => {
    NativeClient.updateUser('456', 'jo@example.com', 'jo')
    NativeClient.updateUser('456', 'jo@example.com', null)
    NativeClient.persistState()
    const state = await readTempFile()
    expect(state['user']).toEqual({id: '456', email: 'jo@example.com'})
    done()
  })

  it('clears context', async (done) => {
    NativeClient.updateContext('silverfish')
    NativeClient.updateContext(null)
    NativeClient.persistState()
    const state = await readTempFile()
    expect(state['context']).toBeUndefined()
    done()
  })

  it('adds breadcrumbs', async (done) => {
    NativeClient.leaveBreadcrumb({name: 'launch app'})
    NativeClient.leaveBreadcrumb({name: 'click start'})
    NativeClient.leaveBreadcrumb({name: 'click pause'})
    NativeClient.leaveBreadcrumb({name: 'go to background'})
    NativeClient.leaveBreadcrumb({name: 'go to foreground'})
    NativeClient.leaveBreadcrumb({name: 'resume'})
    NativeClient.persistState()

    const state = await readTempFile()
    expect(state['breadcrumbs']).toEqual([
      {'name': 'click start'},
      {'name': 'click pause'},
      {'name': 'go to background'},
      {'name': 'go to foreground'},
      {'name': 'resume'},
    ])
    done()
  })

  it('adds metadata', async (done) => {
    NativeClient.addMetadata('terrain', 'spawn', 'desert')
    NativeClient.addMetadata('terrain', 'current', 'cave')
    NativeClient.persistState()

    const state = await readTempFile()
    expect(state['metadata']).toEqual({
      terrain: {
        current: 'cave',
        spawn: 'desert',
      }
    })
    done()
  })

  it('clears metadata', async (done) => {
    NativeClient.addMetadata('terrain', 'spawn', 'desert')
    NativeClient.addMetadata('terrain', 'current', 'cave')
    NativeClient.addMetadata('device', 'size', 256)
    NativeClient.clearMetadata('terrain', 'spawn')
    NativeClient.persistState()

    const state = await readTempFile()
    expect(state['metadata']).toEqual({
      terrain: { current: 'cave' },
      device: { size: 256 }
    })

    done()
  })
})
