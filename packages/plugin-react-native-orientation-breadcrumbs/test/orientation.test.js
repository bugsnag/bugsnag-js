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

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' }, undefined, VALID_NOTIFIER)

    currentDimensions = { height: 100, width: 200 }

    client.use(plugin)

    expect(typeof _cb).toBe('function')
    expect(client._breadcrumbs.length).toBe(0)

    currentDimensions = { height: 200, width: 100 }
    _cb()
    expect(client._breadcrumbs.length).toBe(1)
    expect(client._breadcrumbs[0].message).toBe('Orientation changed')
    expect(client._breadcrumbs[0].metadata).toEqual({ from: 'landscape', to: 'portrait' })

    currentDimensions = { height: 200, width: 100 }
    _cb()
    expect(client._breadcrumbs.length).toBe(1)

    currentDimensions = { height: 100, width: 200 }
    _cb()
    expect(client._breadcrumbs.length).toBe(2)
    expect(client._breadcrumbs[1].message).toBe('Orientation changed')
    expect(client._breadcrumbs[1].metadata).toEqual({ from: 'portrait', to: 'landscape' })
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

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: [] }, undefined, VALID_NOTIFIER)
    client.use(plugin)

    expect(_cb).toBe(undefined)
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

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null }, undefined, VALID_NOTIFIER)
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

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: ['state'] }, undefined, VALID_NOTIFIER)
    client.use(plugin)

    expect(typeof _cb).toBe('function')
  })
})
