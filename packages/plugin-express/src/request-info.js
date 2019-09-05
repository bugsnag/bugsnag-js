const extractObject = require('@bugsnag/core/lib/extract-object')

module.exports = req => {
  const connection = req.connection
  const address = connection && connection.address && connection.address()
  const portNumber = address && address.port
  const port = (!portNumber || portNumber === 80 || portNumber === 443) ? '' : `:${portNumber}`
  const protocol = typeof req.protocol !== 'undefined' ? req.protocol : (req.connection.encrypted ? 'https' : 'http')
  const hostname = (req.hostname || req.host || req.headers.host || '').replace(/:\d+$/, '')
  const url = `${protocol}://${hostname}${port}${req.url}`
  const request = {
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
