const { describe, it, expect } = global

const proxyquire = require('proxyquire').noCallThru().noPreserveCache()

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: react native connectivity breadcrumbs', () => {
  it('should create a breadcrumb when the NetInfo#connectionChange event happens', () => {
    let _cb
    const NetInfo = {
      addEventListener: (type, fn) => {
        _cb = fn
      }
    }
    const plugin = proxyquire('../', {
      'react-native': { NetInfo }
    })

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' }, undefined, VALID_NOTIFIER)
    client.use(plugin)

    expect(typeof _cb).toBe('function')
    expect(client._breadcrumbs.length).toBe(0)

    _cb({ type: 'wifi', effectiveType: '3g' })
    expect(client._breadcrumbs.length).toBe(1)
    expect(client._breadcrumbs[0].type).toBe('state')
    expect(client._breadcrumbs[0].message).toBe('Connectivity changed')
    expect(client._breadcrumbs[0].metadata).toEqual({ type: 'wifi', effectiveType: '3g' })

    _cb({ type: 'none', effectiveType: 'unknown' })
    expect(client._breadcrumbs.length).toBe(2)
    expect(client._breadcrumbs[1].type).toBe('state')
    expect(client._breadcrumbs[1].message).toBe('Connectivity changed')
    expect(client._breadcrumbs[1].metadata).toEqual({ type: 'none', effectiveType: 'unknown' })
  })

  it('should not be enabled when enabledBreadcrumbTypes=[]', () => {
    let _cb
    const NetInfo = {
      addEventListener: (type, fn) => {
        _cb = fn
      }
    }
    const plugin = proxyquire('../', {
      'react-native': { NetInfo }
    })

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: [] }, undefined, VALID_NOTIFIER)
    client.use(plugin)

    expect(_cb).toBe(undefined)
  })

  it('should not be enabled when enabledBreadcrumbTypes=null', () => {
    let _cb
    const NetInfo = {
      addEventListener: (type, fn) => {
        _cb = fn
      }
    }
    const plugin = proxyquire('../', {
      'react-native': { NetInfo }
    })

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null }, undefined, VALID_NOTIFIER)
    client.use(plugin)

    expect(_cb).toBe(undefined)
  })

  it('should be enabled when enabledBreadcrumbTypes=["state"]', () => {
    let _cb
    const NetInfo = {
      addEventListener: (type, fn) => {
        _cb = fn
      }
    }
    const plugin = proxyquire('../', {
      'react-native': { NetInfo }
    })

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: ['state'] }, undefined, VALID_NOTIFIER)
    client.use(plugin)

    expect(typeof _cb).toBe('function')
  })
})
