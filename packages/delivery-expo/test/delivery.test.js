/* global describe, expect, it, spyOn */

const fetch = require('node-fetch')
const proxyquire = require('proxyquire').noCallThru().noPreserveCache()
const http = require('http')

const noopQueue = {
  enqueue: () => {},
  dequeue: () => {}
}
const noopRedelivery = () => {}

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
      './queue': noopQueue,
      './redelivery': noopRedelivery
    })

    const { requests, server } = mockServer()
    server.listen((err) => {
      expect(err).toBeUndefined()

      const payload = { sample: 'payload' }
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `http://0.0.0.0:${server.address().port}/notify/` },
        filters: []
      }
      delivery({ config, _logger: {} }, fetch).sendReport(payload, (err) => {
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
      './queue': noopQueue,
      './redelivery': noopRedelivery
    })

    const { requests, server } = mockServer(202)
    server.listen((err) => {
      expect(err).toBeUndefined()

      const payload = { sample: 'payload' }
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: 'blah', sessions: `http://0.0.0.0:${server.address().port}/sessions/` },
        filters: []
      }
      delivery({ config, _logger: {} }, fetch).sendSession(payload, (err) => {
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
    const mockQueue = { enqueue: (req) => {}, dequeue: () => {} }
    const spiedEnqueue = spyOn(mockQueue, 'enqueue')
    const delivery = proxyquire('../', {
      './queue': mockQueue,
      './redelivery': noopRedelivery
    })

    const payload = { sample: 'payload' }
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: `http://0.0.0.0:9999/notify/` },
      filters: []
    }
    let didLog = false
    const log = () => { didLog = true }
    delivery({ config, _logger: { error: log } }, fetch).sendReport(payload, (err) => {
      expect(didLog).toBe(true)
      expect(err).toBeTruthy()
      expect(err.code).toBe('ECONNREFUSED')
      expect(spiedEnqueue).toHaveBeenCalled()
      done()
    })
  })

  it('handles errors gracefully (400)', done => {
    const mockQueue = { enqueue: (req) => {}, dequeue: () => {} }
    const spiedEnqueue = spyOn(mockQueue, 'enqueue')
    const delivery = proxyquire('../', {
      './queue': mockQueue,
      './redelivery': noopRedelivery
    })

    const { requests, server } = mockServer(400)
    server.listen((err) => {
      expect(err).toBeUndefined()

      const payload = { sample: 'payload' }
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `http://0.0.0.0:${server.address().port}/notify/` },
        filters: []
      }
      let didLog = false
      const log = () => { didLog = true }
      delivery({ config, _logger: { error: log } }, fetch).sendReport(payload, (err) => {
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
    const mockQueue = { enqueue: (req) => {}, dequeue: () => {} }
    const spiedEnqueue = spyOn(mockQueue, 'enqueue')
    const delivery = proxyquire('../', {
      './queue': mockQueue,
      './redelivery': noopRedelivery
    })

    const payload = { sample: 'payload' }
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { sessions: `http://0.0.0.0:9999/sessions/` },
      filters: []
    }
    let didLog = false
    const log = () => { didLog = true }
    delivery({ config, _logger: { error: log } }, fetch).sendSession(payload, (err) => {
      expect(didLog).toBe(true)
      expect(err).toBeTruthy()
      expect(err.code).toBe('ECONNREFUSED')
      expect(spiedEnqueue).toHaveBeenCalled()
      done()
    })
  })

  it('handles errors gracefully (socket hang up)', done => {
    const mockQueue = { enqueue: (req) => {}, dequeue: () => {} }
    const spiedEnqueue = spyOn(mockQueue, 'enqueue')
    const delivery = proxyquire('../', {
      './queue': mockQueue,
      './redelivery': noopRedelivery
    })

    const server = http.createServer((req, res) => {
      req.connection.destroy()
    })

    server.listen((err) => {
      expect(err).toBeFalsy()
      const payload = { sample: 'payload' }
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `http://0.0.0.0:${server.address().port}/notify/` },
        filters: []
      }
      let didLog = false
      const log = () => { didLog = true }
      delivery({ config, _logger: { error: log } }, fetch).sendReport(payload, (err) => {
        expect(didLog).toBe(true)
        expect(err).toBeTruthy()
        expect(err.code).toBe('ECONNRESET')
        expect(spiedEnqueue).toHaveBeenCalled()
        done()
      })
    })
  })

  it('handles errors gracefully (HTTP 503)', done => {
    const mockQueue = { enqueue: (req) => {}, dequeue: () => {} }
    const spiedEnqueue = spyOn(mockQueue, 'enqueue')
    const delivery = proxyquire('../', {
      './queue': mockQueue,
      './redelivery': noopRedelivery
    })

    const server = http.createServer((req, res) => {
      res.statusCode = 503
      res.end('NOT OK')
    })

    server.listen((err) => {
      expect(err).toBeFalsy()
      const payload = { sample: 'payload' }
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `http://0.0.0.0:${server.address().port}/notify/` },
        filters: []
      }
      let didLog = false
      const log = () => { didLog = true }
      delivery({ config, _logger: { error: log } }, fetch).sendReport(payload, (err) => {
        expect(didLog).toBe(true)
        expect(err).toBeTruthy()
        expect(spiedEnqueue).toHaveBeenCalled()
        done()
      })
    })
  })

  it('starts the redelivery loop', done => {
    const mockDelivery = {
      start: (send, noopQueue) => {
        expect(typeof send).toBe('function')
        done()
      }
    }
    const delivery = proxyquire('../', {
      './queue': noopQueue,
      './redelivery': mockDelivery.start
    })
    delivery({}, fetch)
  })
})
