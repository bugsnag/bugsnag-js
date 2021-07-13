const http = require('http')
const formidable = require('formidable')
const { readFile, open } = require('fs').promises
const { basename, join } = require('path')
const { promisify } = require('util')

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
    this.stopServer = promisify(this.server.close.bind(this.server))
    this.startServer = promisify(this.server.listen.bind(this.server))
  }

  async uploadMinidump (req, res) {
    const form = formidable()
    form.parse(req, (_err, fields, files) => {
      const boundary = this.readBoundary(req.headers['content-type'])
      this.minidumpUploads.push({ headers: req.headers, boundary, fields, files })
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

  async start () {
    await this.startServer(this.port)
  }

  uploadsForType (type) {
    switch (type) {
      case 'event':
      case 'events':
        return this.eventUploads

      case 'session':
      case 'sessions':
        return this.sessionUploads

      case 'minidump':
      case 'minidumps':
        return this.minidumpUploads

      default:
        throw new Error(`Unknown upload type '${type}'`)
    }
  }

  clear () {
    this.minidumpUploads = []
    this.eventUploads = []
    this.sessionUploads = []
  }

  async stop () {
    // silence potential failures due to double stops
    const stopping = this.stopServer().catch(() => {})
    // terminate open connections immediately
    setImmediate(() => this.server.emit('close'))
    return stopping
  }

  // write all requests to disk for later inspection
  // useful on scenario failure
  async writeUploadsTo (directory) {
    for (let i = 0; i < this.sessionUploads.length; i++) {
      const upload = this.sessionUploads[i]
      const handle = await open(join(directory, `session-${i}.log`), 'w+')
      await this.writeHeaders(handle, upload, '/sessions')
      await handle.write(upload.body)
      await handle.close()
    }
    for (let i = 0; i < this.eventUploads.length; i++) {
      const upload = this.eventUploads[i]
      const handle = await open(join(directory, `event-${i}.log`), 'w+')
      await this.writeHeaders(handle, upload, '/events')
      await handle.write(upload.body)
      await handle.close()
    }
    for (let i = 0; i < this.minidumpUploads.length; i++) {
      const upload = this.minidumpUploads[i]
      const handle = await open(join(directory, `minidump-${i}.log`), 'w+')
      await this.writeHeaders(handle, upload, '/minidumps')
      for (const field in upload.fields) {
        await handle.write(`${upload.boundary}\nContent-Disposition: form-data; name="${field}"\n\n${upload.fields[field]}`)
      }
      for (const file in upload.files) {
        const filepath = upload.files[file].path
        await handle.write(`${upload.boundary}\nContent-Disposition: form-data; name="${file}"; filename="${basename(filepath)}"\n\n`)
        await handle.write(await readFile(filepath))
      }
      await handle.write(`${upload.boundary}\n`)
      await handle.close()
    }
  }

  async writeHeaders (handle, upload, url) {
    await handle.write(`POST ${url} HTTP/1.1\n`)
    for (const header in upload.headers) {
      await handle.write(`${header}: ${upload.headers[header]}\n`)
    }
    await handle.write('\n')
  }

  readBoundary (contentType) {
    if (!contentType) {
      return null
    }
    const marker = 'boundary='
    for (const component of contentType.split(';')) {
      if (component.indexOf(marker) >= 0) {
        return component.split(marker)[1]
      }
    }
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
    // trim the query-string off, if there is one
    const reqPath = req.url.indexOf('?') !== -1 ? req.url.substring(0, req.url.indexOf('?')) : req.url
    const resource = this.resources.find(r => r.path === reqPath)
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
