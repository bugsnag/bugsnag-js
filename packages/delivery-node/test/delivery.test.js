const { describe, it, expect } = global

const delivery = require('../')
const http = require('http')

const mockServer = (successCode = 200) => {
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
        res.statusCode = successCode
        res.end('OK')
      })
    })
  }
}

describe('delivery:node', () => {
  it('sends reports successfully', done => {
    const { requests, server } = mockServer()
    server.listen((err) => {
      expect(err).toBeUndefined()

      const payload = { sample: 'payload', apiKey: 'aaaaaaaa' }
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `http://0.0.0.0:${server.address().port}/notify/` },
        redactedKeys: []
      }
      delivery({ __logger: {}, _config: config }).sendEvent(payload, (err) => {
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
    const { requests, server } = mockServer(202)
    server.listen((err) => {
      expect(err).toBeUndefined()

      const payload = { sample: 'payload', apiKey: 'aaaaaaaa' }
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: 'blah', sessions: `http://0.0.0.0:${server.address().port}/sessions/` },
        redactedKeys: []
      }
      delivery({ __logger: {}, _config: config }).sendSession(payload, (err) => {
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
    const payload = { sample: 'payload', apiKey: 'aaaaaaaa' }
    const config = {
      apiKey: 'aaaaaaaa',
      endpoints: { notify: 'http://0.0.0.0:9999/notify/' },
      redactedKeys: []
    }
    let didLog = false
    const log = () => { didLog = true }
    delivery({ _config: config, __logger: { error: log } }).sendEvent(payload, (err) => {
      expect(didLog).toBe(true)
      expect(err).toBeTruthy()
      expect(err.code).toBe('ECONNREFUSED')
      done()
    })
  })

  it('handles errors gracefully (socket hang up)', done => {
    const server = http.createServer((req, res) => {
      req.connection.destroy()
    })

    server.listen((err) => {
      expect(err).toBeFalsy()
      const payload = { sample: 'payload', apiKey: 'aaaaaaaa' }
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `http://0.0.0.0:${server.address().port}/notify/` },
        redactedKeys: []
      }
      let didLog = false
      const log = () => { didLog = true }
      delivery({ _config: config, __logger: { error: log } }).sendEvent(payload, (err) => {
        expect(didLog).toBe(true)
        expect(err).toBeTruthy()
        expect(err.code).toBe('ECONNRESET')
        done()
      })
    })
  })

  it('handles errors gracefully (HTTP 503)', done => {
    const server = http.createServer((req, res) => {
      res.statusCode = 503
      res.end('NOT OK')
    })

    server.listen((err) => {
      expect(err).toBeFalsy()
      const payload = { sample: 'payload', apiKey: 'aaaaaaaa' }
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `http://0.0.0.0:${server.address().port}/notify/` },
        redactedKeys: []
      }
      let didLog = false
      const log = () => { didLog = true }
      delivery({ _config: config, __logger: { error: log } }).sendEvent(payload, (err) => {
        expect(didLog).toBe(true)
        expect(err).toBeTruthy()
        done()
      })
    })
  })
})
