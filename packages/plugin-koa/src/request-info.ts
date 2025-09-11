import type { IncomingMessage } from 'http'
import type { Context } from 'koa'
import type { AddressInfo } from 'net'

interface KoaRequest extends Context {
  request: Context['request'] & {
    body?: any
  }
  req: IncomingMessage
}

interface RequestInfo {
    url?: string
    path?: string
    httpMethod?: string
    headers?: Record<string, any>
    httpVersion?: string
    query?: Record<string, any>
    body?: Record<string, any>
    referer?: string
    clientIp?: string
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

const isAddressInfo = (info: any): info is AddressInfo => {
  return info && typeof info === 'object' && 'port' in info && 'address' in info && 'family' in info
}

const extractRequestInfo = (ctx?: KoaRequest): RequestInfo => {
  if (!ctx) return {}
  const request = ctx.req
  const connection = request.socket || request.connection
  const address = connection && connection.address && connection.address()
  const portNumber = isAddressInfo(address) ? address.port : undefined
  const url = `${ctx.request.href}`
  
  // Helper to get first value from header (handles string | string[] | undefined)
  const getFirstHeader = (header: string | string[] | undefined): string | undefined => {
    if (Array.isArray(header)) return header[0]
    return header
  }
  
  return {
    url,
    path: request.url,
    httpMethod: request.method,
    headers: request.headers,
    httpVersion: request.httpVersion,
    query: ctx.request.query,
    body: ctx.request.body,
    referer: getFirstHeader(request.headers.referer) || getFirstHeader(request.headers.referrer),
    clientIp: ctx.ip || (request.socket ? request.socket.remoteAddress : undefined),
    connection: request.socket ? {
      remoteAddress: request.socket.remoteAddress,
      remotePort: request.socket.remotePort,
      bytesRead: request.socket.bytesRead,
      bytesWritten: request.socket.bytesWritten,
      localPort: portNumber,
      localAddress: isAddressInfo(address) ? address.address : undefined,
      IPVersion: isAddressInfo(address) ? address.family : undefined
    } : undefined
  }
}

export default extractRequestInfo