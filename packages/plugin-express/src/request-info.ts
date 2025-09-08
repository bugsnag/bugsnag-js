import { extractObject } from '@bugsnag/core'

// Express request object interface
interface ExpressRequest {
  url: string
  connection?: {
    address?: () => {
      port: number
      address: string
      family: string
    }
    remoteAddress: string
    remotePort: number
    bytesRead: number
    bytesWritten: number
    encrypted?: boolean
  }
  params?: Record<string, any>
  query?: Record<string, any>
  body?: Record<string, any>
  protocol?: string
  hostname?: string
  host?: string
  headers: Record<string, any>
  path?: string
  method: string
  httpVersion: string
  ip?: string
}

// Extracted request info interface (output)
interface RequestInfo {
  url: string
  path: string
  httpMethod: string
  headers: Record<string, any>
  httpVersion: string
  params?: Record<string, any>
  query?: Record<string, any>
  body?: Record<string, any>
  clientIp?: string
  referer?: string
  connection?: {
    remoteAddress: string
    remotePort: number
    bytesRead: number
    bytesWritten: number
    localPort?: number
    localAddress?: string
    IPVersion?: string
  }
}

const extractRequestInfo = (req: ExpressRequest): RequestInfo => {
  const connection = req.connection
  const address = connection && connection.address && connection.address()
  const portNumber = address && address.port
  const port = (!portNumber || portNumber === 80 || portNumber === 443) ? '' : `:${portNumber}`
  const protocol = typeof req.protocol !== 'undefined' ? req.protocol : (req.connection?.encrypted ? 'https' : 'http')
  const hostname = (req.hostname || req.host || req.headers.host || '').replace(/:\d+$/, '')
  const url = `${protocol}://${hostname}${port}${req.url}`
  const request: RequestInfo = {
    url: url,
    path: req.path || req.url,
    httpMethod: req.method,
    headers: req.headers,
    httpVersion: req.httpVersion
  }

  request.params = extractObject(req, 'params')
  request.query = extractObject(req, 'query')
  request.body = extractObject(req, 'body')

  request.clientIp = req.ip || (connection ? connection.remoteAddress : undefined)
  request.referer = req.headers.referer || req.headers.referrer

  if (connection) {
    request.connection = {
      remoteAddress: connection.remoteAddress,
      remotePort: connection.remotePort,
      bytesRead: connection.bytesRead,
      bytesWritten: connection.bytesWritten,
      localPort: portNumber,
      localAddress: address ? address.address : undefined,
      IPVersion: address ? address.family : undefined
    }
  }
  return request
}

export default extractRequestInfo