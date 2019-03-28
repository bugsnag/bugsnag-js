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

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    client.configure()
    client.use(plugin)

    expect(typeof _cb).toBe('function')
    expect(client.breadcrumbs.length).toBe(0)

    _cb({ type: 'wifi', effectiveType: '3g' })
    expect(client.breadcrumbs.length).toBe(1)
    expect(client.breadcrumbs[0].type).toBe('state')
    expect(client.breadcrumbs[0].name).toBe('Connectivity changed')
    expect(client.breadcrumbs[0].metaData).toEqual({ type: 'wifi', effectiveType: '3g' })

    _cb({ type: 'none', effectiveType: 'unknown' })
    expect(client.breadcrumbs.length).toBe(2)
    expect(client.breadcrumbs[1].type).toBe('state')
    expect(client.breadcrumbs[1].name).toBe('Connectivity changed')
    expect(client.breadcrumbs[1].metaData).toEqual({ type: 'none', effectiveType: 'unknown' })
  })

  it('should not be enabled when autoBreadcrumbs=false', () => {
    let _cb
    const NetInfo = {
      addEventListener: (type, fn) => {
        _cb = fn
      }
    }
    const plugin = proxyquire('../', {
      'react-native': { NetInfo }
    })

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa', autoBreadcrumbs: false })
    client.configure()
    client.use(plugin)

    expect(_cb).toBe(undefined)
  })

  it('should not be enabled when connectivityBreadcrumbsEnabled=false', () => {
    let _cb
    const NetInfo = {
      addEventListener: (type, fn) => {
        _cb = fn
      }
    }
    const plugin = proxyquire('../', {
      'react-native': { NetInfo }
    })

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa', connectivityBreadcrumbsEnabled: false })
    client.configure()
    client.use(plugin)

    expect(_cb).toBe(undefined)
  })

  it('should be enabled when autoBreadcrumbs=false and connectivityBreadcrumbsEnabled=true', () => {
    let _cb
    const NetInfo = {
      addEventListener: (type, fn) => {
        _cb = fn
      }
    }
    const plugin = proxyquire('../', {
      'react-native': { NetInfo }
    })

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa', autoBreadcrumbs: false, connectivityBreadcrumbsEnabled: true })
    client.configure()
    client.use(plugin)

    expect(typeof _cb).toBe('function')
  })
})
