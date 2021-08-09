import { promises } from 'fs'
import { join } from 'path'
import MinidumpWatcher from '../minidump-watcher'

const { mkdtemp, mkdir, writeFile, rmdir } = promises

describe('electron-minidump-delivery: watcher', () => {
  let watcher: MinidumpWatcher
  let minidumpLoop, minidumpPath

  beforeEach(async () => {
    minidumpLoop = {
      start: jest.fn()
    }

    minidumpPath = await mkdtemp('minidumps')

    watcher = new MinidumpWatcher(minidumpLoop, minidumpPath)
  })

  afterEach(async () => {
    watcher?.stop()
    await rmdir(minidumpPath, { recursive: true })
  })

  const createStartPromise = () => new Promise(resolve => {
    minidumpLoop.start.mockImplementation(resolve)
  })

  it('starts the MinidumpLoop for new files', async () => {
    const startPromise = createStartPromise()
    watcher.start()

    expect(minidumpLoop.start).not.toHaveBeenCalled()
    await writeFile(join(minidumpPath, 'new-minidump.dmp'), Buffer.of(0, 1, 2, 3, 4, 5, 6))
    await startPromise
  })

  it('scans sub-directories', async () => {
    const startPromise = createStartPromise()

    // place the minidump in a sub-directory to ensure they are scanned as well
    const newMinidumps = join(minidumpPath, 'new')
    await mkdir(newMinidumps)

    watcher.start()

    expect(minidumpLoop.start).not.toHaveBeenCalled()
    await writeFile(join(newMinidumps, 'new-minidump.dmp'), Buffer.of(0, 1, 2, 3, 4, 5, 6))
    await startPromise
  })

  it('starts/stops based on network availability', async () => {
    let networkListener
    const statusUpdater = {
      watch: listener => {
        // capture the listener
        networkListener = listener
      }
    }

    watcher.watchNetworkStatus(statusUpdater)
    expect(watcher._watchers.length).toBe(0)

    // turn on the network
    networkListener(true)

    // check that some the minidump dir is being watched
    expect(watcher._watchers.length).toBe(1)

    // turn off the network
    networkListener(false)
    // we should have closed all of the file watchers
    expect(watcher._watchers.length).toBe(0)
  })
})
