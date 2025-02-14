import { Client } from '@bugsnag/core'
import plugin from '../'
import fs from 'fs'

// mock an async resource

const items = ['a', 'b', 'c']

// node-style error-first
function load (index: number, cb: (error: Error | null, result?: string) => void) {
  process.nextTick(() => {
    const item = items[index]
    if (item) return cb(null, item)
    cb(new Error('no item available'))
  })
}

// promise
function pload (index: number) {
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
    const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
    c._setDelivery(client => ({
      sendEvent: () => expect(true).toBe(false),
      sendSession: () => {}
    }))
    const intercept = c.getPlugin('intercept')
    load(1, intercept((item: string) => {
      expect(item).toBe('b')
      done()
    }))
  })

  it('sends an event when the callback recieves an error', done => {
    const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
    c._setDelivery(client => ({
      sendEvent: (payload) => {
        expect(payload.events[0].errors[0].errorMessage).toBe('no item available')
        done()
      },
      sendSession: () => {}
    }))
    const intercept = c.getPlugin('intercept')
    load(4, intercept(() => {
      expect(true).toBe(false)
      done()
    }))
  })

  it('works with resolved promises', done => {
    const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
    c._setDelivery(client => ({
      sendEvent: () => expect(true).toBe(false),
      sendSession: () => {}
    }))
    const intercept = c.getPlugin('intercept')
    pload(0).then(item => {
      expect(item).toBe('a')
      done()
    }).catch(intercept())
  })

  it('works with rejected promises', done => {
    const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
    c._setDelivery(client => ({
      sendEvent: (payload) => {
        expect(payload.events[0].errors[0].errorMessage).toBe('no item available')
        done()
      },
      sendSession: () => {}
    }))
    const intercept = c.getPlugin('intercept')
    pload(7).then(item => {
      expect(true).toBe(false)
      done()
    }).catch(intercept())
  })

  it('should add a stacktrace when missing', done => {
    const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
    c._setDelivery(client => ({
      sendEvent: (payload, cb) => {
        expect(payload.events[0].errors[0].errorMessage).toBe('ENOENT: no such file or directory, open \'does not exist\'')
        expect(payload.events[0].errors[0].stacktrace[0].file).toBe(`${__filename}`)
        cb(null)
        done()
      },
      sendSession: () => {}
    }))
    const intercept = c.getPlugin('intercept')
    fs.readFile('does not exist', intercept(() => {
      expect(true).toBe(false)
    }))
  })
})
