/* global describe, expect, it */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache()

describe('delivery: expo -> queue', () => {
  describe('dequeue()', () => {
    it('returns null if there are no files', async () => {
      const MockFileSystem = {
        cacheDirectory: 'file://var/data/foo.bar.app/',
        getInfoAsync: () => {},
        makeDirectoryAsync: () => {},
        readAsStringAsync: () => {},
        writeAsStringAsync: () => {},
        readDirectoryAsync: () => {
          return Promise.resolve([])
        },
        deleteAsync: () => {}
      }
      const { dequeue } = proxyquire('../queue', {
        'expo': { FileSystem: MockFileSystem }
      })
      expect(await dequeue(err => expect(err).toBe(null))).toBe(null)
    })

    it('returns null if there are only files that don’t match the expected pattern', async () => {
      const MockFileSystem = {
        cacheDirectory: 'file://var/data/foo.bar.app/',
        getInfoAsync: () => {},
        makeDirectoryAsync: () => {},
        readAsStringAsync: () => {},
        writeAsStringAsync: () => {},
        readDirectoryAsync: () => {
          return Promise.resolve([ '.DS_Store', '.meta', 'something_else' ])
        },
        deleteAsync: () => {}
      }
      const { dequeue } = proxyquire('../queue', {
        'expo': { FileSystem: MockFileSystem }
      })
      expect(await dequeue(err => expect(err).toBe(null))).toBe(null)
    })

    it('parses an existing file into JSON and removes it', async () => {
      let readPath
      const MockFileSystem = {
        cacheDirectory: 'file://var/data/foo.bar.app/',
        getInfoAsync: () => {},
        makeDirectoryAsync: () => {},
        readAsStringAsync: (path) => {
          readPath = path
          return Promise.resolve(JSON.stringify({
            url: 'https://notify.bugsnag.com/',
            opts: { body: '', headers: {} },
            retries: 0
          }))
        },
        writeAsStringAsync: () => {},
        readDirectoryAsync: () => {
          return Promise.resolve([ generateFilename() ])
        },
        deleteAsync: (path) => {
          expect(path).toBe(readPath)
        }
      }
      const { dequeue, generateFilename } = proxyquire('../queue', {
        'expo': { FileSystem: MockFileSystem }
      })
      const req = await dequeue(err => expect(err).toBe(null))
      expect(req).not.toBe(null)
      expect(req.url).toBe('https://notify.bugsnag.com/')
    })

    it('calls the onerror callback and returns null if there is an error', async () => {
      const MockFileSystem = {
        cacheDirectory: 'file://var/data/foo.bar.app/',
        getInfoAsync: () => {},
        makeDirectoryAsync: () => {},
        readAsStringAsync: (path) => {
          return Promise.reject(new Error('beep'))
        },
        writeAsStringAsync: () => {},
        readDirectoryAsync: () => {
          return Promise.resolve([ generateFilename() ])
        },
        deleteAsync: () => {}
      }
      const { dequeue, generateFilename } = proxyquire('../queue', {
        'expo': { FileSystem: MockFileSystem }
      })
      const req = await dequeue(err => expect(err).not.toBe(null))
      expect(req).toBe(null)
    })
  })

  describe('enqueue()', () => {
    it('ensures the directory exists first', async () => {
      const MockFileSystem = {
        cacheDirectory: 'file://var/data/foo.bar.app/',
        getInfoAsync: (path) => {
          expect(path).toBe(`file://var/data/foo.bar.app/bugsnag/payloads`)
          return Promise.resolve({ exists: true, isDirectory: true })
        },
        makeDirectoryAsync: () => {},
        readAsStringAsync: () => {},
        writeAsStringAsync: () => {
          return Promise.resolve()
        },
        readDirectoryAsync: () => {},
        deleteAsync: () => {}
      }
      const { enqueue } = proxyquire('../queue', {
        'expo': { FileSystem: MockFileSystem }
      })
      await enqueue(err => expect(err).toBe(null))
    })

    it('creates the directory if it does not exist', async () => {
      const MockFileSystem = {
        cacheDirectory: 'file://var/data/foo.bar.app/',
        getInfoAsync: (path) => {
          expect(path).toBe(`file://var/data/foo.bar.app/bugsnag/payloads`)
          return Promise.resolve({ exists: false })
        },
        makeDirectoryAsync: (path) => {
          expect(path).toBe(`file://var/data/foo.bar.app/bugsnag/payloads`)
          return Promise.resolve()
        },
        readAsStringAsync: () => {},
        writeAsStringAsync: () => {
          return Promise.resolve()
        },
        readDirectoryAsync: () => {},
        deleteAsync: () => {}
      }
      const { enqueue } = proxyquire('../queue', {
        'expo': { FileSystem: MockFileSystem }
      })
      await enqueue(err => expect(err).toBe(null))
    })

    it('calls the onerror callback if there is an error', async () => {
      const MockFileSystem = {
        cacheDirectory: 'file://var/data/foo.bar.app/',
        getInfoAsync: () => {},
        makeDirectoryAsync: () => {},
        readAsStringAsync: (path) => {},
        writeAsStringAsync: () => {},
        readDirectoryAsync: () => {
          return Promise.reject(new Error('beep'))
        },
        deleteAsync: () => {}
      }
      const { enqueue } = proxyquire('../queue', {
        'expo': { FileSystem: MockFileSystem }
      })
      await enqueue(err => expect(err).not.toBe(null))
    })
  })
})
