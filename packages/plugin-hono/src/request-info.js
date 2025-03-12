module.exports = c => {
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
  return request
}
