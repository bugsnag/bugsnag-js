const { describe, it, expect } = global
const plugin = require('../src')
const BugsnagClient = require('@bugsnag/core/client')

describe('bugsnag vue', () => {
  it('throws when missing Vue', () => {
    expect(() => {
      plugin.init(new BugsnagClient({ apiKey: 'API_KEYYY' }))
    }).toThrow()
  })

  it('installs Vue.config.errorHandler', done => {
    const client = new BugsnagClient({ apiKey: 'API_KEYYY' })
    // client.logger(console)
    client.delivery(client => ({
      sendEvent: (payload) => {
        expect(payload.events[0].errorClass).toBe('Error')
        expect(payload.events[0].errorMessage).toBe('oops')
        expect(payload.events[0].metaData.vue).toBeDefined()
        done()
      }
    }))
    const Vue = { config: {} }
    client.use(plugin, Vue)
    expect(typeof Vue.config.errorHandler).toBe('function')
    Vue.config.errorHandler(new Error('oops'), { $root: true, $options: {} }, 'callback for watcher "fooBarBaz"')
  })

  it('bugsnag vue: classify(str)', () => {
    expect(plugin.classify('foo_bar')).toBe('FooBar')
    expect(plugin.classify('foo-bar')).toBe('FooBar')
  })
})
