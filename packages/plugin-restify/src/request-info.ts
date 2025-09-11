import { extractObject } from '@bugsnag/core'
import type { AddressInfo } from 'net'
import type { Request } from 'restify'

export interface RequestInfo extends Omit<Request, 'path' | 'connection' | 'headers'> {
    path: string
    httpMethod?: string
    clientIp?: string
    referer?: string
    headers?: { [key: string]: string }
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

export const getFirstHeader = (header: string | string[] | undefined): string | undefined => {
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
  const path = req.getPath() || req.url
  const url = req.absoluteUri(path as string)

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

  const request: Partial<RequestInfo> = {
    url: url,
    path: path as string,
    httpMethod: req.method,
    headers: formattedHeaders,
    httpVersion: req.httpVersion
  }

  request.params = extractObject(req, 'params')
  request.query = extractObject(req, 'query')
  request.body = extractObject(req, 'body')

  request.clientIp = getFirstHeader(req.headers['x-forwarded-for']) || (connection ? connection.remoteAddress : undefined)
  request.referer = getFirstHeader(req.headers.referer) || getFirstHeader(req.headers.referrer)

  if (connection) {
    request.connection = {
      remoteAddress: connection.remoteAddress,
      remotePort: connection.remotePort,
      bytesRead: connection.bytesRead,
      bytesWritten: connection.bytesWritten,
      localPort: portNumber,
      localAddress: isAddressInfo(address) ? address.address : undefined,
      IPVersion: isAddressInfo(address) ? address.family : undefined,
    }
  }
  return request as RequestInfo
}

export default extractRequestInfo