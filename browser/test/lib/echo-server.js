const http = require('http')

console.log(`[ECHO SERVER] starting up`)
http.createServer((req, res) => {
  console.log(`[ECHO SERVER] ${req.method} ${req.url}`)
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Headers', 'content-type, bugsnag-api-key, bugsnag-sent-at, bugsnag-payload-version')
    return res.end()
  }
  let body = ''
  req.on('data', d => { body += d })
  req.on('end', () => res.end(body))
  req.on('error', e => console.error(e))
}).listen(55854)
