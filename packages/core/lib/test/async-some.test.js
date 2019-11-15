const { describe, it, expect } = global

const some = require('../async-some')
const runBeforeSend = require('../run-before-send')

describe('async-some', () => {
  describe('reduce(arr, fn, accum)', () => {
    it('works with sync/async/promises', done => {
      const event = { name: 'ben', isIgnored: () => false }
      const beforeSendFns = [
        (event) => { event.age = 10 },
        (event, cb) => { setTimeout(() => cb(null, true), 5) },
        (event) => new Promise((resolve) => {
          event.promiseRan = 'yes'
          resolve()
        })
      ]
      some(beforeSendFns, runBeforeSend(event, () => {}), (err, result) => {
        expect(!err)
        expect(result).toBe(false)
        expect(event.name).toBe('ben')
        expect(event.age).toBe(10)
        expect(event.promiseRan).toBe('yes')
        done()
      })
    })

    it('handles iterator errors', done => {
      some(1, (item, cb) => cb(new Error('derp')), (err, result) => {
        expect(err)
        expect(err.message).toBe('derp')
        done()
      })
    })

    it('handles continues after runBeforeSend errors (throw)', done => {
      const event = { isIgnored: () => false }
      let called = false
      const beforeSendFns = [
        (event) => {},
        (event) => { throw new Error('derp') },
        (event) => { called = true }
      ]
      some(beforeSendFns, runBeforeSend(event, () => {}), (err, result) => {
        expect(!err)
        expect(called).toBe(true)
        done()
      })
    })

    it('handles continues after runBeforeSend errors (promise reject)', done => {
      const event = { isIgnored: () => false }
      let called = false
      const beforeSendFns = [
        (event) => new Promise((resolve) => resolve()),
        (event) => new Promise((resolve, reject) => reject(new Error('derp'))),
        (event) => new Promise((resolve) => {
          called = true
          resolve()
        })
      ]
      some(beforeSendFns, runBeforeSend(event, () => {}), (err, result) => {
        expect(!err)
        expect(called).toBe(true)
        done()
      })
    })

    it('handles continues after runBeforeSend errors (cb(err))', done => {
      const event = { isIgnored: () => false }
      let called = false
      const beforeSendFns = [
        (event, cb) => cb(null),
        (event, cb) => cb(new Error('derp')),
        (event, cb) => {
          called = true
          cb(null)
        }
      ]
      some(beforeSendFns, runBeforeSend(event, () => {}), (err, result) => {
        expect(!err)
        expect(called).toBe(true)
        done()
      })
    })
  })
})
