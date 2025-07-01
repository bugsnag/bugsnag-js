import includes from '../../src/lib/es-utils/includes'

describe('es-utils', () => {
  describe('includes(arr, item)', () => {
    it('works with a variety of examples', () => {
      expect(includes(['a', 'b', 'c'], 'a')).toBe(true)
      expect(includes(['a', 'b', 'c'], 'd')).toBe(false)
    })
  })
})
