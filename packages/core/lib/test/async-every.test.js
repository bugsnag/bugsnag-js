const { describe, it, expect } = global

const every = require('../async-every')

describe('async-every', () => {
  it('handles iterator errors', () => {
    return new Promise(resolve => {
      every([1], (item, cb) => cb(new Error('derp')), (err, result) => {
        expect(err).toBeTruthy()
        expect(err.message).toBe('derp')
        resolve()
      })
    })
  })

  it('stops when the iterator callback back with `false`', () => {
    return new Promise(resolve => {
      let calls = 0
      every([true, true, false, true, true, false], (val, cb) => {
        calls++
        cb(null, val)
      }, (err, result) => {
        expect(err).toBe(null)
        expect(result).toBe(false)
        expect(calls).toBe(3)
        resolve()
      })
    })
  })

  it('runs the callbacks in series', () => {
    return new Promise(resolve => {
      let inFlight = 0
      every([1, 2, 3, 4, 5, 6, 7, 8], (val, cb) => {
        inFlight++
        setTimeout(() => {
          expect(inFlight).toBe(1)
          inFlight--
          cb(null)
        }, 10)
      }, (err, result) => {
        expect(err).toBe(null)
        expect(result).toBe(true)
        resolve()
      })
    })
  })

  it('runs all the callbacks if none return false', () => {
    return new Promise(resolve => {
      let calls = 0
      every([1, 2, 3, 4, 5, 6, 7, 8], (val, cb) => {
        calls++
        cb(null)
      }, (err, result) => {
        expect(err).toBe(null)
        expect(result).toBe(true)
        expect(calls).toBe(8)
        resolve()
      })
    })
  })
})
