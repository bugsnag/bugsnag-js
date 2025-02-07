module.exports = c => {
  const request = {
    url: c.req.url,
    body: c.req.parseBody,
    httpMethod: c.req.method,
    headers: c.req.header,
    params: c.req.param,
    query: c.req.query,
    path: c.req.path,
    routePath: c.req.routePath
  }
  return request
}
