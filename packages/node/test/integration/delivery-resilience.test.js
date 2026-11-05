const http = require('http')
const { spawn } = require('child_process')

const childScript = `
  const Bugsnag = require(process.env.BUGSNAG_TEST_ENTRY)
  const scenario = process.env.BUGSNAG_TEST_SCENARIO
  let agent
  if (scenario === 'queued') {
    const http = require('http')
    agent = new http.Agent({ maxSockets: 1 })
    http.get(process.env.BUGSNAG_TEST_ENDPOINT, { agent }).on('error', () => {})
  }
  const client = Bugsnag.createClient({
    apiKey: 'a'.repeat(32),
    endpoints: { notify: process.env.BUGSNAG_TEST_ENDPOINT, sessions: process.env.BUGSNAG_TEST_ENDPOINT },
    ...(scenario === 'observer-notify' ? {} : { sendCode: false }),
    autoTrackSessions: false,
    autoDetectErrors: scenario !== 'clones',
    enabledBreadcrumbTypes: [],
    logger: null,
    agent,
    deliveryOptions: { maxInFlight: 1, timeoutMs: 80 },
    onDelivery: result => {
      process.stdout.write(JSON.stringify(result) + '\\n')
      if (scenario === 'observer-notify') {
        const completed = err => process.stdout.write('reentrant:' + err.code + '\\n')
        client.notify(new Error('observer notification'), () => {}, completed)
        client.getPlugin('contextualize')(() => {
          client.notify(new Error('context observer notification'), () => {}, completed)
        })
        client._notify(new client.Event('Error', 'automatic observer notification', []), () => {}, completed)
        return
      }
      if (scenario === 'async-observer') return Promise.reject(new Error('async observer failed'))
      if (scenario !== 'clones') throw new Error('observer failed')
    }
  })
  if (scenario === 'clones') {
    const contextualize = client.getPlugin('contextualize')
    Promise.all(Array.from({ length: 20 }, () => contextualize(() =>
      new Promise(resolve => client.notify(new Error('context error'), () => {}, resolve))
    ))).then(() => process.stdout.write('completed\\n'))
  } else if (scenario === 'observer-notify' || scenario === 'async-observer') {
    client.notify(new Error('initial notification'), () => {}, () => {
      setTimeout(() => process.stdout.write('completed\\n'), 150)
    })
  } else {
    if (scenario === 'capacity') client.notify(new Error('pending event'))
    setImmediate(() => { throw new Error('fatal error') })
  }
`

describe('Node notifier delivery resilience', () => {
  let server
  let sockets
  let received
  let endpoint

  beforeEach(async () => {
    sockets = new Set()
    received = 0
    server = http.createServer(req => { received++; req.resume() })
    server.on('connection', socket => {
      sockets.add(socket)
      socket.on('close', () => sockets.delete(socket))
    })
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    endpoint = `http://127.0.0.1:${server.address().port}/`
  })

  afterEach(async () => {
    for (const socket of sockets) socket.destroy()
    await new Promise(resolve => server.close(resolve))
  })

  const run = scenario => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['-e', childScript], {
      env: {
        ...process.env,
        BUGSNAG_TEST_ENTRY: process.env.BUGSNAG_TEST_BUNDLE || require.resolve('../../src/notifier'),
        BUGSNAG_TEST_ENDPOINT: endpoint,
        BUGSNAG_TEST_SCENARIO: scenario
      }
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', data => { stdout += data })
    child.stderr.on('data', data => { stderr += data })
    const watchdog = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error(`Child did not complete: ${stderr}`))
    }, 3000)
    child.on('error', err => { clearTimeout(watchdog); reject(err) })
    child.on('close', (code, signal) => {
      clearTimeout(watchdog)
      resolve({ code, signal, stdout, stderr })
    })
  })

  it.each([['timeout', 'timeout'], ['capacity', 'capacity'], ['queued', 'timeout']])('terminates an uncaught exception after %s even when its observer throws', async (scenario, reason) => {
    const result = await run(scenario)
    expect(result.code).toBe(1)
    expect(result.signal).toBe(null)
    expect(result.stdout).toContain(`"reason":"${reason}"`)
    expect(result.stderr).toBe('')
  })

  it('shares delivery admission across public contextualized clients', async () => {
    const result = await run('clones')
    expect(result.code).toBe(0)
    expect(result.stderr).toBe('')
    const lines = result.stdout.trim().split('\n')
    expect(lines.pop()).toBe('completed')
    const outcomes = lines.map(line => JSON.parse(line))
    expect(outcomes.filter(result => result.reason === 'capacity')).toHaveLength(19)
    expect(outcomes.filter(result => result.reason === 'timeout')).toHaveLength(1)
    expect(received).toBe(1)
    expect(sockets.size).toBe(0)
  })

  it('rejects observer notifications before asynchronous source enrichment, including contextual and automatic paths', async () => {
    const result = await run('observer-notify')
    expect(result.code).toBe(0)
    expect(result.stderr).toBe('')
    const lines = result.stdout.trim().split('\n')
    expect(lines.pop()).toBe('completed')
    expect(lines.filter(line => line === 'reentrant:ERR_DELIVERY_OBSERVER')).toHaveLength(3)
    const outcomes = lines.filter(line => line[0] === '{').map(line => JSON.parse(line))
    expect(outcomes).toEqual([{ kind: 'event', status: 'failed', reason: 'timeout' }])
    expect(received).toBe(1)
    expect(sockets.size).toBe(0)
  })

  it('contains rejected observer promises with automatic error detection enabled', async () => {
    const result = await run('async-observer')
    expect(result.code).toBe(0)
    expect(result.stderr).toBe('')
    const lines = result.stdout.trim().split('\n')
    expect(lines.pop()).toBe('completed')
    expect(lines.map(line => JSON.parse(line))).toEqual([{ kind: 'event', status: 'failed', reason: 'timeout' }])
    expect(received).toBe(1)
    expect(sockets.size).toBe(0)
  })
})
