module.exports = c => {
  const rawRequest = c.req.raw
  const request = {
    url: c.req.url,
    body: c.req.parseBody(),
    httpMethod: c.req.method,
    headers: c.req.header(),
    params: c.req.param(),
    query: c.req.query(),
    referrer: rawRequest.referrer

  }
  return request
}
