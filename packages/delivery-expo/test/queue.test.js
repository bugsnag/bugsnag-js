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
        'expo-file-system': MockFileSystem
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
          return Promise.resolve(['.DS_Store', '.meta', 'something_else'])
        },
        deleteAsync: () => {}
      }
      const Queue = proxyquire('../queue', {
        'expo-file-system': MockFileSystem
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
          return Promise.resolve([Queue.generateFilename('stuff')])
        },
        deleteAsync: async () => {}
      }
      const Queue = proxyquire('../queue', {
        'expo-file-system': MockFileSystem
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
        'expo-file-system': MockFileSystem
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
        'expo-file-system': MockFileSystem
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
          expect(path).toBe('file://var/data/foo.bar.app/bugsnag/stuff')
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
        'expo-file-system': MockFileSystem
      })
      const q = new Queue('stuff', err => expect(err).toBe(null))
      await q.enqueue()
      done()
    })

    it('creates the directory if it does not exist', async (done) => {
      const MockFileSystem = {
        cacheDirectory: 'file://var/data/foo.bar.app/',
        getInfoAsync: (path) => {
          expect(path).toBe('file://var/data/foo.bar.app/bugsnag/stuff')
          return Promise.resolve({ exists: false })
        },
        makeDirectoryAsync: (path) => {
          expect(path).toBe('file://var/data/foo.bar.app/bugsnag/stuff')
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
        'expo-file-system': MockFileSystem
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
        'expo-file-system': MockFileSystem
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
        'expo-file-system': MockFileSystem
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
        'expo-file-system': MockFileSystem
      })
      const q = new Queue('stuff')
      await q.update('file://var/data/foo.bar.app/bugsnag/stuff/bugsnag-stuff-1234.json', {
        retries: 3
      })
      done()
    })
  })

  describe('init()', () => {
    it('should only enter the create logic once for simultaneous calls', async (done) => {
      const exists = false
      const isDirectory = false
      let makeCount = 0
      const MockFileSystem = {
        cacheDirectory: 'file://var/data/foo.bar.app/',
        getInfoAsync: async () => ({ exists, isDirectory }),
        makeDirectoryAsync: () => new Promise((resolve, reject) => {
          makeCount++
          setTimeout(() => resolve(), 20)
        }),
        readAsStringAsync: () => {},
        writeAsStringAsync: () => {},
        readDirectoryAsync: () => {},
        deleteAsync: () => {}
      }
      const Queue = proxyquire('../queue', {
        'expo-file-system': MockFileSystem
      })
      const q = new Queue('stuff')
      const proms = []
      proms.push(() => q.init())
      proms.push(() => q.init())
      proms.push(() => new Promise((resolve, reject) => {
        setTimeout(() => {
          q.init().then(resolve, reject)
        }, 5)
      }))
      proms.push(() => new Promise((resolve, reject) => {
        setTimeout(() => {
          q.init().then(resolve, reject)
        }, 10)
      }))
      await Promise.all(proms.map(p => p()))
      expect(makeCount).toBe(1)
      done()
    })

    it('should tolerate errors when the directory was succesfully created', async (done) => {
      let exists = false
      let isDirectory = false
      const MockFileSystem = {
        cacheDirectory: 'file://var/data/foo.bar.app/',
        getInfoAsync: async () => ({ exists, isDirectory }),
        makeDirectoryAsync: () => new Promise((resolve, reject) => {
          setTimeout(() => {
            exists = true
            isDirectory = true
            reject(new Error('floop'))
          }, 20)
        }),
        readAsStringAsync: () => {},
        writeAsStringAsync: () => {},
        readDirectoryAsync: () => {},
        deleteAsync: () => {}
      }
      const Queue = proxyquire('../queue', {
        'expo-file-system': MockFileSystem
      })
      const q = new Queue('stuff')
      await q.init()
      done()
    })

    it('should rethrow errors when the directory was not succesfully created', async (done) => {
      const exists = false
      const isDirectory = false
      const MockFileSystem = {
        cacheDirectory: 'file://var/data/foo.bar.app/',
        getInfoAsync: async () => ({ exists, isDirectory }),
        makeDirectoryAsync: () => new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('fleerp'))
          }, 20)
        }),
        readAsStringAsync: () => {},
        writeAsStringAsync: () => {},
        readDirectoryAsync: () => {},
        deleteAsync: () => {}
      }
      const Queue = proxyquire('../queue', {
        'expo-file-system': MockFileSystem
      })
      const q = new Queue('stuff')
      let didErr = false
      try {
        await q.init()
      } catch (e) {
        expect(e).toBeTruthy()
        expect(e.message).toBe('fleerp')
        didErr = true
      }
      expect(didErr).toBe(true)
      done()
    })

    it('should reject all pending promises', async (done) => {
      const exists = false
      const isDirectory = false
      const MockFileSystem = {
        cacheDirectory: 'file://var/data/foo.bar.app/',
        getInfoAsync: async () => ({ exists, isDirectory }),
        makeDirectoryAsync: () => new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('fleerp'))
          }, 20)
        }),
        readAsStringAsync: () => {},
        writeAsStringAsync: () => {},
        readDirectoryAsync: () => {},
        deleteAsync: () => {}
      }
      const Queue = proxyquire('../queue', {
        'expo-file-system': MockFileSystem
      })
      const q = new Queue('stuff')
      const errs = []
      await Promise.all([
        q.init().catch(e => errs.push(e)),
        q.init().catch(e => errs.push(e)),
        q.init().catch(e => errs.push(e))
      ])
      expect(errs.length).toBe(3)
      done()
    })
  })
})
