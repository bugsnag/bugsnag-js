const { describe, it, expect } = global

const proxyquire = require('proxyquire').noCallThru().noPreserveCache()

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: react native app state breadcrumbs', () => {
  it('should create a breadcrumb when the AppState#change event happens', () => {
    let _cb
    const AppState = {
      addEventListener: (type, fn) => {
        _cb = fn
      }
    }
    const plugin = proxyquire('../', {
      'react-native': { AppState }
    })

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    client.configure()
    client.use(plugin)

    expect(typeof _cb).toBe('function')
    expect(client.breadcrumbs.length).toBe(0)

    _cb('background')
    expect(client.breadcrumbs.length).toBe(1)
    expect(client.breadcrumbs[0].type).toBe('state')
    expect(client.breadcrumbs[0].name).toBe('App state changed')
    expect(client.breadcrumbs[0].metaData).toEqual({ state: 'background' })

    _cb('active')
    expect(client.breadcrumbs.length).toBe(2)
    expect(client.breadcrumbs[1].type).toBe('state')
    expect(client.breadcrumbs[1].name).toBe('App state changed')
    expect(client.breadcrumbs[1].metaData).toEqual({ state: 'active' })
  })

  it('should not be enabled when autoBreadcrumbs=false', () => {
    let _cb
    const AppState = {
      addEventListener: (type, fn) => {
        _cb = fn
      }
    }
    const plugin = proxyquire('../', {
      'react-native': { AppState }
    })

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa', autoBreadcrumbs: false })
    client.configure()
    client.use(plugin)

    expect(_cb).toBe(undefined)
  })

  it('should not be enabled when appStateBreadcrumbsEnabled=false', () => {
    let _cb
    const AppState = {
      addEventListener: (type, fn) => {
        _cb = fn
      }
    }
    const plugin = proxyquire('../', {
      'react-native': { AppState }
    })

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa', appStateBreadcrumbsEnabled: false })
    client.configure()
    client.use(plugin)

    expect(_cb).toBe(undefined)
  })

  it('should be enabled when autoBreadcrumbs=false and appStateBreadcrumbsEnabled=true', () => {
    let _cb
    const AppState = {
      addEventListener: (type, fn) => {
        _cb = fn
      }
    }
    const plugin = proxyquire('../', {
      'react-native': { AppState }
    })

    const client = new Client(VALID_NOTIFIER)
    client.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa', autoBreadcrumbs: false, appStateBreadcrumbsEnabled: true })
    client.configure()
    client.use(plugin)

    expect(typeof _cb).toBe('function')
  })
})
