module.exports = c => {
  const request = {
    url: c.req.url,
    body: c.req.parseBody()
  }
  return request
}
