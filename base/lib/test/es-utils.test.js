const { describe, it, expect } = global

const { map, reduce, filter, keys, isArray, includes } = require('../es-utils')

describe('us-utils', () => {
  describe('reduce(arr, fn, accum)', () => {
    it('works with a variety of examples', () => {
      expect(reduce([ 1, 2, 3, 4, 5 ], (accum, x) => accum + x, 0)).toBe(15)
      expect(reduce([ () => 100, () => 250, () => 25 ], (accum, x) => Math.max(x(), accum), -Infinity)).toBe(250)
    })
  })

  describe('map(arr, fn)', () => {
    it('works with a variety of examples', () => {
      expect(map([ 'a', 'b', 'c' ], x => x)).toEqual([ 'a', 'b', 'c' ])
      expect(map([ 'a', 'b', 'c' ], (x) => x.toUpperCase())).toEqual([ 'A', 'B', 'C' ])
    })
  })

  describe('filter(arr, fn)', () => {
    it('works with a variety of examples', () => {
      const arr = [ 'a', 0, false, undefined, 1, 'undefined' ]
      expect(filter(arr, () => true)).toEqual(arr)
      expect(filter(arr, () => false)).toEqual([])
      expect(filter(arr, Boolean)).toEqual([ 'a', 1, 'undefined' ])
    })
  })

  describe('keys(obj)', () => {
    it('works with a variety of examples', () => {
      expect(keys({ a: 1, b: 2 })).toEqual([ 'a', 'b' ])
      expect(keys({ toString: 2 })).toEqual([ 'toString' ])
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
      expect(includes([ 'a', 'b', 'c' ], 'a')).toBe(true)
      expect(includes([ 'a', 'b', 'c' ], 'd')).toBe(false)
    })
  })
})
