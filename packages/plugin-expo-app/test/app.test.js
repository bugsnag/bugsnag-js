/* global describe, it, expect */

const proxyquire = require('proxyquire').noPreserveCache().noCallThru()
const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: expo device', () => {
  it('should should use version if defined (all platforms)', done => {
    const VERSION = '1.0.0'
    const plugin = proxyquire('../', {
      'expo': {
        Constants: {
          platform: {
          },
          manifest: { version: VERSION }
        }
      },
      'react-native': {
        AppState: {
          addEventListener: () => {},
          currentState: 'active'
        }
      }
    })
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'api_key' })
    c.configure()

    c.use(plugin)
    c.delivery(client => ({
      sendReport: (report) => {
        const r = JSON.parse(JSON.stringify(report))
        expect(r).toBeTruthy()
        expect(r.events[0].app.version).toBe(VERSION)
        done()
      }
    }))
    c.notify(new Error('flip'))
  })

  it('should should use revisionId if defined (all platforms)', done => {
    const VERSION = '1.0.0'
    const REVISION_ID = '1.0.0-r132432'
    const plugin = proxyquire('../', {
      'expo': {
        Constants: {
          platform: {
          },
          manifest: { version: VERSION, revisionId: REVISION_ID }
        }
      },
      'react-native': {
        AppState: {
          addEventListener: () => {},
          currentState: 'active'
        }
      }
    })
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'api_key' })
    c.configure()

    c.use(plugin)
    c.delivery(client => ({
      sendReport: (report) => {
        const r = JSON.parse(JSON.stringify(report))
        expect(r).toBeTruthy()
        expect(r.events[0].app.codeBundleId).toBe(REVISION_ID)
        done()
      }
    }))
    c.notify(new Error('flip'))
  })

  it('should should use versionCode if defined (android)', done => {
    const VERSION_CODE = '1.0'
    const plugin = proxyquire('../', {
      'expo': {
        Constants: {
          platform: {
            android: { versionCode: VERSION_CODE }
          },
          manifest: { version: '1.0.0' },
          appOwnership: 'standalone'
        }
      },
      'react-native': {
        AppState: {
          addEventListener: () => {},
          currentState: 'active'
        }
      }
    })
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'api_key' })
    c.configure()

    c.use(plugin)
    c.delivery(client => ({
      sendReport: (report) => {
        const r = JSON.parse(JSON.stringify(report))
        expect(r).toBeTruthy()
        expect(r.events[0].metaData.app.nativeVersionCode).toBe(VERSION_CODE)
        done()
      }
    }))
    c.notify(new Error('flip'))
  })

  it('should should use bundleVersion if defined (ios)', done => {
    const BUNDLE_VERSION = '1.0'
    const plugin = proxyquire('../', {
      'expo': {
        Constants: {
          platform: {
            ios: { buildNumber: BUNDLE_VERSION }
          },
          manifest: { version: '1.0.0' },
          appOwnership: 'standalone'
        }
      },
      'react-native': {
        AppState: {
          addEventListener: () => {},
          currentState: 'active'
        }
      }
    })
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'api_key' })
    c.configure()

    c.use(plugin)
    c.delivery(client => ({
      sendReport: (report) => {
        const r = JSON.parse(JSON.stringify(report))
        expect(r).toBeTruthy()
        expect(r.events[0].metaData.app.nativeBundleVersion).toBe(BUNDLE_VERSION)
        done()
      }
    }))
    c.notify(new Error('flip'))
  })

  it('detects whether the app is inForeground', done => {
    const AppState = {
      addEventListener: (name, fn) => {
        listener = fn
      },
      currentState: 'active'
    }
    let listener
    const plugin = proxyquire('../', {
      'expo': {
        Constants: {
          platform: {},
          manifest: {}
        }
      },
      'react-native': { AppState }
    })
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'api_key' })
    c.configure()

    c.use(plugin)
    expect(typeof listener).toBe('function')
    const reports = []
    c.delivery(client => ({
      sendReport: (report) => {
        const r = JSON.parse(JSON.stringify(report))
        expect(r).toBeTruthy()
        reports.push(r)
        if (reports.length < 3) return
        expect(reports[0].events[0].app.inForeground).toBe(true)
        expect(reports[1].events[0].app.inForeground).toBe(false)
        expect(reports[2].events[0].app.inForeground).toBe(true)
        done()
      }
    }))
    c.notify(new Error('flip'))
    setTimeout(() => {
      listener('inactive')
      AppState.currentState = 'inactive'
      c.notify(new Error('flop'))
      setTimeout(() => {
        listener('active')
        AppState.currentState = 'active'
        c.notify(new Error('flooop'))
      }, 20)
    }, 20)
  })
})
