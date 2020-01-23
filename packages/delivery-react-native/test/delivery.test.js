/* global describe, it, expect */

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }
const delivery = require('../')

describe('delivery: react native', () => {
  it('sends using the native dispatch() method', done => {
    const NativeClient = {
      dispatch: () => new Promise((resolve) => resolve(1))
    }
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'api_key' })
    c.configure()
    c.delivery(client => delivery(client, NativeClient))
    const threads = [{}, {}]
    c.notify(new Error('123'), report => {
      report.set('threads', threads)
    }, (err, report) => {
      expect(err).not.toBeTruthy()
      expect(report.get('errorMessage')).toBe('123')
      expect(report.get('threads')).toEqual(threads)
      done()
    })
  })
})
