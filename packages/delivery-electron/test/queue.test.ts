import { constants } from 'fs'
import { access, mkdtemp, readdir, readFile, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import PayloadQueue from '../queue'

const { F_OK } = constants

const invalidDir = () => process.platform === 'win32'
  ? '6:\\non\\existent'
  : '/dev/null/non/existent'

describe('delivery: electron -> queue', () => {
  let tempdir = ''

  beforeEach(async () => {
    tempdir = await mkdtemp('delivery-queue-')
  })

  afterEach(async () => {
    await rm(tempdir, { recursive: true })
  })

  describe('init()', () => {
    it('creates the storage directory', async () => {
      const storagePath = join(tempdir, 'foooo')
      const queue = new PayloadQueue(storagePath, 'stuff')

      expect(storagePath).not.toBeAFile()
      await queue.init()
      expect(storagePath).toBeAFile()
    })

    it('throws an error when the directory was not succesfully created', async () => {
      const storagePath = join(invalidDir(), 'foooo')
      const queue = new PayloadQueue(storagePath, 'stuff')

      await expect(queue.init()).rejects.toBeTruthy()
    })

    it('rejects all pending promises', async () => {
      const storagePath = join(invalidDir(), 'foooo')
      const queue = new PayloadQueue(storagePath, 'stuff')
      const errs: any[] = []

      await Promise.all([
        queue.init().catch(err => errs.push(err)),
        queue.init().catch(err => errs.push(err)),
        queue.init().catch(err => errs.push(err))
      ])

      expect(errs.length).toBe(3)
    })
  })

  describe('peek()', () => {
    it('returns null if there are no files', async () => {
      const queue = new PayloadQueue(tempdir, 'stuff')
      expect(await queue.peek()).toBe(null)
    })

    it('returns null if there are only invalid files', async () => {
      await writeFile(join(tempdir, '.info'), '{}')
      await writeFile(join(tempdir, 'other.json'), '{}')

      const queue = new PayloadQueue(tempdir, 'stuff')
      expect(await queue.peek()).toBe(null)
    })

    it('parses an existing file into JSON', async () => {
      const path = join(tempdir, 'bugsnag-stuff-01.json')

      await writeFile(path, JSON.stringify({
        body: JSON.stringify({ colors: 3 }),
        opts: { url: 'example.com', method: 'POST', headers: {} }
      }))

      const queue = new PayloadQueue(tempdir, 'stuff')
      const item = await queue.peek()

      expect(item).toEqual({
        path,
        payload: {
          body: JSON.stringify({ colors: 3 }),
          opts: { url: 'example.com', method: 'POST', headers: {} }
        }
      })
    })

    it('calls onerror and returns null if error occurs', async () => {
      await new Promise<void>((resolve) => {
        const queue = new PayloadQueue(invalidDir(), 'stuff', (err) => {
          expect(err).not.toBe(null)
          resolve()
        })

        queue.peek()
      })
    })

    it('removes file if JSON is invalid', async () => {
      const path = join(tempdir, 'bugsnag-stuff-02.json')
      await writeFile(path, '{"colors":')

      const queue = new PayloadQueue(tempdir, 'stuff')
      const item = await queue.peek()

      expect(item).toBe(null)
      await expect(access(path, F_OK)).rejects.toBeTruthy()
    })
  })

  describe('enqueue()', () => {
    it('handles creating the directory if needed', async () => {
      const path = join(tempdir, 'no-dir')
      const queue = new PayloadQueue(path, 'stuff')

      await queue.enqueue({
        body: JSON.stringify({ colour: 'yellow' }),
        opts: { url: 'example.com', method: 'POST', headers: {} }
      })

      await expect(path).toBeAFile()
      const items = await readdir(path)

      expect(items.length).toBe(1)
    })

    it('calls onerror callback if error occurs', async () => {
      await new Promise<void>((resolve) => {
        const queue = new PayloadQueue(invalidDir(), 'stuff', (err) => {
          expect(err).toBeTruthy()
          resolve()
        })

        queue.enqueue({})
      })
    })
  })

  describe('remove()', () => {
    it('deletes the file', async () => {
      const path = join(tempdir, 'bugsnag-stuff-03.json')
      await writeFile(path, '{}')

      const queue = new PayloadQueue(tempdir, 'stuff')
      await queue.remove(path)

      await expect(access(path, F_OK)).rejects.toBeTruthy()
    })

    it('calls onerror callback if error occurs', async () => {
      await new Promise<void>((resolve) => {
        const queue = new PayloadQueue(tempdir, 'stuff', (err) => {
          expect(err).toBeTruthy()
          resolve()
        })

        queue.remove(join(invalidDir(), 'file'))
      })
    })
  })
})