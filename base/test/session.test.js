const { describe, it, expect } = global

const Session = require('../session')

describe('base/session', () => {
  describe('toJSON()', () => {
    it('returns the correct data structure', () => {
      const s = new Session().toJSON()
      expect(typeof s.id).toBe('string')
      expect(typeof s.startedAt).toBe('string')
      expect(s.events).toEqual({ handled: 0, unhandled: 0 })
    })
  })
  describe('trackError()', () => {
    it('returns the correct data structure', () => {
      const s = new Session()
      s.trackError({ _handledState: { unhandled: true } })
      s.trackError({ _handledState: { unhandled: false } })
      s.trackError({ _handledState: { unhandled: true } })
      s.trackError({ _handledState: { unhandled: true } })
      s.trackError({ _handledState: { unhandled: false } })
      expect(s.toJSON().events).toEqual({ handled: 2, unhandled: 3 })
    })
  })
})
