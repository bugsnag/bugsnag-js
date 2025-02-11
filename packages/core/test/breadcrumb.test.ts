import Breadcrumb from '../src/breadcrumb'

describe('@bugsnag/core/breadcrumb', () => {
  describe('toJSON()', () => {
    it('returns the correct data structure', () => {
      const d = new Date()
      expect(new Breadcrumb('artisan sourdough', {}, 'manual', d).toJSON()).toEqual({
        type: 'manual',
        name: 'artisan sourdough',
        metaData: {},
        timestamp: d
      })
    })
  })
})
