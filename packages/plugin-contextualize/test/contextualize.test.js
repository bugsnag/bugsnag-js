const { describe, it, expect } = global

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }
const schema = require('@bugsnag/core/config').schema
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

describe('plugin: contextualize', () => {
  it('should call the onUnhandledException callback when an error is captured', done => {
    const c = new Client({
      apiKey: 'api_key',
      onUncaughtException: (err) => {
        expect(err.message).toBe('no item available')
        done()
      }
    }, {
      ...schema,
      onUncaughtException: {
        validate: val => typeof val === 'function',
        message: 'should be a function',
        defaultValue: () => {}
      }
    }, VALID_NOTIFIER)
    c._delivery(client => ({
      sendEvent: (report, cb) => {
        expect(report.events[0].errors[0].errorMessage).toBe('no item available')
        expect(report.events[0].severity).toBe('warning')
        expect(report.events[0]._user).toEqual({
          id: '1a2c3cd4',
          name: 'Ben Gourley',
          email: 'ben.gourley@bugsnag.com'
        })
        cb(null)
      },
      sendSession: () => {}
    }))
    c.use(plugin)
    const contextualize = c.getPlugin('contextualize')
    contextualize(() => {
      load(8, (err) => {
        if (err) throw err
      })
    }, event => {
      event.setUser('1a2c3cd4', 'ben.gourley@bugsnag.com', 'Ben Gourley')
      event.severity = 'warning'
    })
  })

  it('should add a stacktrace when missing', done => {
    const c = new Client({
      apiKey: 'api_key',
      onUncaughtException: () => {
        done()
      }
    }, {
      ...schema,
      onUncaughtException: {
        validate: val => typeof val === 'function',
        message: 'should be a function',
        defaultValue: () => {}
      }
    }, VALID_NOTIFIER)
    c._delivery(client => ({
      sendEvent: (report, cb) => {
        expect(report.events[0].errors[0].errorMessage).toBe('ENOENT: no such file or directory, open \'does not exist\'')
        expect(report.events[0].errors[0].stacktrace[0].file).toBe(`${__filename}`)
        cb(null)
      },
      sendSession: () => {}
    }))
    c.use(plugin)
    const contextualize = c.getPlugin('contextualize')
    contextualize(() => {
      fs.createReadStream('does not exist')
    })
  })

  it('should tolerate a failed report', done => {
    const c = new Client({
      apiKey: 'api_key',
      onUncaughtException: (err) => {
        expect(err.message).toBe('no item available')
        done()
      }
    }, {
      ...schema,
      onUncaughtException: {
        validate: val => typeof val === 'function',
        message: 'should be a function',
        defaultValue: () => {}
      }
    }, VALID_NOTIFIER)
    c._delivery(client => ({
      sendEvent: (report, cb) => {
        cb(new Error('sending failed'))
      },
      sendSession: () => {}
    }))
    c.use(plugin)
    const contextualize = c.getPlugin('contextualize')
    contextualize(() => {
      load(8, (err) => {
        if (err) throw err
      })
    })
  })
})
