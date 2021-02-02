const http = require('http')
const formidable = require('formidable')
const { unlinkSync } = require('fs')

class MockServer {
  constructor () {
    this.eventUploads = []
    this.sessionUploads = []
    this.minidumpUploads = []

    const router = new Router()
    router.register('/minidumps', 'POST', this.uploadMinidump.bind(this))
    router.register('/events', 'POST', this.sendEvent.bind(this))
    router.register('/sessions', 'POST', this.sendSession.bind(this))

    this.server = http.createServer(router.dispatch.bind(router))
    this.router = router
    // random number between 8000-9999
    this.port = Math.floor(Math.random() * 1999 + 8000)
  }

  async uploadMinidump (req, res) {
    const form = formidable()
    form.parse(req, (_err, fields, files) => {
      this.minidumpUploads.push({ headers: req.headers, fields, files })
      res.writeHead(202)
      res.end()
    })
  }

  async sendEvent (req, res) {
    res.writeHead(202)
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      this.eventUploads.push({ headers: req.headers, body })
      res.end()
    })
  }

  async sendSession (req, res) {
    res.writeHead(202)
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      this.sessionUploads.push({ headers: req.headers, body })
      res.end()
    })
  }

  start () {
    this.server.listen(this.port)
  }

  clear () {
    this.minidumpUploads = []
    this.eventUploads = []
    this.sessionUploads = []
  }

  async stop () {
    this.minidumpUploads.forEach((upload) => {
      unlinkSync(upload.files.minidump.path)
      unlinkSync(upload.files.event.path)
    })
    return new Promise((resolve, reject) => {
      this.server.close((err) => err ? reject(err) : resolve())
    })
  }
}

class Router {
  constructor () {
    this.resources = []
  }

  register (path, method, handle) {
    this.resources.push({ path, method, handle })
  }

  async dispatch (req, res) {
    const resource = this.resources.find(r => r.path === req.url)
    if (resource) {
      if (resource.method === req.method) {
        await resource.handle(req, res)
      } else {
        res.writeHead(405)
        res.end()
      }
    } else {
      res.writeHead(404)
      res.end()
    }
  }
}

module.exports = { MockServer }
