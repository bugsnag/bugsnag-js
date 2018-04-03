const http = require('http')
const { parse } = require('url')

console.log(`[ECHO SERVER] starting up`)
http.createServer((req, res) => {
  console.log(`[ECHO SERVER] ${req.method} ${req.url}`)
  // append ?nocors to the request url to prevent CORS headers from being set
  if (!('nocors' in parse(req.url, true).query)) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Headers', 'content-type, bugsnag-api-key, bugsnag-sent-at, bugsnag-payload-version')
      return res.end()
    }
  }
  let body = ''
  req.on('data', d => { body += d })
  req.on('end', () => res.end(body))
  req.on('error', e => console.error(e))
}).listen(55854)
