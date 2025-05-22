const extractConnectionInfo = require('./load-connection-info')

module.exports = async c => {
  const request = {
    url: c.req.url,
    body: c.req.parseBody(),
    httpMethod: c.req.method,
    httpVersion: c.env.outgoing?.req.httpVersion,
    headers: c.req.header(),
    params: c.req.param(),
    query: c.req.query(),
    path: c.req.path,
    routePath: c.req.routePath
  }
  const connection = await extractConnectionInfo(c)
  if (connection) {
    request.connection = {
      remoteAddress: connection.remote.address,
      IPVersion: connection.remote.addressType,
      remotePort: connection.remote.port
    }
    request.clientIp = connection.remote.address
  }
  return request
}
