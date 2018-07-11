const { describe, it, expect } = global

const proxyquire = require('proxyquire').noPreserveCache()
const ErrorStackParser = require('error-stack-parser')

describe('base/report', () => {
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
      expect(r.stacktrace.length).toBe(0)
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
      expect(r1.stacktrace.length).toEqual(0)
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

  describe('updateMetaData()', () => {
    it('updates a whole new section', () => {
      const Report = require('../report')
      const r = new Report('Err', 'bad', [])
      r.updateMetaData('specific detail', { extra: 'stuff' })
      expect(r.metaData['specific detail']).toEqual({ extra: 'stuff' })
    })

    it('merges an object with an existing section', () => {
      const Report = require('../report')
      const r = new Report('Err', 'bad', [])
      r.updateMetaData('specific detail', { extra: 'stuff' })
      expect(r.metaData['specific detail']).toEqual({ extra: 'stuff' })
      r.updateMetaData('specific detail', { detail: 500 })
      expect(r.metaData['specific detail']).toEqual({ extra: 'stuff', detail: 500 })
    })

    it('adds a single property to an existing section', () => {
      const Report = require('../report')
      const r = new Report('Err', 'bad', [])
      r.updateMetaData('specific detail', { extra: 'stuff' })
      expect(r.metaData['specific detail']).toEqual({ extra: 'stuff' })
      r.updateMetaData('specific detail', 'more', 'things')
      expect(r.metaData['specific detail']).toEqual({ extra: 'stuff', more: 'things' })
    })

    it('creates a new section when updating a single property that doesn’t exist yet', () => {
      const Report = require('../report')
      const r = new Report('Err', 'bad', [])
      r.updateMetaData('metaaaaa', 'flip', 'flop')
      expect(r.metaData['metaaaaa']).toEqual({ flip: 'flop' })
    })

    it('handles bad input', () => {
      const Report = require('../report')
      const r = new Report('Err', 'bad', [])
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
      const Report = require('../report')
      const r = new Report('Err', 'bad', [])
      r.updateMetaData('metaaaaa', 'flip', 'flop')
      r.updateMetaData('specific detail', { extra: 'stuff', more: 'things' })

      r.updateMetaData('metaaaaa', null)
      expect(r.metaData['metaaaaa']).toBe(undefined)

      r.updateMetaData('specific detail', 'more', null)
      expect(r.metaData['specific detail']).toEqual({ extra: 'stuff' })
    })
  })

  describe('report.removeMetaData()', () => {
    it('removes things', () => {
      const Report = require('../report')
      const r = new Report('Err', 'bad', [])

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
      const Report = require('../report')
      const r = new Report('Err', 'bad', [])

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

  describe('report.toJSON()', () => {
    it('serializes correctly', () => {
      const Report = require('../report')
      const r = new Report('Err', 'bad', [])
      const reserialized = JSON.parse(JSON.stringify(r))
      expect(reserialized.payloadVersion).toBe('4')
      expect(reserialized.exceptions.length).toBe(1)
    })
  })
})
