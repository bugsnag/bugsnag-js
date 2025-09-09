import type { Context } from 'koa'
import type { AddressInfo } from 'net'
import type { IncomingMessage } from 'http'

interface KoaRequest extends Context {
  request: Context['request'] & {
    body?: any
  }
  req: IncomingMessage
}

// interface KoaRequest {
//   url?: string
//   connection?: {
//     remoteAddress?: string
//     remotePort?: number
//     bytesRead?: number
//     bytesWritten?: number
//     localPort?: number
//     localAddress?: string
//     IPVersion?: string
//     address?: () => {
//       port?: number
//       address?: string
//       family?: string
//     }
//   }
//   method: string
//   headers: Record<string, string | undefined>
//   httpVersion?: string
//   params?: Record<string, any>
//   query?: Record<string, any>
//   body?: Record<string, any>
//   request: any
//   ip?: string
// }

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

const extractRequestInfo = (ctx?: KoaRequest): RequestInfo => {
  if (!ctx) return {}
  const request = ctx.req
  const connection = request.connection
  const address = connection && connection.address && connection.address()
  const addressInfo = address && typeof address === 'object' ? address as AddressInfo : null
  const portNumber = addressInfo?.port
  const url = `${ctx.request.href}`
  return {
    url,
    path: request.url,
    httpMethod: request.method,
    headers: request.headers,
    httpVersion: request.httpVersion,
    query: ctx.request.query,
    body: ctx.request.body,
    referer: Array.isArray(request.headers.referer) 
      ? request.headers.referer[0] 
      : (request.headers.referer || (request.headers.referrer && Array.isArray(request.headers.referrer)
        ? request.headers.referrer[0]
        : request.headers.referrer)),
    clientIp: ctx.ip || (request.connection ? request.connection.remoteAddress : undefined),
    connection: request.connection ? {
      remoteAddress: request.connection.remoteAddress,
      remotePort: request.connection.remotePort,
      bytesRead: request.connection.bytesRead,
      bytesWritten: request.connection.bytesWritten,
      localPort: portNumber,
      localAddress: addressInfo?.address,
      IPVersion: addressInfo?.family
    } : undefined
  }
}

export default extractRequestInfo