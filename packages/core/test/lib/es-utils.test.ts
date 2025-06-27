import isArray from '../../src/lib/es-utils/is-array'
import includes from '../../src/lib/es-utils/includes'

describe('es-utils', () => {
  describe('isArray(obj)', () => {
    it('works with a variety of examples', () => {
      expect(isArray([])).toBe(true)
      expect(isArray('[object Array]')).toBe(false)
      expect(isArray(0)).toBe(false)
      expect(isArray(1)).toBe(false)
      expect(isArray({})).toBe(false)
    })
  })

  describe('includes(arr, item)', () => {
    it('works with a variety of examples', () => {
      expect(includes(['a', 'b', 'c'], 'a')).toBe(true)
      expect(includes(['a', 'b', 'c'], 'd')).toBe(false)
    })
  })
})
