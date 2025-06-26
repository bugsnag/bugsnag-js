import reduce from '../../src/lib/es-utils/reduce'
import keys from '../../src/lib/es-utils/keys'
import isArray from '../../src/lib/es-utils/is-array'
import includes from '../../src/lib/es-utils/includes'

describe('es-utils', () => {
  describe('reduce(arr, fn, accum)', () => {
    it('works with a variety of examples', () => {
      expect(reduce([1, 2, 3, 4, 5], (accum, x) => accum + x, 0)).toBe(15)
      expect(reduce([() => 100, () => 250, () => 25], (accum, x) => Math.max(x(), accum), -Infinity)).toBe(250)
    })
  })

  describe('keys(obj)', () => {
    it('works with a variety of examples', () => {
      expect(keys({ a: 1, b: 2 })).toEqual(['a', 'b'])
      expect(keys({ toString: 2 })).toEqual(['toString'])
    })
  })

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
