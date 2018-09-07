const { describe, it, expect } = global

const delivery = require('../')
const http = require('http')

const mockServer = () => {
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

      const payload = { sample: 'payload' }
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: `http://0.0.0.0:${server.address().port}/notify/` },
        filters: []
      }
      delivery().sendReport({}, config, payload, (err) => {
        expect(err).toBe(null)
        expect(requests.length).toBe(1)
        expect(requests[0].method).toBe('POST')
        expect(requests[0].url).toMatch('/notify/')
        expect(requests[0].headers['content-type']).toEqual('application/json')
        expect(requests[0].headers['bugsnag-api-key']).toEqual('aaaaaaaa')
        expect(requests[0].headers['bugsnag-payload-version']).toEqual('4.0')
        expect(requests[0].headers['bugsnag-sent-at']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        expect(requests[0].body).toBe(JSON.stringify(payload))

        server.close()
        done()
      })
    })
  })

  it('sends sessions successfully', done => {
    const { requests, server } = mockServer()
    server.listen((err) => {
      expect(err).toBeUndefined()

      const payload = { sample: 'payload' }
      const config = {
        apiKey: 'aaaaaaaa',
        endpoints: { notify: 'blah', sessions: `http://0.0.0.0:${server.address().port}/sessions/` },
        filters: []
      }
      delivery().sendSession({}, config, payload, (err) => {
        expect(err).toBe(null)
        expect(requests.length).toBe(1)
        expect(requests[0].method).toBe('POST')
        expect(requests[0].url).toMatch('/sessions/')
        expect(requests[0].headers['content-type']).toEqual('application/json')
        expect(requests[0].headers['bugsnag-api-key']).toEqual('aaaaaaaa')
        expect(requests[0].headers['bugsnag-payload-version']).toEqual('1.0')
        expect(requests[0].headers['bugsnag-sent-at']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        expect(requests[0].body).toBe(JSON.stringify(payload))

        server.close()
        done()
      })
    })
  })
})
