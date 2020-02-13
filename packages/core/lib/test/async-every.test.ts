import every from '../async-every'

describe('async-every', () => {
  it('handles iterator errors', done => {
    every([1], (item, cb) => cb(new Error('derp')), (err) => {
      expect(err).toBeTruthy()
      expect((err as Error).message).toBe('derp')
      done()
    })
  })

  it('stops when the iterator callback back with `false`', done => {
    let calls = 0
    every([true, true, false, true, true, false], (val, cb) => {
      calls++
      cb(null, val)
    }, (err, result) => {
      expect(err).toBe(null)
      expect(result).toBe(false)
      expect(calls).toBe(3)
      done()
    })
  })

  it('runs the callbacks in series', done => {
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
      done()
    })
  })

  it('runs all the callbacks if none return false', done => {
    let calls = 0
    every([1, 2, 3, 4, 5, 6, 7, 8], (val, cb) => {
      calls++
      cb(null)
    }, (err, result) => {
      expect(err).toBe(null)
      expect(result).toBe(true)
      expect(calls).toBe(8)
      done()
    })
  })
})
