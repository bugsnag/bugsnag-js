import Breadcrumb from '../breadcrumb'

describe('@bugsnag/core/breadcrumb', () => {
  describe('toJSON()', () => {
    it('returns the correct data structure', () => {
      const d = (new Date()).toISOString()
      expect(new Breadcrumb('artisan sourdough', {}, 'manual', d).toJSON()).toEqual({
        type: 'manual',
        name: 'artisan sourdough',
        metaData: {},
        timestamp: d
      })
    })
  })
})
