import Client from '@bugsnag/core/client'
import plugin from '../'
import { Breadcrumb } from '@bugsnag/core'

// @types/react-native conflicts with lib dom so disable ts for
// react-native imports until a better solution is found.
// See DefinitelyTyped/DefinitelyTyped#33311
// @ts-ignore
import { DeviceEventEmitter } from 'react-native'

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  DeviceEventEmitter: { addListener: jest.fn() }
}))

const MockAddListener: jest.MockedFunction<any> = DeviceEventEmitter.addListener

describe('plugin: react native client sync', () => {
  beforeEach(() => {
    MockAddListener.mockReset()
  })

  describe('js -> native', () => {
    it('updates context', done => {
      const c = new Client({
        apiKey: 'api_key',
        plugins: [
          plugin({
            updateContext: (update: any) => {
              expect(update).toBe('1234')
              done()
            }
          })
        ]
      })
      c.setContext('1234')
    })

    it('updates metadata', done => {
      const c = new Client({
        apiKey: 'api_key',
        plugins: [
          plugin({
            addMetadata: (key: string, updates: any) => {
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

    it('clears metadata', done => {
      const c = new Client({
        apiKey: 'api_key',
        plugins: [
          plugin({
            addMetadata: () => {},
            clearMetadata: () => {}
          })
        ]
      })
      c.addMetadata('widget', { id: '14', count: 340 })
      c.clearMetadata('widget', 'count')
      expect(c.getMetadata('widget', 'count')).toBeUndefined()
      c.clearMetadata('widget')
      expect(c.getMetadata('widget')).toBeUndefined()
      done()
    })

    it('updates user', done => {
      const c = new Client({
        apiKey: 'api_key',
        plugins: [
          plugin({
            updateUser: (id: string, email: string, name: string) => {
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
            leaveBreadcrumb: ({ message, metadata, type, timestamp }: Breadcrumb) => {
              expect(message).toBe('Spin')
              expect(metadata).toEqual({ direction: 'ccw', deg: '90' })
              done()
            }
          })
        ]
      })
      c.leaveBreadcrumb('Spin', { direction: 'ccw', deg: '90' })
    })

    describe('feature flags', () => {
      it('adds individual feature flags', done => {
        const c = new Client({
          apiKey: 'api_key',
          plugins: [
            plugin({
              addFeatureFlag: (name: string, variant?: string) => {
                expect(name).toBe('feature flag')
                expect(variant).toBe('flag variant')
                done()
              }
            })
          ]
        })

        c.addFeatureFlag('feature flag', 'flag variant')
      })

      it('adds arrays of feature flags', done => {
        const c = new Client({
          apiKey: 'api_key',
          plugins: [
            plugin({
              addFeatureFlags: (flags: { name: string, variant?: string }) => {
                expect(flags).toStrictEqual([
                  { name: 'feature flag', variant: 'flag variant' },
                  { name: 'name only flag' }
                ])
                done()
              }
            })
          ]
        })

        c.addFeatureFlags([
          { name: 'feature flag', variant: 'flag variant' },
          { name: 'name only flag' }
        ])
      })

      it('clears specific feature flags', done => {
        const c = new Client({
          apiKey: 'api_key',
          plugins: [
            plugin({
              clearFeatureFlag: (name: string) => {
                expect(name).toStrictEqual('feature flag')
                done()
              }
            })
          ]
        })

        c.clearFeatureFlag('feature flag')
      })

      it('clears all feature flags', () => {
        const clearFeatureFlags = jest.fn()
        const c = new Client({
          apiKey: 'api_key',
          plugins: [plugin({ clearFeatureFlags })]
        })

        c.clearFeatureFlags()
        expect(clearFeatureFlags).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('native -> JS', () => {
    it('silently updates context when an update is received', () => {
      MockAddListener.mockImplementation((event: any, listener: (payload: any) => void) => {
        setTimeout(() => listener({ type: 'ContextUpdate', data: 'new context' }), 0)
      })
      const c = new Client({ apiKey: 'api_key', plugins: [plugin()] })
      expect(MockAddListener).toHaveBeenCalledWith('bugsnag::sync', expect.any(Function))
      expect(c.getContext()).toBe(undefined)

      setTimeout(() => {
        expect(c.getContext()).toBe('new context')
      }, 1)
    })

    it('silently updates user when an update is received', () => {
      MockAddListener.mockImplementation((event: any, listener: (payload: any) => void) => {
        setTimeout(() => listener({ type: 'UserUpdate', data: { id: '1234', name: 'Ben', email: 'ben@bensnag.be' } }), 0)
      })

      const c = new Client({ apiKey: 'api_key', plugins: [plugin()] })
      expect(MockAddListener).toHaveBeenCalledWith('bugsnag::sync', expect.any(Function))
      expect(c.getUser()).toEqual({})
      setTimeout(() => {
        expect(c.getUser()).toEqual({ id: '1234', name: 'Ben', email: 'ben@bensnag.be' })
      }, 1)
    })

    it('silently updates metadata when an update is received', () => {
      MockAddListener.mockImplementation((event: any, listener: (payload: any) => void) => {
        setTimeout(() => listener({
          type: 'MetadataUpdate',
          data: { extra: { apples: ['pink lady', 'braeburn', 'golden delicious'] } }
        }), 0)
      })

      const c = new Client({ apiKey: 'api_key', plugins: [plugin()] })
      expect(MockAddListener).toHaveBeenCalledWith('bugsnag::sync', expect.any(Function))
      expect(c.getMetadata('extra')).toEqual(undefined)
      setTimeout(() => {
        expect(c.getMetadata('extra')).toEqual({ apples: ['pink lady', 'braeburn', 'golden delicious'] })
      }, 1)
    })

    it('ignores updates it doesn’t understand', (done) => {
      MockAddListener.mockImplementation((event: any, listener: (payload: any) => void) => {
        setTimeout(() => listener({ type: 'UnknownUpdate', data: {} }), 0)
      })

      const c = new Client({ apiKey: 'api_key', plugins: [plugin()] })
      expect(MockAddListener).toHaveBeenCalledWith('bugsnag::sync', expect.any(Function))
      expect(c).toBeTruthy()
      setTimeout(() => {
        done()
      }, 1)
    })
  })
})
