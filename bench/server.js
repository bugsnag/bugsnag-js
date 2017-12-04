let i = 0
require('http').createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'content-type')
  res.end('OK')
  console.log(i++)
}).listen(8000)
