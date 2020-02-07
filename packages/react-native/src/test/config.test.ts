import { schema, load } from '../config'

describe('react-native config: load()', () => {
  it('should load config from the provided NativeClient', () => {
    const mockNativeClient = {
      configure: () => ({
        apiKey: '123'
      })
    }
    const config = load(mockNativeClient)
    expect(config.apiKey).toBe('123')
    expect(config._didLoadFromConfig).toBe(true)
    expect(config._originalValues).toEqual({ apiKey: '123' })
  })

  it('should throw if the provided NativeClient didn’t provide an object', () => {
    const mockNativeClient = {
      configure: () => {}
    }
    expect(() => {
      load(mockNativeClient)
    }).toThrow(/Configuration could not be loaded from native client/)
  })

  it('should throw if the user attempts to modify native config', () => {
    const mockNativeClient = {
      configure: () => ({
        apiKey: '123',
        autoDetectErrors: true
      })
    }
    expect(() => {
      const config = load(mockNativeClient)
      config.apiKey = '456'
    }).toThrow(/Cannot set "apiKey" configuration option in JS. This must be set in the native layer./)
    expect(() => {
      const config = load(mockNativeClient)
      config.autoDetectErrors = false
    }).toThrow(/Cannot set "autoDetectErrors" configuration option in JS. This must be set in the native layer./)
  })
})
