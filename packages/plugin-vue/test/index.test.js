const { describe, it, expect } = global
const BugsnagVuePlugin = require('../src')
const Client = require('@bugsnag/core/client')

describe('bugsnag vue', () => {
  it('throws when missing Vue', () => {
    expect(() => {
      new BugsnagVuePlugin().load(new Client({ apiKey: 'API_KEYYY' }))
    }).toThrow()
  })

  it('installs Vue.config.errorHandler', done => {
    const Vue = { config: {} }
    const client = new Client({ apiKey: 'API_KEYYY', plugins: [new BugsnagVuePlugin(Vue)] })
    client._setDelivery(client => ({
      sendEvent: (payload) => {
        expect(payload.events[0].errors[0].errorClass).toBe('Error')
        expect(payload.events[0].errors[0].errorMessage).toBe('oops')
        expect(payload.events[0]._metadata.vue).toBeDefined()
        done()
      }
    }))
    expect(typeof Vue.config.errorHandler).toBe('function')
    Vue.config.errorHandler(new Error('oops'), { $root: true, $options: {} }, 'callback for watcher "fooBarBaz"')
  })

  it('bugsnag vue: classify(str)', () => {
    expect(BugsnagVuePlugin.classify('foo_bar')).toBe('FooBar')
    expect(BugsnagVuePlugin.classify('foo-bar')).toBe('FooBar')
  })
})
