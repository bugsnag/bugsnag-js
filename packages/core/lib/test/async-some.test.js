const { describe, it, expect } = global

const some = require('../async-some')
const createCallbackRunner = require('../async-callback-runner')

describe('async-some', () => {
  describe('reduce(arr, fn, accum)', () => {
    it('works with sync/async/promises', done => {
      const report = { name: 'ben', isIgnored: () => false }
      const beforeSendFns = [
        (report) => { report.age = 10 },
        (report, cb) => { setTimeout(() => cb(null, true), 5) },
        (report) => new Promise((resolve) => {
          report.promiseRan = 'yes'
          resolve()
        })
      ]
      some(beforeSendFns, createCallbackRunner(report, () => {}), (err, result) => {
        expect(!err)
        expect(result).toBe(false)
        expect(report.name).toBe('ben')
        expect(report.age).toBe(10)
        expect(report.promiseRan).toBe('yes')
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

    it('handles continues after createCallbackRunner errors (throw)', done => {
      const report = { isIgnored: () => false }
      let called = false
      const beforeSendFns = [
        (report) => {},
        (report) => { throw new Error('derp') },
        (report) => { called = true }
      ]
      some(beforeSendFns, createCallbackRunner(report, () => {}), (err, result) => {
        expect(!err)
        expect(called).toBe(true)
        done()
      })
    })

    it('handles continues after createCallbackRunner errors (promise reject)', done => {
      const report = { isIgnored: () => false }
      let called = false
      const beforeSendFns = [
        (report) => new Promise((resolve) => resolve()),
        (report) => new Promise((resolve, reject) => reject(new Error('derp'))),
        (report) => new Promise((resolve) => {
          called = true
          resolve()
        })
      ]
      some(beforeSendFns, createCallbackRunner(report, () => {}), (err, result) => {
        expect(!err)
        expect(called).toBe(true)
        done()
      })
    })

    it('handles continues after createCallbackRunner errors (cb(err))', done => {
      const report = { isIgnored: () => false }
      let called = false
      const beforeSendFns = [
        (report, cb) => cb(null),
        (report, cb) => cb(new Error('derp')),
        (report, cb) => {
          called = true
          cb(null)
        }
      ]
      some(beforeSendFns, createCallbackRunner(report, () => {}), (err, result) => {
        expect(!err)
        expect(called).toBe(true)
        done()
      })
    })
  })
})
