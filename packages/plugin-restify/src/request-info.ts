import { extractObject } from '@bugsnag/core'

export interface RestifyRequest {
  url?: string
  connection?: {
    remoteAddress?: string
    remotePort?: number
    bytesRead?: number
    bytesWritten?: number
    localPort?: number
    localAddress?: string
    IPVersion?: string
    address?: () => {
      port?: number
      address?: string
      family?: string
    }
  }
  method: string
  headers: Record<string, string | undefined>
  httpVersion?: string
  getPath(): string
  absoluteUri(path: string): string
  params?: Record<string, any>
  query?: Record<string, any>
  body?: Record<string, any>
}

export interface RequestInfo {
    url: string
    path: string
    httpMethod: string
    headers: Record<string, string | undefined>
    httpVersion?: string
    params?: Record<string, any>
    query?: Record<string, any>
    body?: Record<string, any>
    clientIp?: string
    referer?: string
    connection?: {
      remoteAddress?: string
      remotePort?: number
      bytesRead?: number
      bytesWritten?: number
      localPort?: number
      localAddress?: string
      IPVersion?: string
    }
}

const extractRequestInfo = (req: RestifyRequest): RequestInfo => {
  const connection = req.connection
  const address = connection && connection.address && connection.address()
  const portNumber = address && address.port
  const path = req.getPath() || req.url
  const url = req.absoluteUri(path as string)
  const request: RequestInfo = {
    url: url,
    path: path as string,
    httpMethod: req.method,
    headers: req.headers,
    httpVersion: req.httpVersion
  }

  request.params = extractObject(req, 'params')
  request.query = extractObject(req, 'query')
  request.body = extractObject(req, 'body')

  request.clientIp = req.headers['x-forwarded-for'] || (connection ? connection.remoteAddress : undefined)
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