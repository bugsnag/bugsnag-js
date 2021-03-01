import { schema } from '../main'
// @ts-expect-error TS doesn't like the following line because electron is not installed
import * as electron from 'electron'

jest.mock('electron', () => ({
  app: {}
}), { virtual: true })

afterEach(() => jest.resetAllMocks())

describe('main process client config schema', () => {
  describe('enabledErrorTypes', () => {
    it('allows valid values', () => {
      expect(schema.enabledErrorTypes.validate({})).toBe(true)
      expect(schema.enabledErrorTypes.validate({
        nativeCrashes: false
      })).toBe(true)
      expect(schema.enabledErrorTypes.validate({
        unhandledRejections: false, nativeCrashes: false
      })).toBe(true)
      expect(schema.enabledErrorTypes.validate({
        unhandledExceptions: true, unhandledRejections: false, nativeCrashes: false
      })).toBe(true)
    })

    it('rejects invalid values', () => {
      expect(schema.enabledErrorTypes.validate({ unexpectedProperty: true })).toBe(false)
      expect(schema.enabledErrorTypes.validate({ unhandledExceptions: 1 })).toBe(false)
    })
  })

  describe('endpoints', () => {
    it('allows valid config', () => {
      expect(schema.endpoints.validate({
        notify: 'http://fakeurl.xyz/n',
        sessions: 'http://fakeurl.xyz/s',
        minidumps: 'http://fakeurl.xyz/m'
      })).toBe(true)
    })

    it('rejects invalid values', () => {
      expect(schema.endpoints.validate({
        notify: 'http://fakeurl.xyz/n',
        minidumps: 'http://fakeurl.xyz/m'
      })).toBe(false)

      expect(schema.endpoints.validate({
        notify: 'http://fakeurl.xyz/n',
        sessions: 'http://fakeurl.xyz/s',
        minidumps: ''
      })).toBe(false)
    })
  })

  describe('releaseStage', () => {
    it('sets the correct default based on the value of electron.app.isPackaged', () => {
      electron.app.isPackaged = true
      expect(schema.releaseStage.defaultValue()).toBe('production')
      electron.app.isPackaged = false
      expect(schema.releaseStage.defaultValue()).toBe('development')
    })
  })
})
