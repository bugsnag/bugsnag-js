/* global describe, it, expect */

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }
const proxyquire = require('proxyquire').noCallThru()
const plugin = proxyquire('../', {
  'react-native': {
    Platform: { OS: 'Android' },
    DeviceEventEmitter: { addListener: () => {} }
  }
})

describe('plugin: react native client sync', () => {
  it('updates context', done => {
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'api_key' })
    c.configure()
    c.use(plugin, {
      updateContext: (update) => {
        expect(update).toBe('1234')
        done()
      }
    })
    c.set('context', '1234')
  })

  it('updates metaData', done => {
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'api_key' })
    c.configure()
    c.use(plugin, {
      updateMetaData: (updates) => {
        expect(Object.keys(updates).length).toBe(1)
        expect(updates).toEqual({
          widget: {
            id: '14',
            count: 340
          }
        })
        done()
      }
    })
    c.set('widget', { id: '14', count: 340 })
  })

  it('updates nested metaData', done => {
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'api_key' })
    c.configure()
    c.use(plugin, {
      updateMetaData: (updates) => {
        expect(Object.keys(updates).length).toBe(1)
        expect(updates).toEqual({
          widget: {
            id: '909',
            count: 340
          }
        })
        done()
      }
    })
    c._internalState._set({ key: 'widget', nestedKeys: [], value: { id: '12', count: 340 }, silent: true })
    c.set('widget', 'id', '909')
  })
})
