/* global describe, it, expect */

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }
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

    it('updates user', done => {
      const c = new Client(VALID_NOTIFIER)
      c.setOptions({ apiKey: 'api_key' })
      c.configure()
      c.use(plugin, {
        updateUser: (id, name, email) => {
          expect(id).toBe('1234')
          expect(name).toBe('Ben')
          expect(email).toBe('ben@bensnag.be')
          done()
        }
      })
      c.set('user', { id: '1234', name: 'Ben', email: 'ben@bensnag.be' })
    })

    it('updates individual user properties', done => {
      const c = new Client(VALID_NOTIFIER)
      c.setOptions({ apiKey: 'api_key' })
      c.configure()
      c.use(plugin, {
        updateUser: (id, name, email) => {
          expect(email).toBe('1234@numbers.xyz')
          done()
        }
      })
      c.set('user', 'email', '1234@numbers.xyz')
    })

    it('syncs breadcrumbs', (done) => {
      const c = new Client(VALID_NOTIFIER)
      c.setOptions({ apiKey: 'api_key' })
      c.configure()
      c.use(plugin, {
        leaveBreadcrumb: ({ name, metaData, type, timestamp }) => {
          expect(name).toBe('Spin')
          expect(metaData).toEqual({ direction: 'ccw', deg: '90' })
          done()
        }
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
              setTimeout(() => listener({ type: 'CONTEXT_UPDATE', value: 'new context' }), 0)
            }
          }
        }
      })

      const c = new Client(VALID_NOTIFIER)
      c.setOptions({ apiKey: 'api_key' })
      c.configure()
      c.use(plugin)
      expect(c.get('context')).toBe(undefined)
      setTimeout(() => {
        expect(c.get('context')).toBe('new context')
      }, 1)
    })

    it('silently updates user when an update is received', () => {
      const plugin = proxyquire('../', {
        'react-native': {
          Platform: { OS: 'android' },
          DeviceEventEmitter: {
            addListener: (event, listener) => {
              expect(event).toBe('bugsnag::sync')
              setTimeout(() => listener({ type: 'USER_UPDATE', value: { id: '1234', name: 'Ben', email: 'ben@bensnag.be' } }), 0)
            }
          }
        }
      })

      const c = new Client(VALID_NOTIFIER)
      c.setOptions({ apiKey: 'api_key' })
      c.configure()
      c.use(plugin)
      expect(c.get('user')).toEqual({})
      setTimeout(() => {
        expect(c.get('user')).toEqual({ id: '1234', name: 'Ben', email: 'ben@bensnag.be' })
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
                type: 'META_DATA_UPDATE',
                value: { extra: { apples: ['pink lady', 'braeburn', 'golden delicious'] } }
              }), 0)
            }
          }
        }
      })

      const c = new Client(VALID_NOTIFIER)
      c.setOptions({ apiKey: 'api_key' })
      c.configure()
      c.use(plugin)
      expect(c.get('extra')).toEqual(undefined)
      setTimeout(() => {
        expect(c.get('extra')).toEqual({ apples: ['pink lady', 'braeburn', 'golden delicious'] })
      }, 1)
    })

    it('ignores upates it doesn’t understand', (done) => {
      const plugin = proxyquire('../', {
        'react-native': {
          Platform: { OS: 'android' },
          DeviceEventEmitter: {
            addListener: (event, listener) => {
              expect(event).toBe('bugsnag::sync')
              setTimeout(() => listener({ type: 'UNKNOWN_UPDATE', value: {} }), 0)
            }
          }
        }
      })

      const c = new Client(VALID_NOTIFIER)
      c.setOptions({ apiKey: 'api_key' })
      c.configure()
      c.use(plugin)
      setTimeout(() => {
        done()
      }, 1)
    })
  })
})
