const { describe, it, expect } = global

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }
const plugin = require('../')
const fs = require('fs')

// mock an async resource

const items = ['a', 'b', 'c']

// node-style error-first
function load (index, cb) {
  process.nextTick(() => {
    const item = items[index]
    if (item) return cb(null, item)
    cb(new Error('no item available'))
  })
}

// promise
function pload (index, cb) {
  return new Promise((resolve, reject) => {
    process.nextTick(() => {
      const item = items[index]
      if (item) return resolve(item)
      reject(new Error('no item available'))
    })
  })
}

describe('plugin: intercept', () => {
  it('does nothing with a happy-case callback', done => {
    const c = new Client({ apiKey: 'api_key' }, undefined, VALID_NOTIFIER)
    c._delivery(client => ({
      sendEvent: () => expect(true).toBe(false),
      sendSession: () => {}
    }))
    c.use(plugin)
    const intercept = c.getPlugin('intercept')
    load(1, intercept((item) => {
      expect(item).toBe('b')
      done()
    }))
  })

  it('reports when the callback recieves an error', done => {
    const c = new Client({ apiKey: 'api_key' }, undefined, VALID_NOTIFIER)
    c._delivery(client => ({
      sendEvent: (report) => {
        expect(report.events[0].errors[0].errorMessage).toBe('no item available')
        done()
      },
      sendSession: () => {}
    }))
    c.use(plugin)
    const intercept = c.getPlugin('intercept')
    load(4, intercept((item) => {
      expect(true).toBe(false)
      done()
    }))
  })

  it('works with resolved promises', done => {
    const c = new Client({ apiKey: 'api_key' }, undefined, VALID_NOTIFIER)
    c._delivery(client => ({
      sendEvent: () => expect(true).toBe(false),
      sendSession: () => {}
    }))
    c.use(plugin)
    const intercept = c.getPlugin('intercept')
    pload(0).then(item => {
      expect(item).toBe('a')
      done()
    }).catch(intercept())
  })

  it('works with rejected promises', done => {
    const c = new Client({ apiKey: 'api_key' }, undefined, VALID_NOTIFIER)
    c._delivery(client => ({
      sendEvent: (report) => {
        expect(report.events[0].errors[0].errorMessage).toBe('no item available')
        done()
      },
      sendSession: () => {}
    }))
    c.use(plugin)
    const intercept = c.getPlugin('intercept')
    pload(7).then(item => {
      expect(true).toBe(false)
      done()
    }).catch(intercept())
  })

  it('should add a stacktrace when missing', done => {
    const c = new Client({ apiKey: 'api_key' }, undefined, VALID_NOTIFIER)
    c._delivery(client => ({
      sendEvent: (report, cb) => {
        expect(report.events[0].errors[0].errorMessage).toBe('ENOENT: no such file or directory, open \'does not exist\'')
        expect(report.events[0].errors[0].stacktrace[0].file).toBe(`${__filename}`)
        cb(null)
        done()
      },
      sendSession: () => {}
    }))
    c.use(plugin)
    const intercept = c.getPlugin('intercept')
    fs.readFile('does not exist', intercept(data => {
      expect(true).toBe(false)
    }))
  })
})
