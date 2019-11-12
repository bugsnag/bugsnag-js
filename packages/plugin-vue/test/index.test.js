const { describe, it, expect } = global
const plugin = require('../src')
const BugsnagClient = require('@bugsnag/core/client')

const NOTIFIER = { name: 'bugsnag-vue-test', version: '0.0.0', url: 'http://yes.please' }

describe('bugsnag vue', () => {
  it('throws when missing Vue', () => {
    expect(() => {
      plugin.init(new BugsnagClient(NOTIFIER))
    }).toThrow()
  })

  it('installs Vue.config.errorHandler', done => {
    const client = new BugsnagClient(NOTIFIER)
    // client.logger(console)
    client.delivery(client => ({
      sendReport: (report) => {
        expect(report.events[0].errorClass).toBe('Error')
        expect(report.events[0].errorMessage).toBe('oops')
        expect(report.events[0].metaData.vue).toBeDefined()
        done()
      }
    }))
    client.setOptions({ apiKey: 'API_KEYYY' })
    client.configure()
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
