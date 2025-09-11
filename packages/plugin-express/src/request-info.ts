import { extractObject } from '@bugsnag/core'
import type { Request } from 'express'
import type { AddressInfo } from 'net'

export interface RequestInfo {
    url: string
    path: string
    httpMethod: string
    headers: { [key: string]: string }
    httpVersion: string
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

const getFirstHeader = (header: string | string[] | undefined): string | undefined => {
  if (Array.isArray(header)) return header[0]
  return header
}

const isAddressInfo = (info: any): info is AddressInfo => {
  return info && typeof info === 'object' && 'port' in info && 'address' in info && 'family' in info
}

const extractRequestInfo = (req: Request): RequestInfo => {
  const connection = req.socket || req.connection
  const address = connection && connection.address && connection.address()
  const portNumber = isAddressInfo(address) ? address.port : undefined
  const port = (!portNumber || portNumber === 80 || portNumber === 443) ? '' : `:${portNumber}`
  const protocol = typeof req.protocol !== 'undefined' ? req.protocol : (connection && 'encrypted' in connection && connection.encrypted ? 'https' : 'http')
  const hostname = (req.hostname || req.host || req.headers.host || '').replace(/:\d+$/, '')
  const url = `${protocol}://${hostname}${port}${req.url}`

    // Convert headers to the expected format
  const formattedHeaders: { [key: string]: string } = {}
  if (req.headers) {
    Object.keys(req.headers).forEach(key => {
      const value = req.headers[key]
      if (value !== undefined) {
        formattedHeaders[key] = Array.isArray(value) ? value[0] : value
      }
    })
  }

  const request: RequestInfo = {
    url: url,
    path: req.path || req.url,
    httpMethod: req.method,
    headers: formattedHeaders,
    httpVersion: req.httpVersion
  }

  request.params = extractObject(req, 'params')
  request.query = extractObject(req, 'query')
  request.body = extractObject(req, 'body')

  request.clientIp = req.ip || (connection ? connection.remoteAddress : undefined)
  request.referer = getFirstHeader(req.headers.referer) || getFirstHeader(req.headers.referrer)

  if (connection) {
    request.connection = {
      remoteAddress: connection.remoteAddress,
      remotePort: connection.remotePort,
      bytesRead: connection.bytesRead,
      bytesWritten: connection.bytesWritten,
      localPort: portNumber,
      localAddress: isAddressInfo(address) ? address.address : undefined,
      IPVersion: isAddressInfo(address) ? address.family : undefined
    }
  }
  return request
}

export default extractRequestInfo