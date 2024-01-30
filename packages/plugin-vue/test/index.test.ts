import BugsnagVuePlugin from '../src'
import Client from '@bugsnag/core/client'

describe('bugsnag vue', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  //
  // VUE 3+
  //

  interface Vue3App {
    use: (plugin: { install: (app: Vue3App, ...options: any[]) => any }) => void
    config: { errorHandler?: Vue3ErrorHandler }
  }

  type Vue3ErrorHandler = (err: unknown, vm: any, info: any) => void

  it('errors when missing vue app', () => {
    const client = new Client({ apiKey: 'API_KEYYY' })
    jest.spyOn(client._logger, 'error')
    expect(() => {
      // @ts-ignore
      new BugsnagVuePlugin().load(client).install()
    }).toThrow()
    expect(client._logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: '@bugsnag/plugin-vue reference to Vue `app` was undefined' }))
  })

  it('installs app.config.errorHandler', done => {
    const mockVueApp: Vue3App = {
      use: (plugin) => {
        plugin.install(mockVueApp)
      },
      config: { errorHandler: undefined }
    }
    const client = new Client({ apiKey: 'API_KEYYY', plugins: [new BugsnagVuePlugin()] })
    // eslint-disable-next-line
    mockVueApp.use(client.getPlugin('vue')!)
    client._setDelivery(client => ({
      sendEvent: (payload) => {
        expect(payload.events[0].errors[0].errorClass).toBe('Error')
        expect(payload.events[0].errors[0].errorMessage).toBe('oops')
        expect(payload.events[0].errors[0].stacktrace[0].file).toBe(__filename)
        expect(payload.events[0]._metadata.vue).toBeDefined()
        expect(payload.events[0]._metadata.vue.component).toBe('MyComponent')
        expect(payload.events[0]._metadata.vue.errorInfo).toBe('render function')
        done()
      },
      sendSession: () => {}
    }))
    expect(typeof mockVueApp.config.errorHandler).toBe('function')
    const errorHandler = mockVueApp.config.errorHandler as unknown as Vue3ErrorHandler
    errorHandler(new Error('oops'), { $options: { name: 'MyComponent' } }, 1)
  })

  it('works with the root component', done => {
    const mockVueApp: Vue3App = {
      use: (plugin) => {
        plugin.install(mockVueApp)
      },
      config: { errorHandler: undefined }
    }
    const client = new Client({ apiKey: 'API_KEYYY', plugins: [new BugsnagVuePlugin()] })
    // eslint-disable-next-line
    mockVueApp.use(client.getPlugin('vue')!)
    client._setDelivery(client => ({
      sendEvent: (payload) => {
        expect(payload.events[0].errors[0].errorClass).toBe('Error')
        expect(payload.events[0].errors[0].errorMessage).toBe('oops')
        expect(payload.events[0]._metadata.vue).toBeDefined()
        expect(payload.events[0]._metadata.vue.component).toBe('App')
        expect(payload.events[0]._metadata.vue.errorInfo).toBe('render function')
        done()
      },
      sendSession: () => {}
    }))
    expect(typeof mockVueApp.config.errorHandler).toBe('function')
    const errorHandler = mockVueApp.config.errorHandler as unknown as Vue3ErrorHandler
    errorHandler(new Error('oops'), { $parent: null, $options: {} }, 1)
  })

  it('handles URL info paramater', done => {
    const mockVueApp: Vue3App = {
      use: (plugin) => {
        plugin.install(mockVueApp)
      },
      config: { errorHandler: undefined }
    }
    const client = new Client({ apiKey: 'API_KEYYY', plugins: [new BugsnagVuePlugin()] })
    // eslint-disable-next-line
    mockVueApp.use(client.getPlugin('vue')!)
    client._setDelivery(client => ({
      sendEvent: (payload) => {
        expect(payload.events[0].errors[0].errorClass).toBe('Error')
        expect(payload.events[0].errors[0].errorMessage).toBe('oops')
        expect(payload.events[0]._metadata.vue).toBeDefined()
        expect(payload.events[0]._metadata.vue.component).toBe('MyComponent')
        expect(payload.events[0]._metadata.vue.errorInfo).toBe('render function')
        done()
      },
      sendSession: () => {}
    }))
    expect(typeof mockVueApp.config.errorHandler).toBe('function')
    const errorHandler = mockVueApp.config.errorHandler as unknown as Vue3ErrorHandler
    errorHandler(new Error('oops'), { $options: { name: 'MyComponent' } }, 'https://vuejs.org/error-reference/#runtime-1')
  })

  it('tolerates unmappable info paramater', done => {
    const mockVueApp: Vue3App = {
      use: (plugin) => {
        plugin.install(mockVueApp)
      },
      config: { errorHandler: undefined }
    }
    const client = new Client({ apiKey: 'API_KEYYY', plugins: [new BugsnagVuePlugin()] })
    // eslint-disable-next-line
    mockVueApp.use(client.getPlugin('vue')!)
    client._setDelivery(client => ({
      sendEvent: (payload) => {
        expect(payload.events[0].errors[0].errorClass).toBe('Error')
        expect(payload.events[0].errors[0].errorMessage).toBe('oops')
        expect(payload.events[0]._metadata.vue).toBeDefined()
        expect(payload.events[0]._metadata.vue.component).toBe('MyComponent')
        expect(payload.events[0]._metadata.vue.errorInfo).toBe('abcz')
        done()
      },
      sendSession: () => {}
    }))
    expect(typeof mockVueApp.config.errorHandler).toBe('function')
    const errorHandler = mockVueApp.config.errorHandler as unknown as Vue3ErrorHandler
    errorHandler(new Error('oops'), { $options: { name: 'MyComponent' } }, 'abcz')
  })

  it('tolerates anonymous components', done => {
    const mockVueApp: Vue3App = {
      use: (plugin) => {
        plugin.install(mockVueApp)
      },
      config: { errorHandler: undefined }
    }
    const client = new Client({ apiKey: 'API_KEYYY', plugins: [new BugsnagVuePlugin()] })
    // eslint-disable-next-line
    mockVueApp.use(client.getPlugin('vue')!)
    client._setDelivery(client => ({
      sendEvent: (payload) => {
        expect(payload.events[0].errors[0].errorClass).toBe('Error')
        expect(payload.events[0].errors[0].errorMessage).toBe('oops')
        expect(payload.events[0]._metadata.vue).toBeDefined()
        expect(payload.events[0]._metadata.vue.component).toBe('Anonymous')
        expect(payload.events[0]._metadata.vue.errorInfo).toBe('render function')
        done()
      },
      sendSession: () => {}
    }))
    expect(typeof mockVueApp.config.errorHandler).toBe('function')
    const errorHandler = mockVueApp.config.errorHandler as unknown as Vue3ErrorHandler
    errorHandler(new Error('oops'), { $options: {} }, 1)
  })

  it('tolerates string "errors"', done => {
    const mockVueApp: Vue3App = {
      use: (plugin) => {
        plugin.install(mockVueApp)
      },
      config: { errorHandler: undefined }
    }

    const client = new Client({ apiKey: 'API_KEYYY', plugins: [new BugsnagVuePlugin()] })

    // eslint-disable-next-line
    mockVueApp.use(client.getPlugin('vue')!)

    client._setDelivery(client => ({
      sendEvent: (payload) => {
        expect(payload.events[0].errors[0].errorClass).toBe('Error')
        expect(payload.events[0].errors[0].errorMessage).toBe('oops')

        // ensure the top-most stack frame has an accurate file; it should be
        // this test file as that is where the error string was created
        expect(payload.events[0].errors[0].stacktrace[0].file).toBe(__filename)

        expect(payload.events[0]._metadata.vue).toBeDefined()
        expect(payload.events[0]._metadata.vue.component).toBe('MyComponent')
        expect(payload.events[0]._metadata.vue.errorInfo).toBe('render function')
        done()
      },
      sendSession: () => {}
    }))

    expect(typeof mockVueApp.config.errorHandler).toBe('function')

    const errorHandler = mockVueApp.config.errorHandler as unknown as Vue3ErrorHandler

    errorHandler('oops', { $options: { name: 'MyComponent' } }, 1)
  })

  //
  // VUE 2
  //

  type Vue2ErrorHandler = (err: Error, vm: object, info: string) => void

  it('throws when missing Vue', () => {
    expect(() => {
      new BugsnagVuePlugin(undefined).load(new Client({ apiKey: 'API_KEYYY' }))
    }).toThrow()
  })

  it('installs Vue.config.errorHandler', done => {
    const mockVue = { config: { errorHandler: undefined } }
    const client = new Client({ apiKey: 'API_KEYYY', plugins: [new BugsnagVuePlugin(mockVue)] })
    client._setDelivery(client => ({
      sendEvent: (payload) => {
        expect(payload.events[0].errors[0].errorClass).toBe('Error')
        expect(payload.events[0].errors[0].errorMessage).toBe('oops')
        expect(payload.events[0].errors[0].stacktrace[0].file).toBe(__filename)
        expect(payload.events[0]._metadata.vue).toBeDefined()
        done()
      },
      sendSession: () => {}
    }))
    expect(typeof mockVue.config.errorHandler).toBe('function')
    const errorHandler = mockVue.config.errorHandler as unknown as Vue2ErrorHandler
    errorHandler(new Error('oops'), { $root: true, $options: {} }, 'callback for watcher "fooBarBaz"')
  })

  it('supports Vue being passed later', done => {
    const mockVue = { config: { errorHandler: undefined } }
    const client = new Client({ apiKey: 'API_KEYYY', plugins: [new BugsnagVuePlugin()] })
    // eslint-disable-next-line
    client.getPlugin('vue')!.installVueErrorHandler(mockVue)
    client._setDelivery(client => ({
      sendEvent: (payload) => {
        expect(payload.events[0].errors[0].errorClass).toBe('Error')
        expect(payload.events[0].errors[0].errorMessage).toBe('oops')
        expect(payload.events[0]._metadata.vue).toBeDefined()
        done()
      },
      sendSession: () => {}
    }))
    expect(typeof mockVue.config.errorHandler).toBe('function')
    const errorHandler = mockVue.config.errorHandler as unknown as Vue2ErrorHandler
    errorHandler(new Error('oops'), { $root: true, $options: {} }, 'callback for watcher "fooBarBaz"')
  })

  it('supports string "errors"', done => {
    const mockVue = { config: { errorHandler: undefined } }
    const client = new Client({ apiKey: 'API_KEYYY', plugins: [new BugsnagVuePlugin(mockVue)] })

    client._setDelivery(client => ({
      sendEvent: (payload) => {
        expect(payload.events[0].errors[0].errorClass).toBe('Error')
        expect(payload.events[0].errors[0].errorMessage).toBe('oops')

        // ensure the top-most stack frame has an accurate file; it should be
        // this test file as that is where the error string was created
        expect(payload.events[0].errors[0].stacktrace[0].file).toBe(__filename)

        expect(payload.events[0]._metadata.vue).toBeDefined()
        done()
      },
      sendSession: () => {}
    }))

    expect(typeof mockVue.config.errorHandler).toBe('function')

    const errorHandler = mockVue.config.errorHandler as unknown as Vue2ErrorHandler

    // @ts-ignore
    errorHandler('oops', { $root: true, $options: {} }, 'callback for watcher "fooBarBaz"')
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
      const mockVue = { config: { errorHandler: undefined } }
      globalReference.window.Vue = mockVue

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

      expect(typeof mockVue.config.errorHandler).toBe('function')

      const errorHandler = mockVue.config.errorHandler as unknown as Vue2ErrorHandler
      errorHandler(new Error('oops'), { $root: true, $options: {} }, 'callback for watcher "fooBarBaz"')
    })

    it('checks for window.Vue safely', done => {
      const mockVue = { config: { errorHandler: undefined } }
      // Delete the window object so that any unsafe check for 'window.Vue' will throw
      delete globalReference.window

      const client = new Client({ apiKey: 'API_KEYYY', plugins: [new BugsnagVuePlugin()] })

      // eslint-disable-next-line
      client.getPlugin('vue')!.installVueErrorHandler(mockVue)

      client._setDelivery(client => ({
        sendEvent: (payload) => {
          expect(payload.events[0].errors[0].errorClass).toBe('Error')
          expect(payload.events[0].errors[0].errorMessage).toBe('oops')
          expect(payload.events[0]._metadata.vue).toBeDefined()
          done()
        },
        sendSession: () => {}
      }))

      expect(typeof mockVue.config.errorHandler).toBe('function')

      const errorHandler = mockVue.config.errorHandler as unknown as Vue2ErrorHandler
      errorHandler(new Error('oops'), { $root: true, $options: {} }, 'callback for watcher "fooBarBaz"')
    })
  })
})
