const { describe, it, expect } = global

const Session = require('../session')

describe('@bugsnag/core/session', () => {
  describe('toJSON()', () => {
    it('returns the correct data structure', () => {
      const s = new Session().toJSON()
      expect(typeof s.id).toBe('string')
      expect(typeof s.startedAt).toBe('string')
      expect(s.events).toEqual({ handled: 0, unhandled: 0 })
    })
  })
  describe('track()', () => {
    it('returns the correct data structure', () => {
      const s = new Session()
      s.track({ _handledState: { unhandled: true } })
      s.track({ _handledState: { unhandled: false } })
      s.track({ _handledState: { unhandled: true } })
      s.track({ _handledState: { unhandled: true } })
      s.track({ _handledState: { unhandled: false } })
      expect(s.toJSON().events).toEqual({ handled: 2, unhandled: 3 })
    })
  })
})
