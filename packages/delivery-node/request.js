const http = require('http')
const https = require('https')
// eslint-disable-next-line node/no-deprecated-api
const { parse } = require('url')

module.exports = ({ url, headers, body, agent }, cb) => {
  let didError = false
  const onError = (err) => {
    if (didError) return
    didError = true
    cb(err)
  }

  const parsedUrl = parse(url)
  const secure = parsedUrl.protocol === 'https:'
  const transport = secure ? https : http
  const req = transport.request({
    method: 'POST',
    hostname: parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.path,
    headers,
    agent
  })
  req.on('error', onError)
  req.on('response', res => {
    bufferResponse(res, (err, body) => {
      if (err) return onError(err)
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return onError(new Error(`Bad statusCode from API: ${res.statusCode}\n${body}`))
      }
      cb(null, body)
    })
  })
  req.write(body)
  req.end()
}

const bufferResponse = (stream, cb) => {
  let data = ''
  stream.on('error', cb)
  stream.setEncoding('utf8')
  stream.on('data', d => { data += d })
  stream.on('end', () => cb(null, data))
}
