const http = require('http')

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Headers', 'content-type')
    return res.end()
  }
  let body = ''
  console.log(`[ECHO SERVER] ${req.method} ${req.url}`)
  req.on('data', d => { body += d })
  req.on('end', (d) => res.end(body))
}).listen(55854)
