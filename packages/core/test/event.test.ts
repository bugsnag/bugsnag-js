import ErrorStackParser from 'error-stack-parser'
import Event from '../event'

jest.mock('stack-generator', () => ({
  backtrace: () => [{}, {}]
}))

describe('@bugsnag/core/event', () => {
  describe('constructor', () => {
    it('sets default handledState', () => {
      const err = new Error('noooooo')
      const r = new Event(err.name, err.message, ErrorStackParser.parse(err))
      expect(r._handledState.severity).toBe('warning')
      expect(r._handledState.unhandled).toBe(false)
      expect(r._handledState.severityReason).toEqual({ type: 'handledException' })
    })

    it('doesn’t create empty stackframes', () => {
      const err = new Error('noooooo')
      const r = new Event(err.name, err.message, [
        { foo: 10 },
        { toJSON: () => { throw new Error('do not serialise me, srsly') } }
      ])
      expect(r.errors[0].stacktrace.length).toBe(0)
    })
  })

  describe('addMetadata()', () => {
    it('updates a whole new section', () => {
      const r = new Event('Err', 'bad', [])
      r.addMetadata('specific detail', { extra: 'stuff' })
      expect((r._metadata)['specific detail']).toEqual({ extra: 'stuff' })
    })

    it('merges an object with an existing section', () => {
      const r = new Event('Err', 'bad', [])
      r.addMetadata('specific detail', { extra: 'stuff' })
      expect((r._metadata)['specific detail']).toEqual({ extra: 'stuff' })
      r.addMetadata('specific detail', { detail: 500 })
      expect((r._metadata)['specific detail']).toEqual({ extra: 'stuff', detail: 500 })
    })

    it('adds a single property to an existing section', () => {
      const r = new Event('Err', 'bad', [])
      r.addMetadata('specific detail', { extra: 'stuff' })
      expect((r._metadata)['specific detail']).toEqual({ extra: 'stuff' })
      r.addMetadata('specific detail', 'more', 'things')
      expect((r._metadata)['specific detail']).toEqual({ extra: 'stuff', more: 'things' })
    })

    it('creates a new section when updating a single property that doesn’t exist yet', () => {
      const r = new Event('Err', 'bad', [])
      r.addMetadata('metaaaaa', 'flip', 'flop')
      expect((r._metadata).metaaaaa).toEqual({ flip: 'flop' })
    })

    it('handles bad input', () => {
      const r = new Event('Err', 'bad', [])
      const before = Object.assign({}, r._metadata)
      // @ts-ignore
      r.addMetadata()
      expect(r._metadata).toEqual(before)
      // @ts-ignore
      r.addMetadata(123)
      expect(r._metadata).toEqual(before)
      // @ts-ignore
      r.addMetadata(new Date())
      expect(r._metadata).toEqual(before)
      // @ts-ignore
      r.addMetadata('strrrr')
      expect(r._metadata).toEqual(before)
    })

    it('removes sections and properties', () => {
      const r = new Event('Err', 'bad', [])
      r.addMetadata('metaaaaa', 'flip', 'flop')
      r.addMetadata('specific detail', { extra: 'stuff', more: 'things' })

      // @ts-ignore
      r.addMetadata('metaaaaa', null)
      expect((r._metadata).metaaaaa).toBe(undefined)

      r.addMetadata('specific detail', 'more', null)
      expect((r._metadata)['specific detail']).toEqual({ extra: 'stuff', more: null })
    })
  })

  describe('event.clearMetadata()', () => {
    it('removes things', () => {
      const r = new Event('Err', 'bad', [])

      // create some things to be removed
      r.addMetadata('specific detail', { extra: 'stuff' })
      r.addMetadata('another thing', { check: 12, t: 0 })
      expect(r._metadata).toEqual({
        'another thing': { check: 12, t: 0 },
        'specific detail': { extra: 'stuff' }
      })

      r.clearMetadata('specific detail')
      expect((r._metadata)['specific detail']).toBe(undefined)

      r.clearMetadata('another thing', 't')
      expect((r._metadata)['another thing']).toEqual({ check: 12 })
    })

    it('handles bad input', () => {
      const r = new Event('Err', 'bad', [])

      // create some things to be removed
      r.addMetadata('specific detail', { extra: 'stuff' })
      r.addMetadata('another thing', { check: 12, t: 0 })
      expect(r._metadata).toEqual({
        'another thing': { check: 12, t: 0 },
        'specific detail': { extra: 'stuff' }
      })

      // calling with bad input
      const before = Object.assign({}, r._metadata)
      // @ts-ignore
      r.clearMetadata()
      expect(r._metadata).toEqual(before)
      // @ts-ignore
      r.clearMetadata(123)
      expect(r._metadata).toEqual(before)
      // @ts-ignore
      r.clearMetadata(new Date())
      expect(r._metadata).toEqual(before)

      // removing a property of a section that doesn't exist
      r.clearMetadata('foo', 'bar')
      expect(r._metadata).toEqual(before)
    })
  })

  describe('event.getMetadata()', () => {
    it('retrieves things', () => {
      const r = new Event('Err', 'bad', [])

      // create some things to be get
      r.addMetadata('specific detail', { extra: 'stuff' })
      r.addMetadata('another thing', { check: 12, t: 0 })
      expect(r.getMetadata('another thing')).toEqual({ check: 12, t: 0 })
      expect(r.getMetadata('specific detail')).toEqual({ extra: 'stuff' })
      expect(r.getMetadata('specific detail', 'extra')).toEqual('stuff')
    })

    it('handles bad input', () => {
      const r = new Event('Err', 'bad', [])
      expect(r.getMetadata('nothing here')).toBe(undefined)
      // @ts-ignore
      expect(r.getMetadata(undefined)).toBe(undefined)
      expect(r.getMetadata('nothing here', 'or here')).toBe(undefined)
      r.addMetadata('specific detail', { extra: 'stuff' })
      expect(r.getMetadata('specific detail', 'jim')).toBe(undefined)
    })
  })

  describe('event.setUser() / event.getUser()', () => {
    it('sets and retrieves user properties', () => {
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
      const r = new Event('Err', 'bad', [])
      const reserialized = JSON.parse(JSON.stringify(r))
      expect(reserialized.payloadVersion).toBe('4')
      expect(reserialized.exceptions.length).toBe(1)
    })
  })
})
