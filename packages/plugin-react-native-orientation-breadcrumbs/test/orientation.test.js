const { describe, it, expect } = global

const proxyquire = require('proxyquire').noCallThru().noPreserveCache()

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: react native orientation breadcrumbs', () => {
  it('should create a breadcrumb when the Dimensions#change event happens', () => {
    let _cb
    let currentDimensions

    const Dimensions = {
      get: () => currentDimensions,
      addEventListener: (type, fn) => { _cb = fn }
    }

    const plugin = proxyquire('../', {
      'react-native': { Dimensions }
    })

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    client.configure()

    currentDimensions = { height: 100, width: 200 }

    client.use(plugin)

    expect(typeof _cb).toBe('function')
    expect(client.breadcrumbs.length).toBe(0)

    currentDimensions = { height: 200, width: 100 }
    _cb()
    expect(client.breadcrumbs.length).toBe(1)
    expect(client.breadcrumbs[0].message).toBe('Orientation changed')
    expect(client.breadcrumbs[0].metadata).toEqual({ from: 'landscape', to: 'portrait' })

    currentDimensions = { height: 200, width: 100 }
    _cb()
    expect(client.breadcrumbs.length).toBe(1)

    currentDimensions = { height: 100, width: 200 }
    _cb()
    expect(client.breadcrumbs.length).toBe(2)
    expect(client.breadcrumbs[1].message).toBe('Orientation changed')
    expect(client.breadcrumbs[1].metadata).toEqual({ from: 'portrait', to: 'landscape' })
  })

  it('should not be enabled when enabledBreadcrumbTypes=null', () => {
    let _cb
    const Dimensions = {
      addEventListener: (type, fn) => {
        _cb = fn
      }
    }
    const plugin = proxyquire('../', {
      'react-native': { Dimensions }
    })

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null })
    client.configure()
    client.use(plugin)

    expect(_cb).toBe(undefined)
  })

  it('should not be enabled when enabledBreadcrumbTypes=[]', () => {
    let _cb
    const Dimensions = {
      addEventListener: (type, fn) => {
        _cb = fn
      }
    }
    const plugin = proxyquire('../', {
      'react-native': { Dimensions }
    })

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: [] })
    client.configure()
    client.use(plugin)

    expect(_cb).toBe(undefined)
  })

  it('should be enabled when enabledBreadcrumbTypes=["state"]', () => {
    let _cb
    const Dimensions = {
      addEventListener: (type, fn) => {
        _cb = fn
      },
      get: () => ({ height: 100, width: 200 })
    }
    const plugin = proxyquire('../', {
      'react-native': { Dimensions }
    })

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: ['state'] })
    client.configure()
    client.use(plugin)

    expect(typeof _cb).toBe('function')
  })
})
