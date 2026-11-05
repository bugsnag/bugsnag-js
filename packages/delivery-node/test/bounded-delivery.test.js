const http = require('http')
const delivery = require('../delivery')
const payload = require('@bugsnag/core/lib/json-payload')

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

describe('Node delivery admission', () => {
  let server
  let sockets
  let url
  let healthy
  let received

  beforeEach(async () => {
    healthy = false
    received = 0
    sockets = new Set()
    server = http.createServer((req, res) => {
      received++
      req.resume()
      if (healthy) res.end('OK')
    })
    server.on('connection', socket => {
      sockets.add(socket)
      socket.on('close', () => sockets.delete(socket))
    })
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    url = `http://127.0.0.1:${server.address().port}/`
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    for (const socket of sockets) socket.destroy()
    await new Promise(resolve => server.close(resolve))
  })

  const create = (deliveryOptions, onDelivery, agent) => {
    const logger = { error: jest.fn(), warn: jest.fn() }
    const client = {
      _config: { apiKey: 'a'.repeat(32), endpoints: { notify: url, sessions: url }, redactedKeys: [], deliveryOptions, onDelivery, agent },
      _logger: logger
    }
    return { reporter: delivery(client), logger }
  }

  const send = (reporter, value = {}, kind = 'sendEvent') => new Promise(resolve => reporter[kind](value, resolve))

  it('rejects overflow before serialization and recovers after a timeout without queued events', async () => {
    const outcomes = []
    const { reporter } = create({ maxInFlight: 2, timeoutMs: 80 }, result => outcomes.push(result))
    let serialized = 0
    const event = { toJSON: () => { serialized++; return { sample: 'payload' } } }
    const results = await Promise.all(Array.from({ length: 40 }, () => send(reporter, event)))
    expect(serialized).toBe(2)
    expect(received).toBe(2)
    expect(results.filter(err => err.code === 'ERR_DELIVERY_CAPACITY')).toHaveLength(38)
    expect(results.filter(err => err.code === 'ERR_DELIVERY_TIMEOUT')).toHaveLength(2)
    expect(outcomes).toHaveLength(40)
    expect(outcomes.filter(result => result.reason === 'capacity')).toEqual(Array(38).fill({ kind: 'event', status: 'rejected', reason: 'capacity' }))
    await delay(30)
    expect(sockets.size).toBe(0)
    healthy = true
    await expect(send(reporter)).resolves.toBe(null)
    expect(outcomes[outcomes.length - 1]).toEqual({ kind: 'event', status: 'success', reason: 'success' })
  })

  it('shares capacity between session and event delivery', async () => {
    const { reporter } = create({ maxInFlight: 1, timeoutMs: 50 })
    const pending = send(reporter)
    const serialize = jest.spyOn(payload, 'session')
    expect((await send(reporter, {}, 'sendSession')).code).toBe('ERR_DELIVERY_CAPACITY')
    expect(serialize).not.toHaveBeenCalled()
    expect((await pending).code).toBe('ERR_DELIVERY_TIMEOUT')
  })

  it('preserves concurrent delivery without an opted-in capacity limit', async () => {
    healthy = true
    const { reporter } = create()
    await expect(Promise.all(Array.from({ length: 8 }, () => send(reporter)))).resolves.toEqual(Array(8).fill(null))
    expect(received).toBe(8)
  })

  it('does not log expected capacity rejections or serialize them', async () => {
    const { reporter, logger } = create({ maxInFlight: 1, timeoutMs: 50 })
    const pending = send(reporter)
    const toJSON = jest.fn()
    expect((await send(reporter, { toJSON })).code).toBe('ERR_DELIVERY_CAPACITY')
    expect(toJSON).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
    await pending
  })

  it('isolates observer exceptions and recursion, and replaces per-delivery logging', async () => {
    const observer = jest.fn(() => {
      reporter.sendEvent({})
      throw new Error('observer failure')
    })
    const { reporter, logger } = create({ maxInFlight: 1, timeoutMs: 50 }, observer)
    const pending = send(reporter)
    expect((await send(reporter)).code).toBe('ERR_DELIVERY_CAPACITY')
    expect(observer).toHaveBeenCalledTimes(1)
    expect((await pending).code).toBe('ERR_DELIVERY_TIMEOUT')
    expect(observer).toHaveBeenCalledTimes(2)
    expect(logger.error).not.toHaveBeenCalled()
    await delay(80)
    expect(observer).toHaveBeenCalledTimes(2)
  })

  it('completes serialization failures exactly once and releases capacity', async () => {
    healthy = true
    const { reporter } = create({ maxInFlight: 1 }, () => {})
    const serialize = jest.spyOn(payload, 'event').mockImplementationOnce(() => { throw new Error('invalid payload') })
    const cb = jest.fn()
    reporter.sendEvent({}, cb)
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb.mock.calls[0][0].message).toBe('invalid payload')
    serialize.mockRestore()
    await expect(send(reporter)).resolves.toBe(null)
  })

  it('treats falsy thrown values as serialization failures and releases capacity', async () => {
    healthy = true
    const outcomes = []
    const { reporter } = create({ maxInFlight: 1 }, result => outcomes.push(result))
    const failure = null
    jest.spyOn(payload, 'event').mockImplementationOnce(() => { throw failure })
    expect((await send(reporter)).message).toBe('Payload serialization failed')
    expect(outcomes).toEqual([{ kind: 'event', status: 'rejected', reason: 'serialization' }])
    await expect(send(reporter)).resolves.toBe(null)
  })

  it('includes synchronous serialization time in the delivery deadline', async () => {
    const { reporter } = create({ timeoutMs: 50 }, () => {})
    const time = jest.spyOn(process, 'hrtime').mockReturnValueOnce([1, 0]).mockReturnValueOnce([0, 51000000])
    const pending = send(reporter)
    time.mockRestore()
    expect((await pending).code).toBe('ERR_DELIVERY_TIMEOUT')
    expect(received).toBe(0)
  })

  it('keeps its deadline when the wall clock moves backwards', async () => {
    const { reporter } = create({ timeoutMs: 30 }, () => {})
    jest.spyOn(Date, 'now').mockReturnValue(-1000000000000)
    expect((await send(reporter)).code).toBe('ERR_DELIVERY_TIMEOUT')
  })

  it('still completes when a custom logger throws', async () => {
    const { reporter, logger } = create({ timeoutMs: 20 })
    logger.error.mockImplementation(() => { throw new Error('logger failure') })
    expect((await send(reporter)).code).toBe('ERR_DELIVERY_TIMEOUT')
  })

  it('bounds destroyed requests retained by a saturated shared Agent and recovers when it frees', async () => {
    const agent = new http.Agent({ maxSockets: 1, keepAlive: true })
    const blocker = http.get(url, { agent })
    blocker.on('error', () => {})
    const { reporter } = create({ maxInFlight: 1, timeoutMs: 40 }, () => {}, agent)
    try {
      expect((await send(reporter)).code).toBe('ERR_DELIVERY_TIMEOUT')
      for (let i = 0; i < 20; i++) {
        expect((await send(reporter)).code).toBe('ERR_DELIVERY_CAPACITY')
      }
      const queued = () => Object.values(agent.requests).reduce((count, requests) => count + requests.length, 0)
      expect(queued()).toBe(1)
      blocker.destroy()
      await delay(30)
      expect(queued()).toBe(0)
      healthy = true
      await expect(send(reporter)).resolves.toBe(null)
    } finally {
      blocker.destroy()
      agent.destroy()
    }
  })

  it('releases successful deliveries while keep-alive sockets remain reusable', async () => {
    healthy = true
    const agent = new http.Agent({ maxSockets: 1, keepAlive: true })
    const { reporter } = create({ maxInFlight: 1, timeoutMs: 100 }, () => {}, agent)
    try {
      for (let i = 0; i < 5; i++) await expect(send(reporter)).resolves.toBe(null)
      expect(received).toBe(5)
      expect(sockets.size).toBe(1)
      expect(Object.values(agent.requests)).toHaveLength(0)
    } finally {
      agent.destroy()
    }
  })
})
