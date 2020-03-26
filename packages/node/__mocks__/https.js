/* global jest */

const { Readable, Writable } = require('stream')
const https = jest.genMockFromModule('https')

const requests = []

https.request = (opts) => {
  const req = new Writable({
    write: body => {
      requests.push({ opts, body: JSON.parse(body) })
    }
  })
  process.nextTick(() => {
    req.emit('response', new Readable({ read: function () { this.push(null) } }))
  })
  return req
}

module.exports = https
module.exports._requests = requests
module.exports._clear = () => { while (requests.length) requests.pop() }
