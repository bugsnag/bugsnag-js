/* global describe, expect, it, spyOn */

const fetch = require('node-fetch')
const proxyquire = require('proxyquire').noCallThru().noPreserveCache()
const http = require('http')

const noopLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {}
}

class NoopQueue {
  async init () {}
  async enqueue () {}
  async dequeue () {}
}

class NoopRedelivery {
  start () {}
  stop () {}
}

class MockNetworkStatus {
  constructor () { this.isConnected = true }
  watch (fn) { fn(true) }
}

const mockServer = (statusCode = 200) => {
  const requests = []
  return {
    requests,
    server: http.createServer((req, res) => {
      let body = ''
      req.on('data', b => { body += b })
      req.on('end', () => {
        requests.push({
          url: req.url,
          method: req.method,
          headers: req.headers,
          body
        })
        res.statusCode = statusCode
        res.end(http.STATUS_CODES[statusCode])
      })
    })
  }
}

describe('delivery: expo', () => {
  it('sends reports successfully', done => {
    const delivery = proxyquire('../', {
      './queue': NoopQueue,
      './redelivery': NoopRedelivery,
      './network-status': MockNetworkStatus
    })

    const { requests, server } = mockServer()
    server.listen((err) => {
      expect(err).toBeUndefined()

      const payload = { events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }] }
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `http://0.0.0.0:${server.address().port}/notify/` },
        redactedKeys: []
      }
      delivery({ _config: config, __logger: noopLogger }, fetch).sendEvent(payload, (err) => {
        expect(err).toBe(null)
        expect(requests.length).toBe(1)
        expect(requests[0].method).toBe('POST')
        expect(requests[0].url).toMatch('/notify/')
        expect(requests[0].headers['content-type']).toEqual('application/json')
        expect(requests[0].headers['bugsnag-api-key']).toEqual('aaaaaaaa')
        expect(requests[0].headers['bugsnag-payload-version']).toEqual('4')
        expect(requests[0].headers['bugsnag-sent-at']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        expect(requests[0].body).toBe(JSON.stringify(payload))

        server.close()
        done()
      })
    })
  })

  it('sends sessions successfully', done => {
    const delivery = proxyquire('../', {
      './queue': NoopQueue,
      './redelivery': NoopRedelivery,
      './network-status': MockNetworkStatus
    })

    const { requests, server } = mockServer(202)
    server.listen((err) => {
      expect(err).toBeUndefined()

      const payload = { events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }] }
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: 'blah', sessions: `http://0.0.0.0:${server.address().port}/sessions/` },
        redactedKeys: []
      }
      delivery({ _config: config, __logger: noopLogger }, fetch).sendSession(payload, (err) => {
        expect(err).toBe(null)
        expect(requests.length).toBe(1)
        expect(requests[0].method).toBe('POST')
        expect(requests[0].url).toMatch('/sessions/')
        expect(requests[0].headers['content-type']).toEqual('application/json')
        expect(requests[0].headers['bugsnag-api-key']).toEqual('aaaaaaaa')
        expect(requests[0].headers['bugsnag-payload-version']).toEqual('1')
        expect(requests[0].headers['bugsnag-sent-at']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        expect(requests[0].body).toBe(JSON.stringify(payload))

        server.close()
        done()
      })
    })
  })

  it('handles errors gracefully (ECONNREFUSED)', done => {
    class MockQueue {
      async init () {}
      async enqueue (req) {}
      async dequeue () {}
    }
    const spiedEnqueue = spyOn(MockQueue.prototype, 'enqueue')
    const delivery = proxyquire('../', {
      './queue': MockQueue,
      './redelivery': NoopRedelivery,
      './network-status': MockNetworkStatus
    })

    const payload = { events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }] }
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: 'http://0.0.0.0:9999/notify/' },
      redactedKeys: []
    }
    let didLog = false
    const log = () => { didLog = true }
    delivery({ _config: config, __logger: { error: log, info: () => {} } }, fetch).sendEvent(payload, (err) => {
      expect(didLog).toBe(true)
      expect(err).toBeTruthy()
      expect(err.code).toBe('ECONNREFUSED')
      expect(spiedEnqueue).toHaveBeenCalled()
      done()
    })
  })

  it('handles errors gracefully (400)', done => {
    class MockQueue {
      async init () {}
      async enqueue (req) {}
      async dequeue () {}
    }
    const spiedEnqueue = spyOn(MockQueue.prototype, 'enqueue')
    const delivery = proxyquire('../', {
      './queue': MockQueue,
      './redelivery': NoopRedelivery,
      './network-status': MockNetworkStatus
    })

    const { requests, server } = mockServer(400)
    server.listen((err) => {
      expect(err).toBeUndefined()

      const payload = { events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }] }
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `http://0.0.0.0:${server.address().port}/notify/` },
        redactedKeys: []
      }
      let didLog = false
      const log = () => { didLog = true }
      delivery({ _config: config, __logger: { error: log, info: () => {} } }, fetch).sendEvent(payload, (err) => {
        expect(didLog).toBe(true)
        expect(spiedEnqueue).not.toHaveBeenCalled()
        expect(err).toBeTruthy()
        expect(requests.length).toBe(1)
        server.close()
        done()
      })
    })
  })

  it('handles errors gracefully for sessions (ECONNREFUSED)', done => {
    class MockQueue {
      async init () {}
      async enqueue (req) {}
      async dequeue () {}
    }
    const spiedEnqueue = spyOn(MockQueue.prototype, 'enqueue')
    const delivery = proxyquire('../', {
      './queue': MockQueue,
      './redelivery': NoopRedelivery,
      './network-status': MockNetworkStatus
    })

    const payload = { events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }] }
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { sessions: 'http://0.0.0.0:9999/sessions/' },
      redactedKeys: []
    }
    let didLog = false
    const log = () => { didLog = true }
    delivery({ _config: config, __logger: { error: log, info: () => {} } }, fetch).sendSession(payload, (err) => {
      expect(didLog).toBe(true)
      expect(err).toBeTruthy()
      expect(err.code).toBe('ECONNREFUSED')
      expect(spiedEnqueue).toHaveBeenCalled()
      done()
    })
  })

  it('handles errors gracefully (socket hang up)', done => {
    class MockQueue {
      async init () {}
      async enqueue (req) {}
      async dequeue () {}
    }
    const spiedEnqueue = spyOn(MockQueue.prototype, 'enqueue')
    const delivery = proxyquire('../', {
      './queue': MockQueue,
      './redelivery': NoopRedelivery,
      './network-status': MockNetworkStatus
    })

    const server = http.createServer((req, res) => {
      req.connection.destroy()
    })

    server.listen((err) => {
      expect(err).toBeFalsy()
      const payload = { events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }] }
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `http://0.0.0.0:${server.address().port}/notify/` },
        redactedKeys: []
      }
      let didLog = false
      const log = () => { didLog = true }
      delivery({ _config: config, __logger: { error: log, info: () => {} } }, fetch).sendEvent(payload, (err) => {
        expect(didLog).toBe(true)
        expect(err).toBeTruthy()
        expect(err.code).toBe('ECONNRESET')
        expect(spiedEnqueue).toHaveBeenCalled()
        done()
      })
    })
  })

  it('handles errors gracefully (HTTP 503)', done => {
    class MockQueue {
      async init () {}
      async enqueue (req) {}
      async dequeue () {}
    }
    const spiedEnqueue = spyOn(MockQueue.prototype, 'enqueue')
    const delivery = proxyquire('../', {
      './queue': MockQueue,
      './redelivery': NoopRedelivery,
      './network-status': MockNetworkStatus
    })

    const server = http.createServer((req, res) => {
      res.statusCode = 503
      res.end('NOT OK')
    })

    server.listen((err) => {
      expect(err).toBeFalsy()
      const payload = { events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }] }
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `http://0.0.0.0:${server.address().port}/notify/` },
        redactedKeys: []
      }
      let didLog = false
      const log = () => { didLog = true }
      delivery({ _config: config, __logger: { error: log, info: () => {} } }, fetch).sendEvent(payload, (err) => {
        expect(didLog).toBe(true)
        expect(err).toBeTruthy()
        expect(spiedEnqueue).toHaveBeenCalled()
        done()
      })
    })
  })

  it('does not send a report marked with report.attemptImmediateDelivery=false', done => {
    class MockQueue {
      async init () {}
      async enqueue (req) {}
      async dequeue () {}
    }
    const spiedEnqueue = spyOn(MockQueue.prototype, 'enqueue')
    const delivery = proxyquire('../', {
      './queue': MockQueue,
      './redelivery': NoopRedelivery,
      './network-status': MockNetworkStatus
    })

    const payload = {
      events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }],
      attemptImmediateDelivery: false
    }
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: 'https://some-address.com' },
      redactedKeys: []
    }
    delivery({ _config: config, __logger: noopLogger }, fetch).sendEvent(payload, (err) => {
      expect(err).not.toBeTruthy()
      expect(spiedEnqueue).toHaveBeenCalled()
      done()
    })
  })

  it('starts the redelivery loop if there is a connection', done => {
    class MockDelivery {
      start () {
        done()
      }
    }
    const delivery = proxyquire('../', {
      './queue': NoopQueue,
      './redelivery': MockDelivery,
      './network-status': MockNetworkStatus
    })
    delivery({ __logger: noopLogger }, fetch)
  })

  it('stops the redelivery loop if there is not a connection', done => {
    class MockDelivery {
      start () {}
      stop () {}
    }
    const startSpy = spyOn(MockDelivery.prototype, 'start')
    const stopSpy = spyOn(MockDelivery.prototype, 'stop')
    let watcher
    class MockNetworkStatus {
      constructor () {
        this.isConnected = false
      }

      watch (fn) {
        watcher = fn
        onWatch()
      }
    }
    const delivery = proxyquire('../', {
      './queue': NoopQueue,
      './redelivery': MockDelivery,
      './network-status': MockNetworkStatus
    })
    delivery({ __logger: noopLogger }, fetch)

    const onWatch = () => {
      expect(typeof watcher).toBe('function')
      watcher(true)
      expect(startSpy).toHaveBeenCalled()
      expect(stopSpy).not.toHaveBeenCalled()
      watcher(false)
      expect(stopSpy).toHaveBeenCalled()
      done()
    }
  })

  it('doesn’t attempt to send when not connected', done => {
    class MockQueue {
      async init () {}
      async enqueue (req) { console.log('enqueue') }
      async dequeue () {}
    }
    const spiedEnqueue = spyOn(MockQueue.prototype, 'enqueue')
    class MockNetworkStatus {
      constructor () {
        this.isConnected = false
      }

      watch () {}
    }
    const delivery = proxyquire('../', {
      './queue': MockQueue,
      './redelivery': NoopRedelivery,
      './network-status': MockNetworkStatus
    })
    const payload = { events: [{ errors: [{ errorClass: 'Error', errorMessage: 'foo is not a function' }] }] }
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: 'http://some-address.com' },
      redactedKeys: []
    }
    let n = 0
    const _done = () => {
      n++
      if (n === 2) done()
    }
    const d = delivery({ _config: config, __logger: noopLogger }, fetch)
    d.sendEvent(payload, (err) => {
      expect(err).not.toBeTruthy()
      expect(spiedEnqueue).toHaveBeenCalledTimes(1)
      _done()
    })
    d.sendSession(payload, (err) => {
      expect(err).not.toBeTruthy()
      expect(spiedEnqueue).toHaveBeenCalledTimes(2)
      _done()
    })
  })
})
