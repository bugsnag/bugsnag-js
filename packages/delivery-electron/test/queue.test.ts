import { constants } from 'fs'
import { access, mkdtemp, readdir, readFile, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import PayloadQueue from '../queue'
const { F_OK } = constants

const invalidDir = () => process.platform === 'win32' ? '6:\\non\\existent' : '/dev/null/non/existent'

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

    it('throws an error when the directory was not succesfully created', async (done) => {
      const storagePath = join(invalidDir(), 'foooo')
      const queue = new PayloadQueue(storagePath, 'stuff')
      let didErr = false

      try {
        await queue.init()
      } catch (e) {
        expect(e).toBeTruthy()
        didErr = true
      }
      expect(didErr).toBe(true)
      done()
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

    it('returns null if there are only files that don’t match the expected pattern', async () => {
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

    it('calls the onerror callback and returns null if there is an error', async (done) => {
      const queue = new PayloadQueue(invalidDir(), 'stuff', err => {
        expect(err).not.toBe(null)
        done()
      })
      const item = await queue.peek()
      expect(item).toBe(null)
    })

    it('removes a file if it’s not valid JSON', async () => {
      const path = join(tempdir, 'bugsnag-stuff-02.json')
      await writeFile(path, '{"colors":')

      const queue = new PayloadQueue(tempdir, 'stuff')
      const item = await queue.peek()
      expect(item).toBe(null)
      await expect(access(path, F_OK)).rejects.toBeTruthy()
    })

    it.each([
      ['null', null],
      ['empty object', {}],
      ['no body or opts', { colours: 3 }],
      ['null opts', { body: 'a', opts: null }],
      ['string opts', { body: 'a', opts: 'a' }],
      ['empty opts', { body: 'a', opts: {} }],
      ['null headers', { body: 'a', opts: { url: 'a', method: 'a', headers: null } }],
      ['string headers', { body: 'a', opts: { url: 'a', method: 'a', headers: 'a' } }],
      ['no body', { opts: { url: 'a', method: 'a', headers: {} } }],
      ['null body', { body: null, opts: { url: 'a', method: 'a', headers: {} } }]
    ])('removes a file if it’s not a valid payload (%s)', async (_, invalidPayload) => {
      const path = join(tempdir, 'bugsnag-stuff-02.json')
      await writeFile(path, JSON.stringify(invalidPayload))

      const onerror = jest.fn()
      const queue = new PayloadQueue(tempdir, 'stuff', onerror)
      const item = await queue.peek()

      expect(item).toBe(null)

      await expect(access(path, F_OK)).rejects.toBeTruthy()
      expect(onerror).not.toHaveBeenCalled()
    })

    it('can return a valid file after removing an invalid payload', async () => {
      const invalidPayloadPath = join(tempdir, 'bugsnag-stuff-01.json')
      const validPayloadPath = join(tempdir, 'bugsnag-stuff-02.json')

      await writeFile(invalidPayloadPath, JSON.stringify({ colours: 3 }))
      await writeFile(validPayloadPath, JSON.stringify({
        body: '{}',
        opts: { url: 'example.com', method: 'POST', headers: {} }
      }))

      const queue = new PayloadQueue(tempdir, 'stuff')
      const item = await queue.peek()

      expect(item).toEqual({
        path: validPayloadPath,
        payload: {
          body: '{}',
          opts: { url: 'example.com', method: 'POST', headers: {} }
        }
      })

      await expect(access(invalidPayloadPath, F_OK)).rejects.toBeTruthy()
      await expect(access(validPayloadPath, F_OK)).resolves.toBeUndefined()
    })
  })

  describe('enqueue()', () => {
    it('handles creating the directory if needed', async () => {
      const path = join(tempdir, 'this-does-not-exist-yet')
      const queue = new PayloadQueue(path, 'stuff')
      await queue.enqueue({
        body: JSON.stringify({ colour: 'yellow' }),
        opts: { url: 'example.com', method: 'POST', headers: {} }
      })

      await expect(path).toBeAFile()
      const items = await readdir(path)
      expect(items.length).toEqual(1)

      const contents = await readFile(join(path, items[0]))
      expect(JSON.parse(contents.toString())).toEqual({
        body: JSON.stringify({ colour: 'yellow' }),
        opts: { url: 'example.com', method: 'POST', headers: {} }
      })
    })

    it('calls the onerror callback if there is an error', async (done) => {
      const queue = new PayloadQueue(invalidDir(), 'stuff', (err) => {
        expect(err).toBeTruthy()
        done()
      })
      await queue.enqueue({})
    })

    it('purges items that are over the limit', async () => {
      const uid = (index: number) => index.toString().padStart(2, '0')
      Array(70).fill(1).map(async (_, index) => {
        await writeFile(join(tempdir, `bugsnag-stuff-${uid(index)}.json`), '{}')
      })

      const queue = new PayloadQueue(tempdir, 'stuff')
      await queue.enqueue({
        body: JSON.stringify({ colour: 'yellow' }),
        opts: { url: 'example.com', method: 'POST', headers: {} }
      })

      const items = await readdir(tempdir)
      expect(items.length).toEqual(64)

      for (let index = 7; index < 70; index++) {
        await access(join(tempdir, `bugsnag-stuff-${uid(index)}.json`), F_OK)
      }
    })

    it('does not queue the payload if it is invalid', async () => {
      const onerror = jest.fn()
      const queue = new PayloadQueue(tempdir, 'stuff', onerror)

      await queue.enqueue({
        body: JSON.stringify({ colour: 'yellow' }),
        opts: { url: 'example.com', method: 'POST', headers: {} }
      })

      await queue.enqueue({
        body: JSON.stringify({ colour: 'red' }),
        opts: { url: 'example.com', headers: {} }
      })

      const items = await readdir(tempdir)
      expect(items).toHaveLength(1)

      const contents = await readFile(join(tempdir, items[0]))
      expect(JSON.parse(contents.toString())).toEqual({
        body: JSON.stringify({ colour: 'yellow' }),
        opts: { url: 'example.com', method: 'POST', headers: {} }
      })

      expect(onerror).toHaveBeenCalledWith(new Error('Invalid payload!'))
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

    it('calls the onerror callback if there is an error', async (done) => {
      const queue = new PayloadQueue(tempdir, 'stuff', (err) => {
        expect(err).toBeTruthy()
        done()
      })
      await queue.remove(join(invalidDir(), 'somefile'))
    })
  })
})
