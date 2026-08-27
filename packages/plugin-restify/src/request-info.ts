import { extractObject } from '@bugsnag/core'
import type { AddressInfo } from 'net'
import type { Request } from 'restify'

type HeaderValue = string | string[] | undefined
type HeaderMap = Record<string, HeaderValue>

interface ConnectionInfo {
  remoteAddress?: string
  remotePort?: number
  bytesRead?: number
  bytesWritten?: number
  localPort?: number
  localAddress?: string
  IPVersion?: string
}

export interface RequestInfo {
  url?: string
  path: string
  httpMethod?: string
  clientIp?: string
  referer?: string
  headers?: Record<string, string>
  httpVersion?: string
  params?: unknown
  query?: unknown
  body?: unknown
  connection?: ConnectionInfo
}

export const getFirstHeader = (header: HeaderValue): string | undefined => {
  if (Array.isArray(header)) return header[0]
  return header
}

const isAddressInfo = (info: unknown): info is AddressInfo => {
  if (typeof info !== 'object' || info === null) return false
  const candidate = info as Partial<AddressInfo>
  return (
    typeof candidate.port === 'number' &&
    typeof candidate.address === 'string' &&
    typeof candidate.family === 'string'
  )
}

const extractRequestInfo = (req: Request): RequestInfo => {
  const connection = req.socket ?? req.connection
  const rawAddress = typeof connection?.address === 'function' ? connection.address() : undefined
  const address = isAddressInfo(rawAddress) ? rawAddress : undefined

  const path = req.getPath() ?? req.url ?? ''
  const url = req.absoluteUri(path)

  const headers = (req.headers ?? {}) as HeaderMap
  const formattedHeaders: Record<string, string> = {}

  for (const key of Object.keys(headers)) {
    const first = getFirstHeader(headers[key])
    if (typeof first === 'string') {
      formattedHeaders[key] = first
    }
  }

  const request: RequestInfo = {
    url,
    path,
    httpMethod: req.method,
    headers: formattedHeaders,
    httpVersion: req.httpVersion,
    params: extractObject(req, 'params'),
    query: extractObject(req, 'query'),
    body: extractObject(req, 'body'),
    clientIp: getFirstHeader(headers['x-forwarded-for']) ?? connection?.remoteAddress,
    referer: getFirstHeader(headers.referer) ?? getFirstHeader(headers.referrer)
  }

  if (connection) {
    request.connection = {
      remoteAddress: connection.remoteAddress,
      remotePort: connection.remotePort,
      bytesRead: connection.bytesRead,
      bytesWritten: connection.bytesWritten,
      localPort: address?.port,
      localAddress: address?.address,
      IPVersion: address?.family
    }
  }

  return request
}

export default extractRequestInfo