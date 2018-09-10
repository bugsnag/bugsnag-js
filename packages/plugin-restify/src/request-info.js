const extractObject = require('@bugsnag/core/lib/extract-object')

module.exports = req => {
  const connection = req.connection
  const address = connection && connection.address && connection.address()
  const portNumber = address && address.port
  const path = req.getPath() || req.url
  const url = req.absoluteUri(path)
  const request = {
    url: url,
    path,
    httpMethod: req.method,
    headers: req.headers,
    httpVersion: req.httpVersion
  }

  request.params = extractObject(req, 'params')
  request.query = extractObject(req, 'query')
  request.body = extractObject(req, 'body')

  if (connection) {
    request.connection = {
      remoteAddress: connection.remoteAddress || req.ip,
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
