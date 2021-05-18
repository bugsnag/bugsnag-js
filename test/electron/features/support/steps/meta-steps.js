const { createReadStream } = require('fs')
const { request } = require('http')
const { When } = require('@cucumber/cucumber')
const { fixturePath } = require('../utils')
const FormData = require('form-data')

const sendEvent = (context, done) => {
  const data = JSON.stringify({
    events: [{
      context: context,
      app: { version: '5.6.0' },
      device: { osName: 'beOS', osVersion: '11.0', manufacturer: null },
      metadata: {
        counters: { trees: 3, carrots: 9 }
      },
      exceptions: [{
        errorClass: 'Error',
        stacktrace: []
      }]
    }]
  })

  const options = {
    method: 'POST',
    headers: {
      'Bugsnag-API-Key': '100a2272bd2b0ac0ab0f52715bbdc659',
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
}

const sendMinidump = (done) => {
  const form = new FormData()
  form.append('event', createReadStream(fixturePath('meta-minidump-event.json')))
  form.append('minidump', createReadStream(fixturePath('minidump.dmp')))
  form.submit(process.env.META_MINIDUMP, (err) => done(err))
}

When('I send a sample event', done => { sendEvent('home', done) })

When('I send a sample minidump', sendMinidump)

When('I send a bunch of requests', (done) => {
  sendEvent('shopping cart',
    () => sendEvent('sale',
      () => sendMinidump(() => done())))
})
