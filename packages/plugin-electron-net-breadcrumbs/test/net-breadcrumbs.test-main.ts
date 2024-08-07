import Breadcrumb from '@bugsnag/core/breadcrumb'
import { net } from 'electron'
import { AddressInfo } from 'net'
import { createServer, STATUS_CODES, Server, IncomingMessage, ServerResponse } from 'http'
import { makeClientForPlugin } from '@bugsnag/electron-test-helpers'
import plugin from '..'

jest.setTimeout(10 * 1000)

interface ServerWithPort extends Server { port: number }

let currentServer: ServerWithPort|null = null

const originalRequest = net.request

describe.skip('plugin: electron net breadcrumbs', () => {
  afterEach(async () => {
    if (currentServer) {
      await new Promise(resolve => { currentServer.close(resolve) })
    }

    net.request = originalRequest
  })

  it.each([
    ['succeeded', 200], ['succeeded', 204], ['succeeded', 300], ['succeeded', 308],
    ['failed', 400], ['failed', 451], ['failed', 500], ['failed', 599]
  ])('leaves a %s breadcrumb for a %d status code', async (successOrFailure, status) => {
    const client = makeClient()

    currentServer = await startServer(status)

    const url = `http://localhost:${currentServer.port}`
    const request = net.request(url)

    await new Promise(resolve => {
      request.on('response', (response) => {
        response.on('data', () => {})
        response.on('end', resolve)
      })

      request.end()
    })

    const expectedMetadata = expect.objectContaining({
      method: 'GET',
      url: `${url}/`,
      status,
      duration: expect.any(Number)
    })

    const expected = new Breadcrumb(
      `net.request ${successOrFailure}`,
      expectedMetadata,
      'request'
    )

    expect(client._breadcrumbs).toHaveLength(1)
    expect(client._breadcrumbs[0]).toMatchBreadcrumb(expected)
  })

  it.each([
    ['succeeded', 201, 'POST'], ['succeeded', 205, 'PUT'], ['succeeded', 301, 'DELETE'], ['succeeded', 309, 'PATCH'],
    ['failed', 401, 'POST'], ['failed', 452, 'PUT'], ['failed', 501, 'DELETE'], ['failed', 598, 'PATCH']
  ])('leaves a %s breadcrumb for a %d status code for %s requests', async (successOrFailure, status, method) => {
    const client = makeClient()

    currentServer = await startServer(status)

    const url = `http://localhost:${currentServer.port}`
    const request = net.request({ url, method })

    await new Promise(resolve => {
      request.on('response', (response) => {
        response.on('data', () => {})
        response.on('end', resolve)
      })

      request.end()
    })

    const expectedMetadata = expect.objectContaining({
      method,
      url,
      status,
      duration: expect.any(Number)
    })

    const expected = new Breadcrumb(
      `net.request ${successOrFailure}`,
      expectedMetadata,
      'request'
    )

    expect(client._breadcrumbs).toHaveLength(1)
    expect(client._breadcrumbs[0]).toMatchBreadcrumb(expected)
  })

  it.each([
    ['succeeded', 202], ['succeeded', 206], ['succeeded', 302], ['succeeded', 310],
    ['failed', 402], ['failed', 453], ['failed', 502], ['failed', 597]
  ])('leaves a %s breadcrumb for a %d status code when URL components are provided separately', async (successOrFailure, status) => {
    const client = makeClient()

    currentServer = await startServer(status)

    const request = net.request({
      protocol: 'http:',
      hostname: 'localhost',
      port: currentServer.port
    })

    await new Promise(resolve => {
      request.on('response', (response) => {
        response.on('data', () => {})
        response.on('end', resolve)
      })

      request.end()
    })

    const expectedMetadata = expect.objectContaining({
      method: 'GET',
      url: `http://localhost:${currentServer.port}/`,
      status,
      duration: expect.any(Number)
    })

    const expected = new Breadcrumb(
      `net.request ${successOrFailure}`,
      expectedMetadata,
      'request'
    )

    expect(client._breadcrumbs).toHaveLength(1)
    expect(client._breadcrumbs[0]).toMatchBreadcrumb(expected)
  })

  it('it leaves a breadcrumb when the request is aborted', async () => {
    const client = makeClient()

    currentServer = await startServer(200)

    const url = `http://localhost:${currentServer.port}`
    const request = net.request(url)

    await new Promise(resolve => {
      request.on('close', resolve)
      request.abort()
    })

    const expectedMetadata = expect.objectContaining({ url: `${url}/`, method: 'GET' })

    const expected = new Breadcrumb(
      'net.request aborted',
      expectedMetadata,
      'request'
    )

    expect(client._breadcrumbs).toHaveLength(1)
    expect(client._breadcrumbs[0]).toMatchBreadcrumb(expected)
  })

  it('it leaves breadcrumbs when enabledBreadcrumbTypes=null', async () => {
    const client = makeClient({ enabledBreadcrumbTypes: null })

    currentServer = await startServer(200)

    const url = `http://localhost:${currentServer.port}`
    const request = net.request(url)

    await new Promise(resolve => {
      request.on('close', resolve)
      request.abort()
    })

    const expectedMetadata = expect.objectContaining({ url: `${url}/`, method: 'GET' })

    const expected = new Breadcrumb(
      'net.request aborted',
      expectedMetadata,
      'request'
    )

    expect(client._breadcrumbs).toHaveLength(1)
    expect(client._breadcrumbs[0]).toMatchBreadcrumb(expected)
  })

  it('it leaves a breadcrumb when the request errors', async () => {
    const client = makeClient()

    currentServer = await startServer(0, (req, res) => {
      req.on('data', () => {})
      req.on('end', () => {
        res.writeHead(302, { Location: '/a/b/c' })
        res.end(STATUS_CODES[302])
      })
    })

    const url = `http://localhost:${currentServer.port}`
    const request = net.request({ url, redirect: 'error' })

    await new Promise(resolve => {
      request.on('error', resolve)
      request.end()
    })

    const expectedMetadata = expect.objectContaining({
      method: 'GET',
      url,
      error: "Attempted to redirect, but redirect policy was 'error'",
      duration: expect.any(Number)
    })

    const expected = new Breadcrumb(
      'net.request error',
      expectedMetadata,
      'request'
    )

    expect(client._breadcrumbs).toHaveLength(1)
    expect(client._breadcrumbs[0]).toMatchBreadcrumb(expected)
  })

  it.each([
    'notify', 'sessions'
  ])('does nothing when the request is to the %s endpoint', async (endpointName) => {
    currentServer = await startServer(200)

    const url = `http://localhost:${currentServer.port}`

    const client = makeClient({
      config: {
        endpoints: {
          notify: 'https://example.com/notify',
          sessions: 'https://example.com/sessions',
          [endpointName]: url
        }
      },
      schema: {
        endpoints: { defaultValue: () => ({}), message: '', validate: () => true }
      }
    })

    const request = net.request(url)

    await new Promise(resolve => {
      request.on('response', (response) => {
        response.on('data', () => {})
        response.on('end', resolve)
      })

      request.end()
    })

    expect(client._breadcrumbs).toHaveLength(0)
  })

  it('does nothing when the request is to the minidumps endpoint', async () => {
    currentServer = await startServer(200)

    const url = `http://localhost:${currentServer.port}`

    const client = makeClient({
      config: {
        endpoints: {
          notify: 'https://example.com/notify',
          sessions: 'https://example.com/sessions',
          minidumps: url
        }
      },
      schema: {
        endpoints: { defaultValue: () => ({}), message: '', validate: () => true }
      }
    })

    const request = net.request(`${url}?api_key=1234567890`)

    await new Promise(resolve => {
      request.on('response', (response) => {
        response.on('data', () => {})
        response.on('end', resolve)
      })

      request.end()
    })

    expect(client._breadcrumbs).toHaveLength(0)
  })

  it('does nothing when request breadcrumbs are disabled', async () => {
    currentServer = await startServer(200)

    const url = `http://localhost:${currentServer.port}`

    const client = makeClient({
      config: {
        enabledBreadcrumbTypes: ['state', 'error', 'log']
      }
    })

    const request = net.request(url)

    await new Promise(resolve => {
      request.on('response', (response) => {
        response.on('data', () => {})
        response.on('end', resolve)
      })

      request.end()
    })

    expect(client._breadcrumbs).toHaveLength(0)
  })

  it('records the duration since request.end for non-chunked requests', async () => {
    const client = makeClient()

    currentServer = await startServer(200)

    const url = `http://localhost:${currentServer.port}`
    const request = net.request({ method: 'POST', url: url })

    request.write('chunk 1')

    await new Promise(resolve => {
      request.on('response', (response) => {
        response.on('data', () => {})
        response.on('end', resolve)
      })

      setTimeout(() => {
        request.end('chunk 2')
      }, 500)
    })

    const expectedMetadata = expect.objectContaining({
      method: 'POST',
      url,
      status: 200,
      duration: expect.any(Number)
    })

    const expected = new Breadcrumb(
      'net.request succeeded',
      expectedMetadata,
      'request'
    )

    expect(client._breadcrumbs).toHaveLength(1)
    expect(client._breadcrumbs[0]).toMatchBreadcrumb(expected)
    expect(client._breadcrumbs[0].metadata.duration).toBeLessThan(500)
  })

  it('records the duration since the first write operation for chunked requests', async () => {
    const client = makeClient()

    currentServer = await startServer(200)
    currentServer.timeout = 1000

    const url = `http://localhost:${currentServer.port}`
    const request = net.request({ method: 'POST', url: url })

    request.chunkedEncoding = true
    request.write('chunk 1')

    await new Promise(resolve => {
      request.on('response', (response) => {
        response.on('data', () => {})
        response.on('end', resolve)
      })

      setTimeout(() => {
        request.write('chunk 2')
      }, 250)

      setTimeout(() => {
        request.end()
      }, 500)
    })

    const expectedMetadata = expect.objectContaining({
      method: 'POST',
      url,
      status: 200,
      duration: expect.any(Number)
    })

    const expected = new Breadcrumb(
      'net.request succeeded',
      expectedMetadata,
      'request'
    )

    expect(client._breadcrumbs).toHaveLength(1)
    expect(client._breadcrumbs[0]).toMatchBreadcrumb(expected)
    expect(client._breadcrumbs[0].metadata.duration).toBeGreaterThanOrEqual(500)
  })
})

function makeClient ({ config = {}, schema = {} } = {}) {
  return makeClientForPlugin({ config, schema, plugins: [plugin(net)] }).client
}

const defaultRequestHandler = (statusCode: number) => (req: IncomingMessage, res: ServerResponse) => {
  req.on('data', () => {})
  req.on('end', () => {
    res.statusCode = statusCode
    res.end(STATUS_CODES[statusCode])
  })
}

async function startServer (statusCode: number, handler = defaultRequestHandler(statusCode)): Promise<ServerWithPort> {
  const server = createServer(handler)
  server.timeout = 5
  server.keepAliveTimeout = 0

  // add a getter for the server port because we need it _everywhere_
  Object.defineProperty(server, 'port', { get: () => (server.address() as AddressInfo).port })

  return new Promise((resolve, reject) => {
    // @ts-expect-error the types for 'listen' don't include this overload
    server.listen(0, 'localhost', err => {
      if (err !== undefined) {
        return reject(err)
      }

      resolve(server as ServerWithPort)
    })
  })
}
