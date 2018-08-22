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
      localAddress: address ? address.address : void 0,
      IPVersion: address ? address.family : void 0
    }
  }
  return request
}

const extractObject = (host, key) => {
  if (host[key] && typeof host[key] === 'object' && Object.keys(host[key]).length > 0) {
    return host[key]
  } else {
    return undefined
  }
}
