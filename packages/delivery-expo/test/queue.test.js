/* global describe, expect, it, spyOn */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache()

describe('delivery: expo -> queue', () => {
  describe('peek()', () => {
    it('returns null if there are no files', async (done) => {
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
      const Queue = proxyquire('../queue', {
        'expo': { FileSystem: MockFileSystem }
      })
      const q = new Queue('stuff')
      expect(await q.peek()).toBe(null)
      done()
    })

    it('returns null if there are only files that don’t match the expected pattern', async (done) => {
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
      const Queue = proxyquire('../queue', {
        'expo': { FileSystem: MockFileSystem }
      })
      const q = new Queue('stuff')
      expect(await q.peek()).toBe(null)
      done()
    })

    it('parses an existing file into JSON', async (done) => {
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
          return Promise.resolve([ Queue.generateFilename('stuff') ])
        },
        deleteAsync: async () => {}
      }
      const Queue = proxyquire('../queue', {
        'expo': { FileSystem: MockFileSystem }
      })
      const q = new Queue('stuff')
      const req = await q.peek()
      expect(req).not.toBe(null)
      expect(req.payload.url).toBe('https://notify.bugsnag.com/')
      expect(req.id).toBe(readPath)
      done()
    })

    it('calls the onerror callback and returns null if there is an error', async (done) => {
      const MockFileSystem = {
        cacheDirectory: 'file://var/data/foo.bar.app/',
        getInfoAsync: () => {},
        makeDirectoryAsync: () => {},
        readAsStringAsync: (path) => {
          return Promise.reject(new Error('beep'))
        },
        writeAsStringAsync: () => {},
        readDirectoryAsync: () => {
          return Promise.resolve(new Error('beep'))
        },
        deleteAsync: () => {}
      }
      const Queue = proxyquire('../queue', {
        'expo': { FileSystem: MockFileSystem }
      })
      const q = new Queue('stuff', err => {
        expect(err).not.toBe(null)
        done()
      })
      const req = await q.peek()
      expect(req).toBe(null)
    })

    it('removes a file if it’s not valid json', async (done) => {
      let files = []
      const MockFileSystem = {
        cacheDirectory: 'file://var/data/foo.bar.app/',
        getInfoAsync: () => {},
        makeDirectoryAsync: () => {},
        readAsStringAsync: (path) => {
          return Promise.resolve('{ not valid json')
        },
        writeAsStringAsync: () => {},
        readDirectoryAsync: () => {
          return Promise.resolve(files)
        },
        deleteAsync: async (id) => {
          files = files.filter(f => !id.endsWith(f))
          return Promise.resolve()
        }
      }
      const Queue = proxyquire('../queue', {
        'expo': { FileSystem: MockFileSystem }
      })
      files.push(Queue.generateFilename('stuff'))
      const q = new Queue('stuff')
      const req = await q.peek()
      expect(req).toBe(null)
      done()
    })
  })

  describe('enqueue()', () => {
    it('ensures the directory exists first', async (done) => {
      const MockFileSystem = {
        cacheDirectory: 'file://var/data/foo.bar.app/',
        getInfoAsync: (path) => {
          expect(path).toBe(`file://var/data/foo.bar.app/bugsnag/stuff`)
          return Promise.resolve({ exists: true, isDirectory: true })
        },
        makeDirectoryAsync: () => {},
        readAsStringAsync: () => {},
        writeAsStringAsync: () => {
          return Promise.resolve()
        },
        readDirectoryAsync: () => {
          return Promise.resolve([])
        },
        deleteAsync: () => {}
      }
      const Queue = proxyquire('../queue', {
        'expo': { FileSystem: MockFileSystem }
      })
      const q = new Queue('stuff', err => expect(err).toBe(null))
      await q.enqueue()
      done()
    })

    it('creates the directory if it does not exist', async (done) => {
      const MockFileSystem = {
        cacheDirectory: 'file://var/data/foo.bar.app/',
        getInfoAsync: (path) => {
          expect(path).toBe(`file://var/data/foo.bar.app/bugsnag/stuff`)
          return Promise.resolve({ exists: false })
        },
        makeDirectoryAsync: (path) => {
          expect(path).toBe(`file://var/data/foo.bar.app/bugsnag/stuff`)
          return Promise.resolve()
        },
        readAsStringAsync: () => {},
        writeAsStringAsync: () => {
          return Promise.resolve()
        },
        readDirectoryAsync: () => {
          return Promise.resolve([])
        },
        deleteAsync: () => {}
      }

      const Queue = proxyquire('../queue', {
        'expo': { FileSystem: MockFileSystem }
      })
      const q = new Queue('stuff', err => expect(err).toBe(null))
      await q.enqueue({})
      done()
    })

    it('calls the onerror callback if there is an error', async (done) => {
      const MockFileSystem = {
        cacheDirectory: 'file://var/data/foo.bar.app/',
        getInfoAsync: () => Promise.resolve({ exists: true, isDirectory: true }),
        makeDirectoryAsync: () => {},
        readAsStringAsync: (path) => {},
        writeAsStringAsync: () => {},
        readDirectoryAsync: () => {
          return Promise.reject(new Error('beep'))
        },
        deleteAsync: () => {}
      }
      const Queue = proxyquire('../queue', {
        'expo': { FileSystem: MockFileSystem }
      })
      const q = new Queue('stuff', err => expect(err).not.toBe(null))
      await q.enqueue({})
      done()
    })

    it('should purge items that are over the limit', async (done) => {
      const MockFileSystem = {
        cacheDirectory: 'file://var/data/foo.bar.app/',
        getInfoAsync: () => Promise.resolve({ exists: true, isDirectory: true }),
        makeDirectoryAsync: () => {},
        readAsStringAsync: (path) => {},
        writeAsStringAsync: () => {
          return Promise.resolve()
        },
        readDirectoryAsync: () => {
          const files = Array(70).fill(1).map(() => Queue.generateFilename('stuff'))
          return Promise.resolve(files)
        },
        deleteAsync: () => {}
      }
      const deleteSpy = spyOn(MockFileSystem, 'deleteAsync')
      const Queue = proxyquire('../queue', {
        'expo': { FileSystem: MockFileSystem }
      })
      const q = new Queue('stuff')
      await q.enqueue({})
      setTimeout(() => {
        expect(deleteSpy).toHaveBeenCalledTimes(6)
        done()
      }, 10)
    })
  })

  describe('update()', () => {
    it('should merge the updates with the existing object', async (done) => {
      const MockFileSystem = {
        cacheDirectory: 'file://var/data/foo.bar.app/',
        getInfoAsync: () => {},
        makeDirectoryAsync: () => {},
        readAsStringAsync: (path) => {
          return Promise.resolve('{"retries":2}')
        },
        writeAsStringAsync: async (path, data) => {
          expect(JSON.parse(data).retries).toBe(3)
          return Promise.resolve()
        },
        readDirectoryAsync: () => {},
        deleteAsync: () => {}
      }
      const Queue = proxyquire('../queue', {
        'expo': { FileSystem: MockFileSystem }
      })
      const q = new Queue('stuff')
      await q.update('file://var/data/foo.bar.app/bugsnag/stuff/bugsnag-stuff-1234.json', {
        retries: 3
      })
      done()
    })
  })
})
