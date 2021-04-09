import { net } from 'electron'
import { AddressInfo } from 'net'
import { createServer, STATUS_CODES, Server } from 'http'
import { makeClientForPlugin } from '@bugsnag/electron-test-helpers'
import plugin from '..'

interface ServerWithPort extends Server { port: number }

let currentServer: ServerWithPort|null = null

const originalRequest = net.request

describe('plugin: electron net breadcrumbs', () => {
  afterEach(() => {
    currentServer?.close()
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

    expect(client._breadcrumbs).toHaveLength(1)

    const breadcrumb = client._breadcrumbs[0]
    expect(breadcrumb.type).toBe('request')
    expect(breadcrumb.message).toBe(`net.request ${successOrFailure}`)
    expect(breadcrumb.metadata).toEqual({ request: `GET ${url}/`, status })
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

    expect(client._breadcrumbs).toHaveLength(1)

    const breadcrumb = client._breadcrumbs[0]
    expect(breadcrumb.type).toBe('request')
    expect(breadcrumb.message).toBe(`net.request ${successOrFailure}`)
    expect(breadcrumb.metadata).toEqual({ request: `${method} ${url}`, status })
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

    expect(client._breadcrumbs).toHaveLength(1)

    const breadcrumb = client._breadcrumbs[0]
    expect(breadcrumb.type).toBe('request')
    expect(breadcrumb.message).toBe(`net.request ${successOrFailure}`)
    expect(breadcrumb.metadata).toEqual({ request: `GET http://localhost:${currentServer.port}/`, status })
  })

  it('it leaves an error breadcrumb when the request is aborted', async () => {
    const client = makeClient()

    currentServer = await startServer(200)

    const url = `http://localhost:${currentServer.port}`
    const request = net.request(url)

    await new Promise(resolve => {
      request.on('close', resolve)
      request.abort()
    })

    expect(client._breadcrumbs).toHaveLength(1)

    const breadcrumb = client._breadcrumbs[0]
    expect(breadcrumb.type).toBe('request')
    expect(breadcrumb.message).toBe('net.request error')
    expect(breadcrumb.metadata).toEqual({ request: `GET ${url}/` })
  })

  it.each([
    'notify', 'sessions', 'minidump'
  ])('does nothing when the request is to the %s endpoint', async (endpointName) => {
    currentServer = await startServer(200)

    const url = `http://localhost:${currentServer.port}`

    const client = makeClient({
      config: {
        endpoints: {
          notify: 'https://example.com/notify',
          sessions: 'https://example.com/sessions',
          minidumps: 'https://example.com/minidumps',
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
})

function makeClient ({ config = {}, schema = {} } = {}) {
  return makeClientForPlugin({ config, schema, plugin: plugin(net) }).client
}

async function startServer (statusCode): Promise<ServerWithPort> {
  const server = createServer((req, res) => {
    req.on('data', () => {})
    req.on('end', () => {
      res.statusCode = statusCode
      res.end(STATUS_CODES[statusCode])
    })
  })

  // add a getter for the server port because we need it _everywhere_
  Object.defineProperty(server, 'port', { get: () => (server.address() as AddressInfo).port })

  return await new Promise((resolve, reject) => {
    // @ts-expect-error the types for 'listen' don't include this overload
    server.listen(0, 'localhost', err => {
      if (err !== undefined) {
        return reject(err)
      }

      resolve(server as ServerWithPort)
    })
  })
}
