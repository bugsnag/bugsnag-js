/* global describe, it, expect */

const proxyquire = require('proxyquire').noPreserveCache().noCallThru()
const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: expo device', () => {
  it('should extract the expected properties from expo/react native (android)', done => {
    const REACT_NATIVE_VERSION = '0.57.1'
    const SDK_VERSION = '32.0.0'
    const EXPO_VERSION = '2.10.6'
    const ANDROID_API_LEVEL = 28
    const ANDROID_VERSION = '8.0.0'
    const plugin = proxyquire('../', {
      'expo-constants': {
        default: {
          platform: { android: {} },
          manifest: { sdkVersion: SDK_VERSION },
          expoVersion: EXPO_VERSION,
          systemVersion: ANDROID_VERSION
        }
      },
      'react-native': {
        Dimensions: {
          addEventListener: function () {},
          get: function () {
            return { width: 1024, height: 768 }
          }
        },
        Platform: { OS: 'android', Version: ANDROID_API_LEVEL }
      },
      'react-native/package.json': { version: REACT_NATIVE_VERSION }
    })
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'api_key' })
    c.configure()
    const before = (new Date()).toISOString()
    c.delivery(client => ({
      sendReport: (report) => {
        const r = JSON.parse(JSON.stringify(report))
        expect(r).toBeTruthy()
        expect(r.events[0].device).toBeTruthy()
        const now = (new Date()).toISOString()
        expect(now >= r.events[0].device.time).toBe(true)
        expect(before <= r.events[0].device.time).toBe(true)
        expect(r.events[0].device.osName).toBe('android')
        expect(r.events[0].device.osVersion).toBe(ANDROID_VERSION)
        expect(r.events[0].device.runtimeVersions).toEqual({
          reactNative: REACT_NATIVE_VERSION,
          expoSdk: SDK_VERSION,
          expoApp: EXPO_VERSION,
          androidApiLevel: String(ANDROID_API_LEVEL)
        })
        done()
      }
    }))
    c.use(plugin)
    c.notify(new Error('device testing'))
  })

  it('should extract the expected properties from expo/react native (apple)', done => {
    const REACT_NATIVE_VERSION = '0.57.1'
    const SDK_VERSION = '32.3.0'
    const EXPO_VERSION = '2.10.4'
    const IOS_MODEL = 'iPhone 7 Plus'
    const IOS_PLATFORM = 'iPhone1,1'
    const IOS_VERSION = '11.2'
    const plugin = proxyquire('../', {
      'expo-constants': {
        default: {
          platform: { ios: { model: IOS_MODEL, platform: IOS_PLATFORM, systemVersion: IOS_VERSION } },
          manifest: { sdkVersion: SDK_VERSION },
          expoVersion: EXPO_VERSION
        }
      },
      'react-native': {
        Dimensions: {
          addEventListener: function () {},
          get: function () {
            return { width: 1024, height: 768 }
          }
        },
        Platform: { OS: 'ios' }
      },
      'react-native/package.json': { version: REACT_NATIVE_VERSION }
    })
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'api_key' })
    c.configure()
    const before = (new Date()).toISOString()
    c.delivery(client => ({
      sendReport: (report) => {
        const r = JSON.parse(JSON.stringify(report))
        expect(r).toBeTruthy()
        expect(r.events[0].device).toBeTruthy()
        const now = (new Date()).toISOString()
        expect(now >= r.events[0].device.time).toBe(true)
        expect(before <= r.events[0].device.time).toBe(true)
        expect(r.events[0].device.osName).toBe('ios')
        expect(r.events[0].device.osVersion).toBe(IOS_VERSION)
        expect(r.events[0].device.runtimeVersions).toEqual({
          reactNative: REACT_NATIVE_VERSION,
          expoSdk: SDK_VERSION,
          expoApp: EXPO_VERSION
        })
        done()
      }
    }))
    c.use(plugin)
    c.notify(new Error('device testing'))
  })

  it('updates orientation when the screen dimensions change', done => {
    const REACT_NATIVE_VERSION = '0.57.1'
    const SDK_VERSION = '32.3.0'
    const EXPO_VERSION = '2.10.4'
    const IOS_MODEL = 'iPhone 7 Plus'
    const IOS_PLATFORM = 'iPhone1,1'
    const IOS_VERSION = '11.2'
    class Dimensions {
      constructor (w = 768, h = 1024) {
        this._listeners = { change: [] }
        this._set(w, h)
      }

      addEventListener (event, cb) {
        this._listeners[event].push(cb)
      }

      get (type) {
        expect(type).toBe('screen')
        return { width: this._width, height: this._height }
      }

      _set (w, h) {
        this._width = w
        this._height = h
        this._listeners.change.forEach(handler => handler({
          screen: this.get('screen'),
          window: {}
        }))
      }
    }

    const d = new Dimensions()
    const plugin = proxyquire('../', {
      'expo-constants': {
        default: {
          platform: { ios: { model: IOS_MODEL, platform: IOS_PLATFORM, system: IOS_VERSION } },
          manifest: { sdkVersion: SDK_VERSION },
          expoVersion: EXPO_VERSION
        }
      },
      'react-native': {
        Dimensions: d,
        Platform: { OS: 'ios' }
      },
      'react-native/package.json': { version: REACT_NATIVE_VERSION }
    })
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'api_key' })
    c.configure()
    const reports = []
    c.delivery(client => ({
      sendReport: (report) => {
        const r = JSON.parse(JSON.stringify(report))
        reports.push(r)
        if (reports.length === 4) {
          expect(reports[0].events[0].device.orientation).toBe('portrait')
          expect(reports[1].events[0].device.orientation).toBe('landscape')
          expect(reports[2].events[0].device.orientation).toBe('landscape')
          expect(reports[3].events[0].device.orientation).toBe(undefined)
          done()
        }
      }
    }))
    c.use(plugin)
    expect(d._listeners.change.length).toBe(1)
    c.notify(new Error('device testing'))
    d._set(1024, 768)
    c.notify(new Error('device testing'))
    d._set(1024, 100)
    c.notify(new Error('device testing'))
    d._set(100, 100)
    c.notify(new Error('device testing'))
  })
})
