import Bugsnag from '../../src/notifier'
import https from 'https'

// extend the https module type with the utilities added in mocks
declare module 'https' {
  let _requests: Array<{ opts: any, body: any }>
  function _clear(): void
}

jest.mock('https', () => {
  const { Readable, Writable } = require('stream') // eslint-disable-line

  const requests: any[] = []
  const httpsMock = jest.genMockFromModule('https') as any

  httpsMock.request = (opts: any) => {
    const req = new Writable({
      write: (body: any) => {
        requests.push({ opts, body: JSON.parse(body) })
      }
    })
    process.nextTick(() => {
      req.emit('response', new Readable({ read: function () { this.push(null) } }))
    })
    return req
  }

  const ret = httpsMock
  ret._requests = requests
  ret._clear = () => { while (requests.length) requests.pop() }
  return ret
})

// we can only start bugsnag once per file, because it installs global handlers
// and doesn't have a way to uninstall itself
beforeAll(() => {
  jest.spyOn(console, 'debug').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})

  Bugsnag.start({
    apiKey: 'aaaabbbbccccdddd0000111122223333',
    // ordinarily after catching an uncaught exception we shut down the process,
    // but we don't want that to happen in this test file
    onUncaughtException: () => {}
  })
})

// clear the https mock's record of requests between tests
beforeEach(() => https._clear())

describe('@bugsnag/node: handled and unhandled errors', () => {
  it('should send a handled error', (done) => {
    Bugsnag.notify(new Error('oh no'), () => {}, () => {
      expect(https._requests.length).toBe(1)
      expect(https._requests[0].body.events[0].exceptions[0].message).toBe('oh no')
      expect(https._requests[0].body.events[0].unhandled).toBe(false)
      expect(https._requests[0].body.events[0].severityReason).toEqual({ type: 'handledException' })
      done()
    })
  })

  it('should send an unhandled error', (done) => {
    // we can't actually throw an error as that will fail the test, but we can
    // send an error to the handler that Bugsnag has hooked into
    process.emit('uncaughtException', new Error('hi'))
    setTimeout(() => {
      expect(https._requests.length).toBe(1)
      expect(https._requests[0].body.events[0].exceptions[0].message).toBe('hi')
      expect(https._requests[0].body.events[0].unhandled).toBe(true)
      expect(https._requests[0].body.events[0].severityReason).toEqual({ type: 'unhandledException' })
      done()
    }, 200)
  })

  it('should send an unhandled rejection', (done) => {
    // we can't actually reject an error because that will fail the test, but we
    // can send an mocked promise rejection event
    const p = Promise.reject(new Error('rej')).catch(e => {
      process.emit('unhandledRejection', e, p)
    })
    setTimeout(() => {
      expect(https._requests.length).toBe(1)
      expect(https._requests[0].body.events[0].exceptions[0].message).toBe('rej')
      expect(https._requests[0].body.events[0].unhandled).toBe(true)
      expect(https._requests[0].body.events[0].severityReason).toEqual({ type: 'unhandledPromiseRejection' })
      done()
    }, 200)
  })
})
