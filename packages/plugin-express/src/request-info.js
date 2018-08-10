module.exports = req => {
  const connection = req.connection
  const address = connection && connection.address && connection.address()
  const portNumber = address && address.port
  const port = (!portNumber || portNumber === 80 || portNumber === 443) ? '' : `:${portNumber}`
  const url = `${req.protocol}://${req.hostname || req.host}${port}${req.url}`
  const request = {
    url: url,
    path: req.path || req.url,
    httpMethod: req.method,
    headers: req.headers,
    httpVersion: req.httpVersion
  }

  if (req.params && typeof req.params === 'object' && Object.keys(req.params).length > 0) {
    request.params = req.params
  }

  if (req.query && typeof req.query === 'object' && Object.keys(req.query).length > 0) {
    request.query = req.query
  }

  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    request.body = req.body
  }

  if (connection) {
    request.connection = {
      remoteAddress: connection.remoteAddress || req.ip,
      remotePort: connection.remotePort,
      bytesRead: connection.bytesRead,
      bytesWritten: connection.bytesWritten,
      localPort: portNumber,
      localAddress: address ? address.address : void 0,
      IPVersion: address ? address.family : void 0
    }
  }
  return request
}
