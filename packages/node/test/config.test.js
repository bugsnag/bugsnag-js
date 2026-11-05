const config = require('../src/config')

describe('Node delivery configuration', () => {
  it('leaves all delivery limits disabled by default', () => {
    expect(config.deliveryOptions.defaultValue()).toBeUndefined()
    expect(config.onDelivery.defaultValue()).toBeUndefined()
    expect(config.deliveryOptions.validate(undefined)).toBe(true)
    expect(config.deliveryOptions.validate({})).toBe(true)
  })

  it('accepts individual and combined positive integer limits', () => {
    const limits = { maxInFlight: 2, timeoutMs: 100, maxRequestBytes: 1024, maxResponseBytes: 256 }
    expect(config.deliveryOptions.validate(limits)).toBe(true)
    expect(config.deliveryOptions.validate({ ...limits, timeoutMs: undefined })).toBe(true)
    for (const key of Object.keys(limits)) expect(config.deliveryOptions.validate({ [key]: limits[key] })).toBe(true)
    expect(config.onDelivery.validate(() => {})).toBe(true)
  })

  it('rejects unknown options, invalid numbers and timer overflow', () => {
    for (const value of [null, [], 1, true, { unknown: 2 }]) expect(config.deliveryOptions.validate(value)).toBe(false)
    for (const value of [0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '2']) {
      expect(config.deliveryOptions.validate({ maxInFlight: value })).toBe(false)
    }
    expect(config.deliveryOptions.validate({ timeoutMs: 2147483648 })).toBe(false)
    expect(config.onDelivery.validate(null)).toBe(false)
  })
})
