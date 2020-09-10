import Client from '@bugsnag/core/client'
import { schema } from '@bugsnag/core/config'
import plugin from '../'
import fs from 'fs'
import Event from '@bugsnag/core/event'

// mock an async resource

const items = ['a', 'b', 'c']

// node-style error-first
function load (index: number, cb: (err: Error | null, res?: string) => void) {
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
      onUncaughtException: (err: Error) => {
        expect(err.message).toBe('no item available')
        done()
      },
      plugins: [plugin]
    }, {
      ...schema,
      onUncaughtException: {
        validate: (val: unknown) => typeof val === 'function',
        message: 'should be a function',
        defaultValue: () => {}
      }
    })
    c._setDelivery(client => ({
      sendEvent: (payload, cb) => {
        expect(payload.events[0].errors[0].errorMessage).toBe('no item available')
        expect(payload.events[0].severity).toBe('warning')
        expect(payload.events[0]._user).toEqual({
          id: '1a2c3cd4',
          name: 'Ben Gourley',
          email: 'ben.gourley@bugsnag.com'
        })
        cb(null)
      },
      sendSession: () => {}
    }))
    const contextualize = c.getPlugin('contextualize')
    contextualize(() => {
      load(8, (err) => {
        if (err) throw err
      })
    }, (event: Event) => {
      event.setUser('1a2c3cd4', 'ben.gourley@bugsnag.com', 'Ben Gourley')
      event.severity = 'warning'
    })
  })

  it('should add a stacktrace when missing', done => {
    const c = new Client({
      apiKey: 'api_key',
      onUncaughtException: () => {
        done()
      },
      plugins: [plugin]
    }, {
      ...schema,
      onUncaughtException: {
        validate: (val: unknown) => typeof val === 'function',
        message: 'should be a function',
        defaultValue: () => {}
      }
    })
    c._setDelivery(client => ({
      sendEvent: (payload, cb) => {
        expect(payload.events[0].errors[0].errorMessage).toBe('ENOENT: no such file or directory, open \'does not exist\'')
        expect(payload.events[0].errors[0].stacktrace[0].file).toBe(`${__filename}`)
        cb(null)
      },
      sendSession: () => {}
    }))
    const contextualize = c.getPlugin('contextualize')
    contextualize(() => {
      fs.createReadStream('does not exist')
    })
  })

  it('should tolerate a failed event', done => {
    const c = new Client({
      apiKey: 'api_key',
      onUncaughtException: (err: Error) => {
        expect(err.message).toBe('no item available')
        done()
      },
      plugins: [plugin]
    }, {
      ...schema,
      onUncaughtException: {
        validate: (val: unknown) => typeof val === 'function',
        message: 'should be a function',
        defaultValue: () => {}
      }
    })
    c._setDelivery(client => ({
      sendEvent: (payload, cb) => {
        cb(new Error('sending failed'))
      },
      sendSession: () => {}
    }))
    const contextualize = c.getPlugin('contextualize')
    contextualize(() => {
      load(8, (err) => {
        if (err) throw err
      })
    })
  })
})
