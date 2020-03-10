/* global describe, it, expect */

const Client = require('@bugsnag/core/client')
const proxyquire = require('proxyquire').noCallThru()

describe('plugin: react native client sync', () => {
  const plugin = proxyquire('../', {
    'react-native': {
      Platform: { OS: 'android' },
      DeviceEventEmitter: { addListener: () => {} }
    }
  })

  describe('js -> native', () => {
    it('updates context', done => {
      const c = new Client({
        apiKey: 'api_key',
        plugins: [
          plugin({
            updateContext: (update) => {
              expect(update).toBe('1234')
              done()
            }
          })
        ]
      })
      c.setContext('1234')
    })

    it('updates metaData', done => {
      const c = new Client({
        apiKey: 'api_key',
        plugins: [
          plugin({
            updateMetadata: (key, updates) => {
              expect(key).toBe('widget')
              expect(updates).toEqual({
                id: '14',
                count: 340
              })
              done()
            }
          })
        ]
      })
      c.addMetadata('widget', { id: '14', count: 340 })
      expect(c.getMetadata('widget')).toEqual({ id: '14', count: 340 })
    })

    it('updates user', done => {
      const c = new Client({
        apiKey: 'api_key',
        plugins: [
          plugin({
            updateUser: (id, email, name) => {
              expect(id).toBe('1234')
              expect(name).toBe('Ben')
              expect(email).toBe('ben@bensnag.be')
              done()
            }
          })
        ]
      })
      c.setUser('1234', 'ben@bensnag.be', 'Ben')
      expect(c.getUser()).toEqual({ id: '1234', name: 'Ben', email: 'ben@bensnag.be' })
    })

    it('syncs breadcrumbs', (done) => {
      const c = new Client({
        apiKey: 'api_key',
        plugins: [
          plugin({
            leaveBreadcrumb: ({ message, metadata, type, timestamp }) => {
              expect(message).toBe('Spin')
              expect(metadata).toEqual({ direction: 'ccw', deg: '90' })
              done()
            }
          })
        ]
      })
      c.leaveBreadcrumb('Spin', { direction: 'ccw', deg: '90' })
    })
  })

  describe('native -> JS', () => {
    it('silently updates context when an update is received', () => {
      const plugin = proxyquire('../', {
        'react-native': {
          Platform: { OS: 'android' },
          DeviceEventEmitter: {
            addListener: (event, listener) => {
              expect(event).toBe('bugsnag::sync')
              setTimeout(() => listener({ type: 'ContextUpdate', data: 'new context' }), 0)
            }
          }
        }
      })

      const c = new Client({ apiKey: 'api_key', plugins: [plugin()] })
      expect(c.getContext()).toBe(undefined)
      setTimeout(() => {
        expect(c.getContext()).toBe('new context')
      }, 1)
    })

    it('silently updates user when an update is received', () => {
      const plugin = proxyquire('../', {
        'react-native': {
          Platform: { OS: 'android' },
          DeviceEventEmitter: {
            addListener: (event, listener) => {
              expect(event).toBe('bugsnag::sync')
              setTimeout(() => listener({ type: 'UserUpdate', data: { id: '1234', name: 'Ben', email: 'ben@bensnag.be' } }), 0)
            }
          }
        }
      })

      const c = new Client({ apiKey: 'api_key', plugins: [plugin()] })
      expect(c.getUser()).toEqual({})
      setTimeout(() => {
        expect(c.getUser()).toEqual({ id: '1234', name: 'Ben', email: 'ben@bensnag.be' })
      }, 1)
    })

    it('silently updates metadata when an update is received', () => {
      const plugin = proxyquire('../', {
        'react-native': {
          Platform: { OS: 'android' },
          DeviceEventEmitter: {
            addListener: (event, listener) => {
              expect(event).toBe('bugsnag::sync')
              setTimeout(() => listener({
                type: 'MetadataUpdate',
                data: { extra: { apples: ['pink lady', 'braeburn', 'golden delicious'] } }
              }), 0)
            }
          }
        }
      })

      const c = new Client({ apiKey: 'api_key', plugins: [plugin()] })
      expect(c.getMetadata('extra')).toEqual(undefined)
      setTimeout(() => {
        expect(c.getMetadata('extra')).toEqual({ apples: ['pink lady', 'braeburn', 'golden delicious'] })
      }, 1)
    })

    it('ignores upates it doesn’t understand', (done) => {
      const plugin = proxyquire('../', {
        'react-native': {
          Platform: { OS: 'android' },
          DeviceEventEmitter: {
            addListener: (event, listener) => {
              expect(event).toBe('bugsnag::sync')
              setTimeout(() => listener({ type: 'UnknownUpdate', data: {} }), 0)
            }
          }
        }
      })

      const c = new Client({ apiKey: 'api_key', plugins: [plugin()] })
      expect(c).toBeTruthy()
      setTimeout(() => {
        done()
      }, 1)
    })
  })
})
