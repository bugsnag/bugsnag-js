const { describe, it, expect } = global

const proxyquire = require('proxyquire').noCallThru().noPreserveCache()

const Client = require('@bugsnag/core/client')

describe('plugin: react native connectivity breadcrumbs', () => {
  it('should create a breadcrumb when NetInfo events happen', () => {
    let _cb
    const NetInfo = {
      addEventListener: (fn) => {
        _cb = fn
      }
    }
    const plugin = proxyquire('../', {
      '@react-native-community/netinfo': NetInfo
    })

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    client.use(plugin)

    expect(typeof _cb).toBe('function')
    expect(client._breadcrumbs.length).toBe(0)

    _cb({ type: 'wifi', isConnected: true, isInternetReachable: true })
    expect(client._breadcrumbs.length).toBe(1)
    expect(client._breadcrumbs[0].type).toBe('state')
    expect(client._breadcrumbs[0].message).toBe('Connectivity changed')
    expect(client._breadcrumbs[0].metadata).toEqual({ type: 'wifi', isConnected: true, isInternetReachable: true })

    _cb({ type: 'none', isConnected: false, isInternetReachable: false })
    expect(client._breadcrumbs.length).toBe(2)
    expect(client._breadcrumbs[1].type).toBe('state')
    expect(client._breadcrumbs[1].message).toBe('Connectivity changed')
    expect(client._breadcrumbs[1].metadata).toEqual({ type: 'none', isConnected: false, isInternetReachable: false })
  })

  it('should not be enabled when enabledBreadcrumbTypes=null', () => {
    let _cb
    const NetInfo = {
      addEventListener: (type, fn) => {
        _cb = fn
      }
    }
    const plugin = proxyquire('../', {
      '@react-native-community/netinfo': NetInfo
    })

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null })
    client.use(plugin)

    expect(_cb).toBe(undefined)
  })

  it('should not be enabled when enabledBreadcrumbTypes=[]', () => {
    let _cb
    const NetInfo = {
      addEventListener: (fn) => {
        _cb = fn
      }
    }
    const plugin = proxyquire('../', {
      '@react-native-community/netinfo': NetInfo
    })

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: [] })
    client.use(plugin)

    expect(_cb).toBe(undefined)
  })

  it('should be enabled when enabledBreadcrumbTypes=["state"]', () => {
    let _cb
    const NetInfo = {
      addEventListener: (fn) => {
        _cb = fn
      }
    }
    const plugin = proxyquire('../', {
      '@react-native-community/netinfo': NetInfo
    })

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: ['state'] })
    client.use(plugin)

    expect(typeof _cb).toBe('function')
  })
})
