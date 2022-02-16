import { FileStore } from '..'
import { basename, dirname, join } from 'path'
import { promises } from 'fs'
import { tmpdir } from 'os'

const { mkdir, readFile, rm, writeFile } = promises

describe('FileStore', () => {
  const fixtures = join(tmpdir(), 'fixtures', 'storage')
  const crashes = join(tmpdir(), 'fixtures', 'crashes')
  let store: FileStore

  beforeEach(async () => {
    await mkdir(join(crashes, 'reports'), { recursive: true })
    await mkdir(join(crashes, 'pending'), { recursive: true })
    store = new FileStore('mykey', fixtures, crashes)
  })

  afterEach(async () => {
    await rm(fixtures, { recursive: true, force: true })
    await rm(crashes, { recursive: true, force: true })
  })

  describe('getPaths()', () => {
    it('returns key-specific paths', () => {
      const paths = store.getPaths()
      const base = join(fixtures, 'bugsnag', 'mykey')

      expect(paths.events).toEqual(join(base, 'events'))
      expect(paths.sessions).toEqual(join(base, 'sessions'))
      expect(paths.device).toEqual(join(base, 'device.json'))
      expect(paths.runinfo).toEqual(join(base, 'runinfo'))
      expect(paths.minidumps).toEqual(crashes)
    })
  })

  describe('init()', () => {
    it('creates intermediate directories', async () => {
      await store.init()

      const paths = store.getPaths()
      expect(paths.events).toBeAFile()
      expect(paths.sessions).toBeAFile()
      expect(paths.runinfo).toBeAFile()
      expect(dirname(paths.device)).toBeAFile()
    })

    it('can be called multiple times without error', async () => {
      await store.init()

      const paths = store.getPaths()
      const sentinel = join(paths.runinfo, 'item')
      await writeFile(sentinel, 'here')

      await store.init()

      const contents = await readFile(sentinel)
      expect(contents.toString()).toEqual('here')

      expect(paths.events).toBeAFile()
      expect(paths.sessions).toBeAFile()
      expect(paths.runinfo).toBeAFile()
      expect(dirname(paths.device)).toBeAFile()
    })
  })

  describe('getEventInfoPath()', () => {
    it('joins runinfo with an ID', () => {
      const infoPath = store.getEventInfoPath('43610a')
      expect(infoPath).toEqual(join(store.getPaths().runinfo, '43610a'))
    })
  })

  describe('getBackgroundEventInfoPath()', () => {
    it('joins runinfo with a filename and an extension', () => {
      const minidumpPath = process.platform === 'win32' ? 'E:\\some\\path\\myfile.dmp' : '/some/path/myfile.dmp'
      const path = store.getBackgroundEventInfoPath(minidumpPath)
      expect(path).toEqual(join(store.getPaths().runinfo, 'myfile.dmp.info'))
    })
  })

  describe('getDeviceInfo()', () => {
    it('returns an empty object if something goes wrong', async () => {
      const dir = process.platform === 'win32' ? '6:\\non\\existent' : '/dev/null/non/existent'
      store = new FileStore('mykey', dir, crashes)
      const contents = store.getDeviceInfo()
      expect(contents).toEqual({})
    })

    it('returns an ID after initialization', async () => {
      await store.init()
      const contents = store.getDeviceInfo()
      expect(typeof contents.id).toBe('string')
    })

    it('returns an ID if device info is empty', async () => {
      const base = join(fixtures, 'bugsnag', 'mykey')
      await mkdir(base, { recursive: true })
      await writeFile(join(base, 'device.json'), '')
      const contents = store.getDeviceInfo()
      expect(typeof contents.id).toBe('string')
    })

    it('returns an ID if device info is invalid JSON', async () => {
      const base = join(fixtures, 'bugsnag', 'mykey')
      await mkdir(base, { recursive: true })
      await writeFile(join(base, 'device.json'), '{"id":')
      const contents = store.getDeviceInfo()
      expect(typeof contents.id).toBe('string')
    })

    it('returns the object sent to setDeviceInfo()', async () => {
      store.setDeviceInfo({ id: 'a684c' })
      const contents = store.getDeviceInfo()
      expect(contents).toEqual({ id: 'a684c' })
    })

    it('returns an object with an ID if none given to setDeviceInfo()', async () => {
      store.setDeviceInfo({ name: 'jeanne' })
      const contents = store.getDeviceInfo()
      expect(contents.name).toEqual('jeanne')
      expect(typeof contents.id).toBe('string')
    })
  })

  describe('setDeviceInfo()', () => {
    it('serializes device info to disk', async () => {
      store.setDeviceInfo({ id: 'df40a811e2' })
      const base = join(fixtures, 'bugsnag', 'mykey')
      const contents = await readFile(join(base, 'device.json'))
      expect(JSON.parse(contents.toString())).toEqual({ id: 'df40a811e2' })
    })

    it('inserts a unique identifier if none given', async () => {
      store.setDeviceInfo({ color: 'cyan' })
      const base = join(fixtures, 'bugsnag', 'mykey')
      const contents = await readFile(join(base, 'device.json'))
      const device = JSON.parse(contents.toString())
      expect(device.color).toEqual('cyan')
      expect(typeof device.id).toBe('string')
    })
  })

  describe('listMinidumps()', () => {
    const id = 'b5a80f14d2e5c7771feb62f61cf495b06db47993b7473ddffbad93090536d28e'

    it('lists Minidumps', async () => {
      const base = store.getPaths().minidumps
      await writeFile(join(base, 'some-other-thing.ps'), 'not a crash')
      await createMinidump('report01.dmp', '')
      await createMinidump('report02.dmp', id)

      const dumps = await store.listMinidumps() as any[]
      expect(dumps).toHaveLength(2)
      expect(dumps[0].minidumpPath).toEqual(join(base, 'report01.dmp'))
      expect(dumps[0].eventPath).toBeNull()
      expect(dumps[1].minidumpPath).toEqual(join(base, 'report02.dmp'))
      expect(dumps[1].eventPath).toEqual(join(store.getPaths().runinfo, id))
    })

    it('scans subdirectories', async () => {
      const base = store.getPaths().minidumps

      await writeFile(join(base, 'some-other-thing.ps'), 'not a crash')
      await createMinidump('report01.dmp', '')
      await createMinidump(join('reports', 'report02.dmp'), id)
      await createMinidump(join('pending', 'report03.dmp'), id)

      const dumps = await store.listMinidumps() as any[]
      const dumpPaths = dumps.map(d => d.minidumpPath)
      expect(dumpPaths.sort()).toEqual([
        join(base, 'report01.dmp'),
        join(base, 'reports', 'report02.dmp'),
        join(base, 'pending', 'report03.dmp')
      ].sort())
    })
  })

  describe('deleteMinidump()', () => {
    const id = '1248799de5a804eddf1ac0bf119c0ae64d052748f63ae209e051d9dbc7b3d702'

    it('removes the minidump and event info files', async () => {
      await store.init()

      const paths = store.getPaths()
      await writeFile(join(paths.minidumps, 'some-other-thing.ps'), 'not a crash')
      await createMinidump('report01.dmp', '')
      await createMinidump('report02.dmp', id)

      const dumps = await store.listMinidumps() as any[]
      await store.deleteMinidump(dumps[0])
      expect(dumps[0].eventPath).not.toBeAFile()
      expect(dumps[0].minidumpPath).not.toBeAFile()
      expect(dumps[1].eventPath).toBeAFile()
      expect(dumps[1].minidumpPath).toBeAFile()
    })
  })

  describe('getAppRunID()', () => {
    const id = '7b9880bed0908e940e940323826709416a42050bef321325f472177451e4bc2d'

    it('fails to resolve when there is no ID present', async () => {
      const fixture = join(store.getPaths().minidumps, 'sample.dmp')
      await createMinidump(basename(fixture), '')
      await expect(store.getAppRunID(fixture)).rejects.toBeInstanceOf(Error)
    })

    it('finds a matching identifier in a file', async () => {
      const fixture = join(store.getPaths().minidumps, 'other.dmp')
      await createMinidump(basename(fixture), id)
      const found = await store.getAppRunID(fixture)
      expect(found).toEqual(id)
    })
  })

  describe('clearEventInfoPaths()', () => {
    it('removes all files in the runinfo directory', async () => {
      await store.init()
      const infoPath = store.getEventInfoPath('43610a')
      await writeFile(infoPath, JSON.stringify({ context: 'rice machine' }))

      await store.clearEventInfoPaths()

      expect(infoPath).not.toBeAFile()
    })
  })

  describe('getAppRunMetadata()', () => {
    it('generates a key in an expected format', () => {
      const metadata = store.getAppRunMetadata()
      expect(metadata.bugsnag_crash_id).toMatch(/^[0-9a-z]{64}$/)
    })
  })

  const createMinidump = async (filename: string, id: string) => {
    await store.init()
    const paths = store.getPaths()
    // { key } { byte buffer } { id }
    const sequence = `bugsnag_crash_id${'\0'.repeat(8)}${id}`
    const contents = Buffer.from(`${'\0\r'.repeat(12)}${sequence}c${'\0'.repeat(442)}`)
    await writeFile(join(paths.minidumps, filename), contents)
    if (id.length > 0) {
      await writeFile(join(paths.runinfo, id), JSON.stringify({ context: '/foo' }))
    }
  }
})
