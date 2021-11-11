import { schema } from '../main'
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
        sessions: 'http://fakeurl.xyz/s'
      })).toBe(true)

      expect(schema.endpoints.validate({
        notify: 'http://fakeurl.xyz/n',
        sessions: 'http://fakeurl.xyz/s',
        minidumps: 'http://fakeurl.xyz/m'
      })).toBe(true)
    })

    it('rejects invalid values', () => {
      expect(schema.endpoints.validate({
        notify: 'http://fakeurl.xyz/n'
      })).toBe(false)

      expect(schema.endpoints.validate({
        notify: 'http://fakeurl.xyz/n',
        sessions: ''
      })).toBe(false)
    })
  })

  describe('releaseStage', () => {
    it('is "production" when the app is packaged', () => {
      (electron.app as unknown as any).isPackaged = true
      expect(schema.releaseStage.defaultValue()).toBe('production')
    })

    it('is "development" when the app is not packaged', () => {
      (electron.app as unknown as any).isPackaged = false
      expect(schema.releaseStage.defaultValue()).toBe('development')
    })
  })
})
