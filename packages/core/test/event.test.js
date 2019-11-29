const { describe, it, expect } = global

const proxyquire = require('proxyquire').noPreserveCache()
const ErrorStackParser = require('error-stack-parser')

describe('@bugsnag/core/event', () => {
  describe('constructor', () => {
    it('sets default handledState', () => {
      const Event = require('../event')
      const err = new Error('noooooo')
      const r = new Event(err.name, err.message, ErrorStackParser.parse(err))
      expect(r._handledState.severity).toBe('warning')
      expect(r._handledState.unhandled).toBe(false)
      expect(r._handledState.severityReason).toEqual({ type: 'handledException' })
    })

    it('doesn’t create empty stackframes', () => {
      const Event = require('../event')
      const err = new Error('noooooo')
      const r = new Event(err.name, err.message, [
        { foo: 10 },
        { toJSON: () => { throw new Error('do not serialise me, srsly') } }
      ])
      expect(r.stacktrace.length).toBe(0)
    })
  })

  describe('BugsnagEvent.ensureEvent()', () => {
    it('creates an event from an error', () => {
      const Event = proxyquire('../event', {
        'stack-generator': {
          backtrace: () => [{}, {}]
        }
      })
      const r0 = Event.ensureEvent(new Error('normal error'))
      expect(r0 instanceof Event).toBe(true)

      const e = new Error('normal error')
      delete e.stack
      const r1 = Event.ensureEvent(e)
      expect(r1 instanceof Event).toBe(true)
      expect(r1.stacktrace.length).toEqual(0)
    })

    it('returns the same event if passed', () => {
      const Event = require('../event')
      const r = new Event('E', 'bad', [])
      const r0 = Event.ensureEvent(r)
      expect(r).toBe(r0)
    })
  })

  describe('updateMetaData()', () => {
    it('updates a whole new section', () => {
      const Event = require('../event')
      const r = new Event('Err', 'bad', [])
      r.updateMetaData('specific detail', { extra: 'stuff' })
      expect(r.metaData['specific detail']).toEqual({ extra: 'stuff' })
    })

    it('merges an object with an existing section', () => {
      const Event = require('../event')
      const r = new Event('Err', 'bad', [])
      r.updateMetaData('specific detail', { extra: 'stuff' })
      expect(r.metaData['specific detail']).toEqual({ extra: 'stuff' })
      r.updateMetaData('specific detail', { detail: 500 })
      expect(r.metaData['specific detail']).toEqual({ extra: 'stuff', detail: 500 })
    })

    it('adds a single property to an existing section', () => {
      const Event = require('../event')
      const r = new Event('Err', 'bad', [])
      r.updateMetaData('specific detail', { extra: 'stuff' })
      expect(r.metaData['specific detail']).toEqual({ extra: 'stuff' })
      r.updateMetaData('specific detail', 'more', 'things')
      expect(r.metaData['specific detail']).toEqual({ extra: 'stuff', more: 'things' })
    })

    it('creates a new section when updating a single property that doesn’t exist yet', () => {
      const Event = require('../event')
      const r = new Event('Err', 'bad', [])
      r.updateMetaData('metaaaaa', 'flip', 'flop')
      expect(r.metaData.metaaaaa).toEqual({ flip: 'flop' })
    })

    it('handles bad input', () => {
      const Event = require('../event')
      const r = new Event('Err', 'bad', [])
      const before = Object.assign({}, r.metaData)
      r.updateMetaData()
      expect(r.metaData).toEqual(before)
      r.updateMetaData(123)
      expect(r.metaData).toEqual(before)
      r.updateMetaData(new Date())
      expect(r.metaData).toEqual(before)
      r.updateMetaData('strrrr')
      expect(r.metaData).toEqual(before)
    })

    it('removes sections and properties', () => {
      const Event = require('../event')
      const r = new Event('Err', 'bad', [])
      r.updateMetaData('metaaaaa', 'flip', 'flop')
      r.updateMetaData('specific detail', { extra: 'stuff', more: 'things' })

      r.updateMetaData('metaaaaa', null)
      expect(r.metaData.metaaaaa).toBe(undefined)

      r.updateMetaData('specific detail', 'more', null)
      expect(r.metaData['specific detail']).toEqual({ extra: 'stuff' })
    })
  })

  describe('event.removeMetaData()', () => {
    it('removes things', () => {
      const Event = require('../event')
      const r = new Event('Err', 'bad', [])

      // create some things to be removed
      r.updateMetaData('specific detail', { extra: 'stuff' })
      r.updateMetaData('another thing', { check: 12, t: 0 })
      expect(r.metaData).toEqual({
        'another thing': { check: 12, t: 0 },
        'specific detail': { extra: 'stuff' }
      })

      r.removeMetaData('specific detail')
      expect(r.metaData['specific detail']).toBe(undefined)

      r.removeMetaData('another thing', 't')
      expect(r.metaData['another thing']).toEqual({ check: 12 })
    })

    it('handles bad input', () => {
      const Event = require('../event')
      const r = new Event('Err', 'bad', [])

      // create some things to be removed
      r.updateMetaData('specific detail', { extra: 'stuff' })
      r.updateMetaData('another thing', { check: 12, t: 0 })
      expect(r.metaData).toEqual({
        'another thing': { check: 12, t: 0 },
        'specific detail': { extra: 'stuff' }
      })

      // calling with bad input
      const before = Object.assign({}, r.metaData)
      r.removeMetaData()
      expect(r.metaData).toEqual(before)
      r.removeMetaData(123)
      expect(r.metaData).toEqual(before)
      r.removeMetaData(new Date())
      expect(r.metaData).toEqual(before)

      // removing a property of a section that doesn't exist
      r.removeMetaData('foo', 'bar')
      expect(r.metaData).toEqual(before)
    })
  })

  describe('event.setUser() / event.getUser()', () => {
    it('sets and retrieves user properties', () => {
      const Event = require('../event')
      const r = new Event('Err', 'bad', [])
      r.setUser('123')
      expect(r.getUser()).toEqual({ id: '123', email: undefined, name: undefined })
      r.setUser('123', 'bug@sn.ag')
      expect(r.getUser()).toEqual({ id: '123', email: 'bug@sn.ag', name: undefined })
      r.setUser('123', 'bug@sn.ag', 'Bug S. Nag')
      expect(r.getUser()).toEqual({ id: '123', email: 'bug@sn.ag', name: 'Bug S. Nag' })
      r.setUser()
      expect(r.getUser()).toEqual({ id: undefined, email: undefined, name: undefined })
    })
  })

  describe('event.toJSON()', () => {
    it('serializes correctly', () => {
      const Event = require('../event')
      const r = new Event('Err', 'bad', [])
      const reserialized = JSON.parse(JSON.stringify(r))
      expect(reserialized.payloadVersion).toBe('4')
      expect(reserialized.exceptions.length).toBe(1)
    })
  })
})
