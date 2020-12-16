import BugsnagVuePlugin from '../src'
import Client from '@bugsnag/core/client'
import Vue from 'vue'

describe('bugsnag vue', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('throws when missing Vue', () => {
    expect(() => {
      new BugsnagVuePlugin(undefined).load(new Client({ apiKey: 'API_KEYYY' }))
    }).toThrow()
  })

  it('installs Vue.config.errorHandler', done => {
    const client = new Client({ apiKey: 'API_KEYYY', plugins: [new BugsnagVuePlugin(Vue)] })
    client._setDelivery(client => ({
      sendEvent: (payload) => {
        expect(payload.events[0].errors[0].errorClass).toBe('Error')
        expect(payload.events[0].errors[0].errorMessage).toBe('oops')
        expect(payload.events[0]._metadata.vue).toBeDefined()
        done()
      },
      sendSession: () => {}
    }))
    expect(typeof Vue.config.errorHandler).toBe('function')
    Vue.config.errorHandler(new Error('oops'), { $root: true, $options: {} } as unknown as Vue, 'callback for watcher "fooBarBaz"')
  })

  it('supports Vue being passed later', done => {
    const client = new Client({ apiKey: 'API_KEYYY', plugins: [new BugsnagVuePlugin()] })
    // eslint-disable-next-line
    client.getPlugin('vue')!.installVueErrorHandler(Vue)
    client._setDelivery(client => ({
      sendEvent: (payload) => {
        expect(payload.events[0].errors[0].errorClass).toBe('Error')
        expect(payload.events[0].errors[0].errorMessage).toBe('oops')
        expect(payload.events[0]._metadata.vue).toBeDefined()
        done()
      },
      sendSession: () => {}
    }))
    expect(typeof Vue.config.errorHandler).toBe('function')
    Vue.config.errorHandler(new Error('oops'), { $root: true, $options: {} } as unknown as Vue, 'callback for watcher "fooBarBaz"')
  })

  it('bugsnag vue: classify(str)', () => {
    expect(BugsnagVuePlugin.classify('foo_bar')).toBe('FooBar')
    expect(BugsnagVuePlugin.classify('foo-bar')).toBe('FooBar')
  })

  describe('global Vue', () => {
    // Workaround typescript getting upset at messing around with global
    // by taking a reference as 'any' and modifying that instead
    const globalReference: any = global
    const actualWindow = globalReference.window

    afterEach(() => {
      globalReference.window = actualWindow
      globalReference.window.Vue = undefined
    })

    it('can pull Vue out of the window object', done => {
      globalReference.window.Vue = Vue

      const client = new Client({ apiKey: 'API_KEYYY', plugins: [new BugsnagVuePlugin()] })

      client._setDelivery(client => ({
        sendEvent: (payload) => {
          expect(payload.events[0].errors[0].errorClass).toBe('Error')
          expect(payload.events[0].errors[0].errorMessage).toBe('oops')
          expect(payload.events[0]._metadata.vue).toBeDefined()
          done()
        },
        sendSession: () => {}
      }))

      expect(typeof Vue.config.errorHandler).toBe('function')

      Vue.config.errorHandler(
        new Error('oops'),
        { $root: true, $options: {} } as unknown as Vue,
        'callback for watcher "fooBarBaz"'
      )
    })

    it('checks for window.Vue safely', done => {
      // Delete the window object so that any unsafe check for 'window.Vue' will throw
      delete globalReference.window

      const client = new Client({ apiKey: 'API_KEYYY', plugins: [new BugsnagVuePlugin()] })

      // eslint-disable-next-line
      client.getPlugin('vue')!.installVueErrorHandler(Vue)

      client._setDelivery(client => ({
        sendEvent: (payload) => {
          expect(payload.events[0].errors[0].errorClass).toBe('Error')
          expect(payload.events[0].errors[0].errorMessage).toBe('oops')
          expect(payload.events[0]._metadata.vue).toBeDefined()
          done()
        },
        sendSession: () => {}
      }))

      expect(typeof Vue.config.errorHandler).toBe('function')

      Vue.config.errorHandler(new Error('oops'), { $root: true, $options: {} } as unknown as Vue, 'callback for watcher "fooBarBaz"')
    })
  })
})
