/* global describe, it, expect */

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }
const plugin = require('../')

describe('plugin: react native client sync', () => {
  it('updates context', done => {
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'api_key' })
    c.configure()
    c.use(plugin, {
      updateClientProperty: (updates) => {
        expect(Object.keys(updates).length).toBe(1)
        expect(updates['context']).toEqual({ type: 'string', value: '1234' })
        done()
      }
    })
    const observedClient = c.getPlugin('observedClient')
    observedClient.context = '1234'
  })

  it('updates metaData', done => {
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'api_key' })
    c.configure()
    c.use(plugin, {
      updateClientProperty: (updates) => {
        expect(Object.keys(updates).length).toBe(1)
        expect(updates['metaData']).toEqual({
          type: 'map',
          value: {
            widget: {
              type: 'map',
              value: {
                id: { type: 'string', value: '14' },
                count: { type: 'number', value: 340 }
              }
            }
          }
        })
        done()
      }
    })
    const observedClient = c.getPlugin('observedClient')
    observedClient.metaData = { widget: { id: '14', count: 340 } }
  })

  it('updates nested metaData', done => {
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'api_key' })
    c.configure()
    c.use(plugin, {
      updateClientProperty: (updates) => {
        expect(Object.keys(updates).length).toBe(1)
        expect(updates['metaData']).toEqual({
          type: 'map',
          value: {
            widget: {
              type: 'map',
              value: {
                id: { type: 'string', value: '14' },
                count: { type: 'number', value: 340 }
              }
            }
          }
        })
        done()
      }
    })
    const observedClient = c.getPlugin('observedClient')
    observedClient.metaData = { widget: { id: '14', count: 340 } }
  })
})
