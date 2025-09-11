import { extractObject } from '@bugsnag/core'
import type { Request } from 'restify'
import type { AddressInfo } from 'net'

export interface RequestInfo extends Omit<Request, 'path' | 'connection'> {
    path: string
    httpMethod?: string
    clientIp?: string | string[]
    referer?: string | string[]
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

const extractRequestInfo = (req: Request): RequestInfo => {
  const connection = req.socket || req.connection
  const address = connection && connection.address && connection.address()
  const portNumber = isAddressInfo(address) ? address.port : undefined
  const path = req.getPath() || req.url
  const url = req.absoluteUri(path as string)
  const request: Partial<RequestInfo> = {
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
      localAddress: isAddressInfo(address) ? address.address : undefined,
      IPVersion: isAddressInfo(address) ? address.family : undefined,
    }
  }
  return request as RequestInfo
}

export default extractRequestInfo