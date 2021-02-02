const { createReadStream } = require('fs')
const { request } = require('http')
const { When } = require('@cucumber/cucumber')
const { fixturePath } = require('../utils')
const FormData = require('form-data')

When('I send a sample event', (done) => {
  const data = JSON.stringify({
    app: { version: '5.6.0' },
    device: { osName: 'beOS', osVersion: '11.0' },
    metadata: {
      counters: { trees: 3, carrots: 9 }
    }
  })

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }

  const req = request(process.env.META_NOTIFY, options, (res) => {
    res.on('error', (err) => done(err))
    res.on('end', () => done())
    res.resume()
  })

  req.write(data)
  req.end()
})

When('I send a sample minidump', (done) => {
  const form = new FormData()
  form.append('event', createReadStream(fixturePath('meta-minidump-event.json')))
  form.append('minidump', createReadStream(fixturePath('minidump.dmp')))
  form.submit(process.env.META_MINIDUMP, (err) => done(err))
})
