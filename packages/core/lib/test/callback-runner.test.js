const { describe, it, expect } = global

const runCallbacks = require('../callback-runner')

describe('runCallbacks()', () => {
  it('works with sync/async/promises', () => {
    return new Promise(resolve => {
      const event = { name: 'ben' }
      const callbacks = [
        (event) => { event.age = 10 },
        (event, cb) => { setTimeout(() => cb(null, true), 5) },
        (event) => new Promise((resolve) => {
          event.promiseRan = 'yes'
          resolve()
        })
      ]
      runCallbacks(callbacks, event, () => {}, (err, result) => {
        expect(err).toBeFalsy()
        expect(result).toBe(true)
        expect(event.name).toBe('ben')
        expect(event.age).toBe(10)
        expect(event.promiseRan).toBe('yes')
        resolve()
      })
    })
  })
  it('continues after errors (throw)', () => {
    return new Promise(resolve => {
      const event = {}
      let called = false
      const callbacks = [
        (event) => {},
        (event) => { throw new Error('derp') },
        (event) => { called = true }
      ]
      runCallbacks(callbacks, event, () => {}, (err, result) => {
        expect(err).toBeFalsy()
        expect(called).toBe(true)
        resolve()
      })
    })
  })

  it('continues after errors (promise reject)', () => {
    return new Promise(resolve => {
      const event = {}
      let called = false
      const callbacks = [
        (event) => new Promise((resolve) => resolve()),
        (event) => new Promise((resolve, reject) => reject(new Error('derp'))),
        (event) => new Promise((resolve) => {
          called = true
          resolve()
        })
      ]
      runCallbacks(callbacks, event, () => {}, (err, result) => {
        expect(err).toBeFalsy()
        expect(called).toBe(true)
        resolve()
      })
    })
  })

  it('continues after errors (cb(err))', () => {
    return new Promise(resolve => {
      const event = {}
      let called = false
      const callbacks = [
        (event, cb) => cb(null),
        (event, cb) => cb(new Error('derp')),
        (event, cb) => {
          called = true
          cb(null)
        }
      ]
      runCallbacks(callbacks, event, () => {}, (err, result) => {
        expect(err).toBeFalsy()
        expect(called).toBe(true)
        resolve()
      })
    })
  })

  it('skips non-functions', () => {
    return new Promise(resolve => {
      const event = {}
      let called = false
      const callbacks = [
        (event, cb) => cb(null),
        null,
        (event, cb) => {
          called = true
          cb(null)
        }
      ]
      runCallbacks(callbacks, event, () => {}, (err, result) => {
        expect(err).toBeFalsy()
        expect(called).toBe(true)
        resolve()
      })
    })
  })
})
