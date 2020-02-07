import runCallbacks from '../callback-runner'
import { NodeCallbackType } from '../async-every'

interface TestEvent {
  name: string
  age?: number
  promiseRan?: string
}

type Callback<T> = (event: T, cb: NodeCallbackType<boolean>) => void;

describe('runCallbacks()', () => {
  it('works with sync/async/promises', done => {
    const event: TestEvent = { name: 'ben' }
    const callbacks: Array<Callback<TestEvent>> = [
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
      done()
    })
  })
  it('continues after errors (throw)', done => {
    const event = {}
    let called = false
    const callbacks: Array<Callback<{}>> = [
      (event) => {},
      (event) => { throw new Error('derp') },
      (event) => { called = true }
    ]
    runCallbacks(callbacks, event, () => {}, (err, result) => {
      expect(err).toBeFalsy()
      expect(called).toBe(true)
      done()
    })
  })

  it('continues after errors (promise reject)', done => {
    const event = {}
    let called = false
    const callbacks: Array<Callback<{}>> = [
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
      done()
    })
  })

  it('continues after errors (cb(err))', done => {
    const event = {}
    let called = false
    const callbacks: Array<Callback<{}>> = [
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
      done()
    })
  })

  it('skips non-functions', done => {
    const event = {}
    let called = false
    const callbacks: Array<Callback<{}> | null> = [
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
      done()
    })
  })
})
