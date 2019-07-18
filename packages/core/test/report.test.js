const { describe, it, expect } = global

const proxyquire = require('proxyquire').noPreserveCache()
const ErrorStackParser = require('error-stack-parser')

describe('@bugsnag/core/report', () => {
  describe('constructor', () => {
    it('sets default handledState', () => {
      const Report = require('../report')
      const err = new Error('noooooo')
      const r = new Report(err.name, err.message, ErrorStackParser.parse(err))
      expect(r._handledState.severity).toBe('warning')
      expect(r._handledState.unhandled).toBe(false)
      expect(r._handledState.severityReason).toEqual({ type: 'handledException' })
    })

    it('doesn’t create empty stackframes', () => {
      const Report = require('../report')
      const err = new Error('noooooo')
      const r = new Report(err.name, err.message, [
        { foo: 10 },
        { toJSON: () => { throw new Error('do not serialise me, srsly') } }
      ])
      expect(r.get('stacktrace').length).toBe(0)
    })
  })

  describe('BugsnagReport.ensureReport()', () => {
    it('creates a report from an error', () => {
      const Report = proxyquire('../report', {
        'stack-generator': {
          backtrace: () => [ {}, {} ]
        }
      })
      const r0 = Report.ensureReport(new Error('normal error'))
      expect(r0 instanceof Report).toBe(true)

      const e = new Error('normal error')
      delete e.stack
      const r1 = Report.ensureReport(e)
      expect(r1 instanceof Report).toBe(true)
      expect(r1.get('stacktrace').length).toEqual(0)
    })

    it('returns the same report if passed', () => {
      const Report = require('../report')
      const r = new Report('E', 'bad', [])
      const r0 = Report.ensureReport(r)
      expect(r).toBe(r0)
    })
  })

  describe('ignore()', () => {
    it('updates the return value of .isIgnored()', () => {
      const Report = require('../report')
      const r = new Report('Err', 'bad', [])
      r.ignore()
      expect(r.isIgnored()).toBe(true)
    })
  })

  describe('set()', () => {
    it('updates a whole new section', () => {
      const Report = require('../report')
      const r = new Report('Err', 'bad', [])
      r.set('specific detail', { extra: 'stuff' })
      expect(r.toJSON().metaData['specific detail']).toEqual({ extra: 'stuff' })
    })

    it('merges an object with an existing section', () => {
      const Report = require('../report')
      const r = new Report('Err', 'bad', [])
      r.set('specific detail', { extra: 'stuff' })
      expect(r.toJSON().metaData['specific detail']).toEqual({ extra: 'stuff' })
      r.set('specific detail', { detail: 500 })
      expect(r.toJSON().metaData['specific detail']).toEqual({ extra: 'stuff', detail: 500 })
    })

    it('adds a single property to an existing section', () => {
      const Report = require('../report')
      const r = new Report('Err', 'bad', [])
      r.set('specific detail', { extra: 'stuff' })
      expect(r.toJSON().metaData['specific detail']).toEqual({ extra: 'stuff' })
      r.set('specific detail', 'more', 'things')
      expect(r.toJSON().metaData['specific detail']).toEqual({ extra: 'stuff', more: 'things' })
    })

    it('creates a new section when updating a single property that doesn’t exist yet', () => {
      const Report = require('../report')
      const r = new Report('Err', 'bad', [])
      r.set('metaaaaa', 'flip', 'flop')
      expect(r.toJSON().metaData['metaaaaa']).toEqual({ flip: 'flop' })
    })

    it('handles bad input', () => {
      const Report = require('../report')
      const r = new Report('Err', 'bad', [])
      const before = Object.assign({}, r.toJSON().metaData)
      r.set()
      expect(r.toJSON().metaData).toEqual(before)
      r.set(123)
      expect(r.toJSON().metaData).toEqual(before)
      r.set(new Date())
      expect(r.toJSON().metaData).toEqual(before)
      r.set('strrrr')
      expect(r.toJSON().metaData).toEqual(before)
    })

    it('removes sections and properties', () => {
      const Report = require('../report')
      const r = new Report('Err', 'bad', [])
      r.set('metaaaaa', 'flip', 'flop')
      r.set('specific detail', { extra: 'stuff', more: 'things' })

      r.clear('metaaaaa')
      expect(r.toJSON().metaData['metaaaaa']).toBe(undefined)

      r.clear('specific detail', 'more')
      expect(r.toJSON().metaData['specific detail']).toEqual({ extra: 'stuff' })
    })
  })

  describe('report.clear()', () => {
    it('removes things', () => {
      const Report = require('../report')
      const r = new Report('Err', 'bad', [])
      const originalMetaData = r.toJSON().metaData

      // create some things to be removed
      r.set('specific detail', { extra: 'stuff' })
      r.set('another thing', { check: 12, t: 0 })
      expect(r.toJSON().metaData).toEqual({
        ...originalMetaData,
        'another thing': { check: 12, t: 0 },
        'specific detail': { extra: 'stuff' }
      })

      r.clear('specific detail')
      expect(r.toJSON().metaData['specific detail']).toBe(undefined)

      r.clear('another thing', 't')
      expect(r.toJSON().metaData['another thing']).toEqual({ check: 12 })
    })

    it('handles bad input', () => {
      const Report = require('../report')
      const r = new Report('Err', 'bad', [])
      const originalMetaData = r.toJSON().metaData

      // create some things to be removed
      r.set('specific detail', { extra: 'stuff' })
      r.set('another thing', { check: 12, t: 0 })
      expect(r.toJSON().metaData).toEqual({
        ...originalMetaData,
        'another thing': { check: 12, t: 0 },
        'specific detail': { extra: 'stuff' }
      })

      // calling with bad input
      const before = Object.assign({}, r.toJSON().metaData)
      r.clear()
      expect(r.toJSON().metaData).toEqual(before)
      r.clear(123)
      expect(r.toJSON().metaData).toEqual(before)
      r.clear(new Date())
      expect(r.toJSON().metaData).toEqual(before)

      // removing a property of a section that doesn't exist
      r.clear('foo', 'bar')
      expect(r.toJSON().metaData).toEqual(before)
    })
  })

  describe('report.toJSON()', () => {
    it('serializes correctly', () => {
      const Report = require('../report')
      const r = new Report('Err', 'bad', [])
      const deserialized = JSON.parse(JSON.stringify(r))
      expect(deserialized.payloadVersion).toBe('4')
      expect(deserialized.exceptions.length).toBe(1)
    })
  })
})
