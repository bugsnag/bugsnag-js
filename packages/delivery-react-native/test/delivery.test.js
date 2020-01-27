/* global describe, it, expect */

const Client = require('@bugsnag/core/client')
const delivery = require('../')

describe('delivery: react native', () => {
  it('sends the correct payload using the native client’s dispatch() method', done => {
    const sent = []
    const NativeClient = {
      dispatch: (event) => {
        sent.push(event)
        return new Promise((resolve) => resolve(true))
      }
    }
    const c = new Client({ apiKey: 'api_key' })
    c._setDelivery(client => delivery(client, NativeClient))
    c.leaveBreadcrumb('hi')
    c.setContext('test screen')
    c.setUser('123')
    c.notify(new Error('oh no'), (e) => {
      e.groupingHash = 'ER_GRP_098'
    }, (err, event) => {
      expect(err).not.toBeTruthy()
      expect(sent.length).toBe(1)
      expect(sent[0].errors[0].errorMessage).toBe('oh no')
      expect(sent[0].severity).toBe('warning')
      expect(sent[0].severityReason.type).toBe('handledException')
      expect(sent[0].unhandled).toBe(false)
      expect(sent[0].app).toEqual({ releaseStage: 'production', version: null, type: null })
      expect(sent[0].device).toEqual({})
      // TODO enable once event.threads exists
      // expect(sent[0].threads).toEqual({})
      expect(sent[0].breadcrumbs.length).toBe(1)
      expect(sent[0].breadcrumbs[0].message).toBe('hi')
      expect(sent[0].context).toBe('test screen')
      expect(sent[0].user).toEqual({ id: '123', email: undefined, name: undefined })
      expect(sent[0].metadata).toEqual({})
      expect(sent[0].groupingHash).toEqual('ER_GRP_098')
      done()
    })
  })
})
