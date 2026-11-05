const http = require('http')
const { EventEmitter } = require('events')
const { PassThrough } = require('stream')
const request = require('../request')

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

describe('Node delivery request lifecycle', () => {
  let server
  let sockets

  const listen = async handler => {
    sockets = new Set()
    server = http.createServer(handler)
    server.on('connection', socket => {
      sockets.add(socket)
      socket.on('close', () => sockets.delete(socket))
    })
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    return `http://127.0.0.1:${server.address().port}/notify`
  }

  const send = options => {
    const calls = []
    const release = jest.fn()
    const result = new Promise(resolve => {
      request({ headers: {}, body: '{}', timeoutMs: 1000, ...options }, (err, body) => {
        calls.push({ err, body })
        resolve({ err, body })
      }, release)
    })
    return { calls, result, release }
  }

  afterEach(async () => {
    jest.restoreAllMocks()
    if (!server) return
    for (const socket of sockets) socket.destroy()
    await new Promise(resolve => server.close(resolve))
    server = undefined
  })

  it('preserves legacy success without configured limits and clears its deadline', async () => {
    const url = await listen((req, res) => res.end('OK'))
    const clear = jest.spyOn(global, 'clearTimeout')
    const { calls, result } = send({ url })
    await expect(result).resolves.toEqual({ err: null, body: 'OK' })
    expect(clear).toHaveBeenCalled()
    await delay(20)
    expect(calls).toHaveLength(1)
  })

  it('cancels a silent receiver and completes once', async () => {
    const url = await listen(req => req.resume())
    const started = Date.now()
    const { calls, result } = send({ url, timeoutMs: 60 })
    expect((await result).err.code).toBe('ERR_DELIVERY_TIMEOUT')
    expect(Date.now() - started).toBeLessThan(1000)
    await delay(30)
    expect(sockets.size).toBe(0)
    expect(calls).toHaveLength(1)
  })

  it('bounds total time even when response bytes keep arriving', async () => {
    const url = await listen((req, res) => {
      const interval = setInterval(() => res.write('x'), 10)
      res.on('close', () => clearInterval(interval))
    })
    const { calls, result } = send({ url, timeoutMs: 80 })
    expect((await result).err.code).toBe('ERR_DELIVERY_TIMEOUT')
    await delay(30)
    expect(sockets.size).toBe(0)
    expect(calls).toHaveLength(1)
  })

  it('counts raw UTF-8 response bytes across chunks', async () => {
    const url = await listen((req, res) => {
      res.write('é')
      setImmediate(() => res.end('漢'))
    })
    await expect(send({ url, maxResponseBytes: 5 }).result).resolves.toEqual({ err: null, body: 'é漢' })
    const { calls, result } = send({ url, maxResponseBytes: 4 })
    expect((await result).err.code).toBe('ERR_DELIVERY_RESPONSE_SIZE')
    await delay(20)
    expect(calls).toHaveLength(1)
  })

  it('cancels oversized responses including unsuccessful responses', async () => {
    const url = await listen((req, res) => {
      res.statusCode = 503
      res.write('x'.repeat(1024))
    })
    const { result } = send({ url, maxResponseBytes: 32 })
    expect((await result).err.code).toBe('ERR_DELIVERY_RESPONSE_SIZE')
    await delay(20)
    expect(sockets.size).toBe(0)
  })

  it('completes a response aborted before its declared body length', async () => {
    const url = await listen((req, res) => {
      res.writeHead(200, { 'Content-Length': 100 })
      res.write('partial')
      setTimeout(() => res.destroy(), 10)
    })
    const { calls, result } = send({ url })
    expect((await result).err.code).toBe('ERR_DELIVERY_CLOSED')
    await delay(20)
    expect(calls).toHaveLength(1)
  })

  it('rejects excessive request bytes before opening a connection', async () => {
    const url = await listen(() => {})
    const { calls, result } = send({ url, body: 'é', maxRequestBytes: 1 })
    expect((await result).err.code).toBe('ERR_DELIVERY_REQUEST_SIZE')
    expect(calls).toHaveLength(1)
    expect(sockets.size).toBe(0)
  })

  it('completes synchronous setup errors', async () => {
    const { calls, result } = send({ url: 'invalid URL' })
    expect((await result).err.code).toBe('ERR_INVALID_URL')
    expect(calls).toHaveLength(1)
  })

  it('ignores error and close events after successful completion', async () => {
    const req = new EventEmitter()
    req.destroy = jest.fn()
    const res = new PassThrough()
    res.statusCode = 200
    req.end = () => {
      req.emit('response', res)
      res.end('OK')
      setImmediate(() => {
        req.emit('error', new Error('late request error'))
        res.emit('error', new Error('late response error'))
        req.emit('close')
      })
    }
    jest.spyOn(http, 'request').mockReturnValue(req)
    const { calls, result, release } = send({ url: 'http://localhost/' })
    await expect(result).resolves.toEqual({ err: null, body: 'OK' })
    await delay(20)
    expect(calls).toHaveLength(1)
    expect(req.destroy).not.toHaveBeenCalled()
    expect(release).toHaveBeenCalledTimes(1)
  })
})
