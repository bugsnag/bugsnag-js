import { schema } from '../renderer'

describe('renderer process client config schema', () => {
  describe('codeBundleId', () => {
    it('defaults to undefined', () => {
      expect(schema.codeBundleId.defaultValue()).toBe(undefined)
    })
  })
})
